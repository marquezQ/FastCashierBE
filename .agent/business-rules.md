# 🧠 Business Logic

Este archivo documenta todas las reglas de negocio críticas que rigen el comportamiento dinámico del sistema.

---

## 🏦 Gestión de Sesiones de Caja (`cashier-sessions`)

### Apertura
- Un usuario solo puede tener **una sesión `OPEN` a la vez**. Intentar abrir una segunda sesión sin cerrar la anterior lanza `409 Conflict`.
- El cajero registra un `initialAmount` (monto físico en caja al abrir turno).
- El sistema inicializa `totalCash`, `totalQr`, `totalSales` y `orderCount` en `0`.

### Acumulación de Ventas (en tiempo real)
- Cada vez que se crea una orden exitosa, `addOrderToSession()` actualiza atómicamente:
  - `totalCash += total` (si `paymentMethod = 'CASH'`)
  - `totalQr += total` (si `paymentMethod = 'QR'`)
  - `totalSales += total`
  - `orderCount += 1`
- Si se cancela una orden, `deductOrderFromSession()` hace la operación inversa, manteniendo la integridad del arqueo.

### Cierre y Arqueo
- Al cerrar, el cajero provee `closingCashAmount` y `closingQrAmount` (los valores físicos contados).
- El sistema calcula la **diferencia** automáticamente (solo sobre efectivo):
  ```
  difference = closingCashAmount - (initialAmount + totalCash)
  ```
  - Diferencia positiva (sobra) o negativa (falta) indica errores en el manejo de caja.
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
3. Se genera el `orderNumber` único: formato `ORD-S{sessionId}-{NNNN}` donde `NNNN` es el conteo de órdenes de esa sesión más 1 con cero-relleno izquierdo.
4. Se crea el `Order` con `orderStatus = 'PENDING'`.
5. Se crean los `OrderDetail` con el `unit_price` congelado al precio actual del producto.
6. Se actualiza la sesión de caja con los totales acumulados.

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
DELIVERED  ←── completedDate se fija en READY o DELIVERED │
   │                                                      │
   └─────────────────────────────── (DELIVERED no puede ir a CANCELLED)
```

**Reglas:**
- Solo se pueden hacer transiciones válidas. Cualquier transición inválida lanza `400 Bad Request`.
- `DELIVERED` y `CANCELLED` son estados finales (sin transiciones posibles).
- La cocina solamente puede operar en el endpoint `PATCH /api/orders/:id/status`.

### 3. Cancelación
- Solo se pueden cancelar órdenes que no estén en `DELIVERED`.
- Al cancelar:
  1. Se llama `deductOrderFromSession()` para restar el total de los acumulados de la sesión.
  2. `orderStatus` pasa a `CANCELLED`.
  3. Opcionalmente se registra una razón en `observations`.
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

---

## 🖼️ Manejo de Imágenes de Productos

- **Flujo de subida**: Cashier admin sube imagen → Multer recibe el archivo en memoria → `CloudinaryService.uploadImage()` → URL pública almacenada en `products.image_url`.
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

---

**Versión:** 2.0 | **Actualizado:** 2026-03-01
