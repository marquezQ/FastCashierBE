# 📄 Reports Module

Este módulo se encarga de la generación de documentos PDF para la administración del sistema.

---

## 🛠 Tecnologías
- **pdfkit-table**: Extensión de pdfkit para renderizar tablas complejas de forma sencilla.

---

## 📊 Reportes Disponibles

### 1. Reporte de Turnos (Cierre de Caja)
- **Endpoint**: `GET /api/cashier-sessions/report/pdf`
- **Filtros**: Soporta `period` ('7d', 'this-month') y `startDate`/`endDate`.
- **Contenido**:
  - Resumen de ventas totales y diferencias del periodo.
  - Tabla detallada por turno: Responsable, fecha de apertura, monto inicial, ventas (Efectivo/QR) y diferencia.
  - Totales generales al final de la tabla.

---

## ⚙️ Lógica de Generación
- El servicio recibe un array de sesiones y devuelve un `Promise<Buffer>`.
- El controlador se encarga de configurar los headers HTTP:
  - `Content-Type: application/pdf`
  - `Content-Disposition: inline` (para visualizar en el navegador).
- El reporte incluye numeración de páginas y sello de tiempo de generación.
