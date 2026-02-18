# 🧠 Business Logic

Este archivo documenta las reglas de negocio críticas que rigen el comportamiento dinámico del sistema.

---

## 🏦 Gestión de Sesiones de Caja

### Apertura y Cierre
- Un usuario solo puede tener **una sesión abierta** a la vez. No se permite abrir una nueva sin cerrar la anterior.
- Al cerrar, se calculan las diferencias entre el monto esperado y el ingresado manualmente (`difference`).

### Arqueo Dinámico
### 📉 Estadísticas y Reportes
- El sistema genera estadísticas en tiempo real:
  - **Ticket Promedio**: `totalSales / orderCount`.
  - **Desglose**: Conteo de órdenes por método de pago.
  - **Integridad**: Solo se cuentan órdenes **no canceladas** para los totales de venta.
- **Reportes PDF**: Se generan reportes descargables filtrados por fecha (7 días, mes actual o rango custom).

---

## 🧾 Ciclo de Vida de una Orden

### 1. Creación
- Requiere una sesión de caja **OPEN**.
- Los precios se copian de la tabla `products` a `order_details` para congelar el valor histórico.
- Campo `orderType` ('DINE_IN' | 'TAKEOUT') es obligatorio.
- **Cálculo de Cambio**: Si el pago es en efectivo, el sistema valida que `amountPaid >= total` y calcula `changeAmount` automáticamente.

### 2. Estados de Preparación
- `PENDING` -> `IN_PREPARATION` -> `READY` -> `DELIVERED`.
- Las transiciones están validadas estrictamente: no se puede saltar estados ni retroceder (excepto a CANCELLED).
- La cocina visualiza pedidos de las últimas 18 horas mediante `getKitchenDisplayOrders` (FIFO).

### 3. Cancelación e Integridad Financiera
- Al cancelar una orden:
  - El monto se **deduce** automáticamente de los totales de la sesión (`totalSales`, `totalCash/totalQr`).
  - El contador de órdenes (`orderCount`) disminuye.
  - Esto garantiza que el efectivo esperado coincida con el arqueo manual.

---

## 🖼️ Manejo de Imágenes
- Todas las imágenes de productos se almacenan en **Cloudinary**.
- El backend maneja el flujo de: `Upload -> URL pública -> BD`.
- Al eliminar un producto (o actualizar su imagen), se intenta borrar el recurso en Cloudinary mediante su `publicId`.
