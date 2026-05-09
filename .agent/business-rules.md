# 🧠 Business Logic

Este archivo documenta todas las reglas de negocio críticas que rigen el comportamiento dinámico del sistema.

---

## 🏦 Gestión de Sesiones de Caja (`cashier-sessions`)

### Apertura
- Un usuario solo puede tener **una sesión `OPEN` a la vez**. Intentar abrir una segunda sesión sin cerrar la anterior lanza `409 Conflict`.
- El cajero registra un `initialAmount` (monto físico en caja al abrir turno).
- **El servidor genera `openingDate`** con `new Date()` — el frontend **no** envía timestamp de apertura.
- El sistema inicializa `totalCash`, `totalQr`, `totalSales` y `orderCount` en `0`.

### Acumulación de Ventas (en tiempo real)
- Cada vez que se crea una orden exitosa, `addOrderToSession()` actualiza atómicamente:
  - `totalCash += total` (si `paymentMethod = 'CASH'`)
  - `totalQr += total` (si `paymentMethod = 'QR'`)
  - `totalSales += total`
  - `orderCount += 1`
- Si se cancela una orden, `deductOrderFromSession()` hace la operación inversa, manteniendo la integridad del arqueo.

> [!IMPORTANT]
> Los valores numéricos de la sesión se almacenan como `decimal(10,2)` en PostgreSQL. Al operar, se convierten explícitamente con `Number()` para evitar concatenación de strings: `session.totalCash = Number(session.totalCash) + Number(orderTotal)`.

### Cierre y Arqueo
- Al cerrar, el cajero provee `closingCashAmount` y `closingQrAmount` (los valores físicos contados).
- **El servidor genera `closingDate`** con `new Date()` — el frontend **no** envía timestamp de cierre.
- El sistema calcula la **diferencia total** automáticamente (efectivo + QR):
  ```
  cashDifference = closingCashAmount - (initialAmount + totalCash)
  qrDifference   = closingQrAmount - totalQr
  difference     = cashDifference + qrDifference
  ```
  - Diferencia positiva (sobra) o negativa (falta) indica discrepancias en el manejo de caja.
- La respuesta del cierre incluye un `summary` detallado con: `sessionId`, `startTime`, `endTime`, `initialCash`, `cashSales`, `qrSales`, `totalExpectedCash`, `declaredCash`, `totalExpectedQr`, `declaredQr`, `difference`, `totalOrders`.
- No se puede cerrar una sesión ya `CLOSED`.
- No se puede eliminar una sesión que tenga órdenes registradas (`orderCount > 0`).

### Estadísticas de Sesión (`getSessionStatistics`)
Devuelve un resumen completo con:
- Efectivo esperado: `initialAmount + totalCash`
- QR esperado: `totalQr`
- Conteo de órdenes por método de pago (excluyendo CANCELLED)
- Ticket promedio: `totalSales / orderCount`
- Persona responsable (nombre, email, rol)
- Estado actual de la sesión
- `closingDate` (si existe)

### Órdenes de una Sesión (`getSessionOrders`)
Devuelve todas las órdenes de una sesión específica ordenadas por `orderDate ASC`, con relaciones `details` y `details.product` cargadas. Usado para generar el reporte PDF individual de sesión.

### Filtrado por Fecha
El endpoint `GET /api/cashier-sessions` soporta los filtros:
- `period=7d` → últimos 7 días (default si no se envía nada)
- `period=this-month` → desde el 1ro del mes actual
- `startDate` + `endDate` → rango personalizado (ISO: `YYYY-MM-DD`)

---

## 🧾 Ciclo de Vida de una Orden

### 1. Creación
**Validaciones previas:**
1. La sesión referenciada debe existir y estar `OPEN`.
2. Todos los productos del pedido deben existir y estar activos (`isActive = true`).
3. Si `paymentMethod = 'CASH'`, se valida que `amountPaid >= total`. Si no, `400 Bad Request`.

**Proceso de creación:**
1. Se calculan `subtotal` y `total` desde los precios actuales de los productos.
2. Se calcula `changeAmount = amountPaid - total` (solo para CASH, si no es 0).
3. Se genera el `orderNumber` único: formato `ORD-S{sessionId}-{NNN}` donde `NNN` es el conteo de órdenes de esa sesión más 1 con cero-relleno izquierdo (3 dígitos).
4. Se crea el `Order` con `orderStatus = 'PENDING'`.
5. Se crean los `OrderDetail` con el `unit_price` congelado al precio actual del producto.
6. Se actualiza la sesión de caja con los totales acumulados (`addOrderToSession()`).
7. **Se emite evento WebSocket `new_order`** con la orden completa.

**Campos obligatorios en `CreateOrderDto`:**
- `sessionId`, `cashierId`, `paymentMethod`, `orderType`, `items[]` (con `productId` y `quantity`)
- `amountPaid` (requerido si `paymentMethod = 'CASH'`)

### 2. Transiciones de Estado (State Machine)

```
PENDING ──────────────────────────────────────────── CANCELLED
   │                                                      ▲
   ▼                                                      │
IN_PREPARATION ──────────────────────────────────── CANCELLED
   │              (al pasar a IN_PREPARATION:             ▲
   │               se asigna cookId y                     │
   │               preparationStartDate)                  │
   ▼                                                      │
READY ─────────────────────────────────────────────CANCELLED
   │                                                      ▲
   ▼                                                      │
DELIVERED  ←── completedDate se fija en DELIVERED         │
   │                                                      │
   └─────────────────────────────── (DELIVERED no puede ir a CANCELLED)
```

**Reglas:**
- Solo se pueden hacer transiciones válidas. Cualquier transición inválida lanza `400 Bad Request`.
- `DELIVERED` y `CANCELLED` son estados finales (sin transiciones posibles).
- `completedDate` se fija cuando el estado pasa a `DELIVERED` (no en `READY`).
- La cocina solamente puede operar en el endpoint `PATCH /api/orders/:id/status`.
- **Se emite evento WebSocket `order_status_updated`** con la orden actualizada después de cualquier cambio de estado.

### 3. Cancelación
- Solo se pueden cancelar órdenes que no estén en `DELIVERED`.
- Al cancelar:
  1. Se llama `deductOrderFromSession()` para restar el total de los acumulados de la sesión.
  2. `orderStatus` pasa a `CANCELLED`.
  3. Opcionalmente se registra una razón en `observations`.
  4. **Se emite evento WebSocket `order_status_updated`** para notificar a la cocina.
- Las órdenes canceladas se pueden eliminar físicamente (solo ADMIN via `DELETE /api/orders/:id`), pero solo si ya están en estado `CANCELLED`.

### 4. Vista de Cocina (`getKitchenDisplayOrders`)
- Solo muestra órdenes con status `PENDING`, `IN_PREPARATION`, `READY`.
- Filtra por las **últimas 18 horas** (para evitar mostrar órdenes antiguas).
- Orden: **FIFO** (primero las más antiguas → `orderDate ASC`).

### 5. Historial de Cocina (`getKitchenHistoryOrders`)
- Muestra órdenes con status `DELIVERED` o `CANCELLED`.
- También filtra por las últimas 18 horas.
- Orden: **LIFO** (más recientes primero → `orderDate DESC`).

---

## 📊 Dashboard Administrativo (`getAdminDashboardStats`)

Endpoint `GET /api/orders/metrics/dashboard` (solo ADMIN). Acepta filtros de fecha iguales a los de sesiones:

| Métrica | Cálculo |
| :--- | :--- |
| `totalSales` | `SUM(total)` de órdenes no CANCELLED |
| `orderCount` | `COUNT(idOrder)` de órdenes no CANCELLED |
| `averageTicket` | `totalSales / orderCount` |
| `averageKitchenTime` | `AVG(completedDate - orderDate)` en minutos, solo para DELIVERED |
| `channels.dineIn` | Count de `DINE_IN` no CANCELLED |
| `channels.takeout` | Count de `TAKEOUT` no CANCELLED |
| `topProducts` | TOP productos por `SUM(quantity)`, incluye `name` e `imageUrl` |

### Reporte de Cancelaciones (`getCancelledOrdersReport`)
Endpoint `GET /api/orders/metrics/cancellations` (solo ADMIN). Devuelve órdenes canceladas con detalles de productos y cajero.

---

## 🔊 Anuncios TTS para Cocina

Cuando un pedido pasa a estado `READY` en la cocina, el frontend solicita audio al backend:
1. Frontend llama `GET /api/tts/pedido/{numero}` (número entero, 1-9999).
2. Backend genera audio MP3 con voz `es-MX-DaliaNeural` diciendo "Pedido número {N}, por favor".
3. Audio se cachea en memoria por número de pedido (`Map<number, Buffer>`).
4. Frontend reproduce el audio mediante un `AudioQueueManager` que procesa secuencialmente.

---

## 🖼️ Manejo de Imágenes de Productos

- **Flujo de subida**: Admin sube imagen → Multer recibe el archivo en memoria → `CloudinaryService.uploadImage()` → URL pública almacenada en `products.image_url`.
- **Flujo de actualización**: Si se actualiza la imagen, primero se elimina la anterior en Cloudinary (`deleteImage(oldUrl)`) y luego se sube la nueva.
- **Flujo de eliminación de producto**: Al hacer soft-delete de un producto, la imagen en Cloudinary **no** se elimina (el registro histórico en orders lo necesita).
- **Extracción de PublicId**: El servicio parsea la URL de Cloudinary para extraer el `publicId` necesario para borrarla: `{folder}/{filename_sin_extension}`.

---

## 📋 Productos y Categorías

- Un producto puede ser activado/desactivado con `PATCH /api/products/:id/toggle-active`.
- No se puede eliminar físicamente un producto que tenga detalles de orden asociados.
- Las categorías tienen un campo `order` para ordenamiento visual (0 = primera posición).
- Se pueden agrupar productos por categoría con `GET /api/products/grouped-by-category` (todos) o `GET /api/products/active-grouped` (solo activos).
- La búsqueda de productos `GET /api/products/search?q=...` busca por `name`, `code` y `description` (LIKE).

## 📺 Configuraciones de Pantalla TV (Display)

### 1. Gestión de Pantallas (Admin)
- Las configuraciones de pantalla permiten personalizar qué productos y cómo se muestran en TVs externas.
- **Access Token**: Al crear una configuración, el servidor genera un `accessToken` único de 6 caracteres alfanuméricos.
  - El alfabeto excluye caracteres ambiguos (`0`, `O`, `1`, `I`, `L`) para facilitar su escritura manual en la TV.
- **Categorización**: Se puede configurar una categoría específica o dejarla como `null` para mostrar todos los productos del menú.
- **Personalización Visual**: Se pueden configurar el intervalo de rotación (3-60s), tipo de transición (`slide`, `fade`, `zoom`), mostrar/ocultar precios y descripciones, y la cantidad de productos por slide (1-6).

### 2. Acceso Público (TV)
- El endpoint `GET /api/display/{token}` es **público** (sin JWT).
- Solo permite acceso si `isActive = true`. Si la configuración está desactivada, devuelve `404 Not Found`.
- Los datos devueltos están filtrados para la TV: solo productos activos de la categoría seleccionada (o todos si no hay categoría).
- El servidor **no** expone el `accessToken` ni campos internos (`isActive`, `createdAt`) en la respuesta pública por seguridad.

---

**Versión:** 3.1 | **Actualizado:** 2026-05-05
