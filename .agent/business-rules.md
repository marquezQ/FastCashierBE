# 🧠 Business Logic

Este archivo documenta las reglas de negocio críticas que rigen el comportamiento dinámico del sistema.

---

## 🏦 Gestión de Sesiones de Caja

### Apertura y Cierre
- Un usuario solo puede tener **una sesión abierta** a la vez. No se permite abrir una nueva sin cerrar la anterior.
- Al cerrar, se calculan las diferencias entre el monto esperado y el ingresado manualmente (`difference`).

### Arqueo Dinámico
- Las sesiones acumulan montos por cada orden creada:
  - `totalCash`: Suma de órdenes pagadas en efectivo.
  - `totalQr`: Suma de órdenes pagadas vía QR.
  - `orderCount`: Incremento por cada orden.

---

## 🧾 Ciclo de Vida de una Orden

### 1. Creación
- Requiere una sesión de caja **OPEN**.
- Los precios se copian de la tabla `products` a `order_details` para congelar el valor histórico.
- Campo `orderType` ('DINE_IN' | 'TAKEOUT') es obligatorio para control de servicio.

### 2. Estados de Preparación
- `PENDING` -> `IN_PREPARATION` -> `READY` -> `DELIVERED`.
- Las transiciones están validadas en `OrdersService.validateStatusTransition`.

### 3. Cancelación e Integridad Financiera
- Al cancelar una orden:
  - El monto se **deduce** de los totales de la sesión (`totalSales`, `totalCash/totalQr`).
  - El contador de órdenes disminuye.
  - Esto garantiza que el "Efectivo esperado" al final del día sea correcto según el dinero físico presente.

---

## 📊 Estadísticas de Sesión
El endpoint de estadísticas calcula en tiempo real:
- **Expected Cash**: `initialAmount + totalCash`.
- **Average Order Value**: `totalSales / orderCount`.
- **Breakdown**: Conteo de órdenes por método de pago excluyendo canceladas.

---

## 🖼️ Manejo de Imágenes
- Todas las imágenes de productos se almacenan en **Cloudinary**.
- El backend maneja el flujo de: `Upload -> URL pública -> BD`.
- Al eliminar un producto (o actualizar su imagen), se intenta borrar el recurso en Cloudinary mediante su `publicId`.
