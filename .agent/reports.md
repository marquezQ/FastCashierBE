# 📄 Reports Module

El módulo `reports` se encarga de la generación de documentos PDF para la administración del sistema. No tiene controlador propio — su servicio es inyectado en `CashierSessionsController`.

---

## 🛠 Tecnologías

| Paquete | Versión | Propósito |
| :--- | :--- | :--- |
| `pdfkit` | ^0.17.2 | Motor de generación de PDF en Node.js |
| `pdfkit-table` | ^0.1.99 | Extensión para renderizar tablas complejas |

> [!NOTE]
> `pdfkit-table` se importa con `require()` (CommonJS) por compatibilidad: `const PDFDocument = require('pdfkit-table')`.

---

## 📊 Reportes Disponibles

### 1. Reporte de Turnos / Cierre de Caja

**Endpoint**: `GET /api/cashier-sessions/report/pdf`  
**Acceso**: ADMIN, CASHIER  
**Content-Type**: `application/pdf`  
**Content-Disposition**: `inline; filename=reporte-sesiones.pdf` (visualización en el navegador)  
**Moneda**: Bolivianos (Bs.-)

#### Filtros de Fecha (Query Params)
| Parámetro | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `period=7d` | Últimos 7 días (default) | `?period=7d` |
| `period=this-month` | Mes actual desde el 1ro | `?period=this-month` |
| `startDate` + `endDate` | Rango personalizado | `?startDate=2026-01-01&endDate=2026-01-31` |

#### Contenido del PDF

**Sección 1: Encabezado**
- Título: "FastCashier - Reporte de Turnos"
- Subtítulo: Descripción del período (ej: "Últimos 7 días", "Este Mes", "Del 01/01 al 31/01/2026")

**Sección 2: Tabla Resumen del Período**
| Concepto | Total |
| :--- | :--- |
| Ventas Totales | Suma de `totalSales` de todos los turnos |
| Diferencia Acumulada | Suma de `difference` (errores de caja del período) |
| Total Turnos | Cantidad de sesiones incluidas |

**Sección 3: Tabla de Detalle por Turno**
| Columna | Fuente |
| :--- | :--- |
| Responsable | `session.user.fullName` |
| Apertura | `openingDate` formateado como `DD/MM/YYYY HH:MM` |
| Ef. Inicial | `initialAmount` |
| Ventas | `totalSales` |
| Ef. (Efectivo) | `totalCash` |
| QR | `totalQr` |
| Dif. (Diferencia) | `difference` |

- La **última fila** de la tabla de detalle es un total general (en negrita) sumando todas las columnas numéricas.
- El valor de las columnas monetarias en la última fila aparece formateado como `Bs.- X.XX`.

**Sección 4: Footer**
- Numeración de páginas: `"Página N de M - Generado el DD/MM/YYYY HH:MM:SS"`
- Se renderiza en la parte inferior de cada página.

---

## ⚙️ Lógica de Generación (`ReportsService.generateSessionsPdf`)

```
Recibe: sessions: CashierSession[], rangeText: string
   ↓
Crea PDFDocument (A4, margen 30px)
   ↓
Agrega encabezado y período
   ↓
Calcula sumas totales (reduce)
   ↓
Renderiza tabla de resumen (anchura 250px)
   ↓
Construye filas de detalle por sesión + fila de totales
   ↓
Renderiza tabla de detalle (font size 9)
   ↓
Itera páginas para agregar footer con numeración
   ↓
doc.end() → retorna Promise<Buffer>
```

El controlador:
1. Llama a `cashierSessionsService.findAll(query)` para obtener las sesiones filtradas.
2. Llama a `reportsService.generateSessionsPdf(sessions, rangeText)`.
3. Configura los headers HTTP: `Content-Type: application/pdf`.
4. Envía el buffer directamente con `res.end(buffer)`.

---

## 🔧 Módulo y Dependencias

`ReportsModule` es **global** o es importado por `CashierSessionsModule`. El `ReportsService` se inyecta en el constructor de `CashierSessionsController`.

```typescript
// cashier-sessions.module.ts exporta e importa ReportsModule
@Module({
  providers: [CashierSessionsService, ReportsService],
  ...
})
```

---

## 📈 Futuras Extensiones Posibles

- **Reporte de Cancelaciones PDF**: Exportar el endpoint `GET /orders/metrics/cancellations` como PDF con detalle de órdenes canceladas.
- **Reporte de Ventas por Producto**: Exportar el top de productos vendidos con imagen.
- **Reporte de Arqueo Individual**: PDF para una sola sesión con su resumen financiero.

---

**Versión:** 2.0 | **Actualizado:** 2026-03-01
