# 📄 Reports Module

El módulo `reports` se encarga de la generación de documentos PDF y datos de rendimiento de ventas. El `ReportsService` es inyectado tanto en `CashierSessionsController` (para PDFs de sesiones) como en su propio `ReportsController` (para datos de ventas).

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

### 1. Reporte de Turnos (Multi-sesión)

**Endpoint**: `GET /api/cashier-sessions/report/pdf`
**Controller**: `CashierSessionsController`
**Acceso**: ADMIN, CASHIER
**Content-Type**: `application/pdf`
**Content-Disposition**: `inline; filename=reporte-sesiones.pdf`
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

- La **última fila** es un total general (en negrita) sumando todas las columnas numéricas con formato `Bs.- X.XX`.

**Sección 4: Footer**
- Numeración de páginas: `"Página N de M - Generado el DD/MM/YYYY HH:MM:SS"`

---

### 2. Reporte de Detalle de Turno Individual (NUEVO)

**Endpoint**: `GET /api/cashier-sessions/:id/report/pdf`
**Controller**: `CashierSessionsController`
**Acceso**: ADMIN, CASHIER
**Content-Type**: `application/pdf`
**Content-Disposition**: `inline; filename=detalle-turno-{id}.pdf`
**Moneda**: Bolivianos (Bs.-)

#### Contenido del PDF

**Sección 1: Encabezado**
- Título: "Reporte a Detalle de Turno"
- Información del turno: ID, cajero, apertura, cierre (o "PENDIENTE"), fondo de reserva.

**Sección 2: Tabla de Órdenes**
| Columna | Fuente |
| :--- | :--- |
| # Orden | `orderNumber` |
| Fecha y Hora | `orderDate` formateado DD/MM/YYYY HH:MM |
| Cliente | `customer` |
| Tipo | `DINE_IN` → "Mesa", `TAKEOUT` → "Llevar" |
| Efectivo | Monto si `paymentMethod = 'CASH'`, sino "-" |
| QR | Monto si `paymentMethod = 'QR'`, sino "-" |
| Total | `total` de la orden |
| Estado | `CANCELLED` → "Anulado", resto → "OK" |

- Las órdenes CANCELLED se muestran en rojo e itálica.
- La última fila muestra "TOTAL VÁLIDO" (excluyendo canceladas).

**Sección 3: Resumen Financiero**
- **CAJA Y EFECTIVO**: Efectivo Inicial, Ventas Efectivo, Efectivo Esperado, Efectivo Físico en Caja.
- **TRANSACCIONES (QR)**: Ventas QR Esperado, Ventas QR Declarado.
- **TOTAL GENERAL**: Suma de efectivo esperado + QR esperado.
- **SOBRANTE / FALTANTE**: Diferencia total (cash + QR). Si el turno no está cerrado, muestra "PENDIENTE".

**Sección 4: Footer** — Igual que el reporte multi-sesión.

---

### 3. Rendimiento de Ventas (Datos para Gráficos)

**Endpoint**: `GET /api/reports/sales`
**Controller**: `ReportsController`
**Acceso**: ADMIN
**Query Params**: `period` (DAY|WEEK|MONTH|YEAR), `start`, `end`
**Retorna**: `JSON`

#### Respuesta
```json
[
  { "label": "Lun 1", "sales": 1250.50 },
  { "label": "Mar 2", "sales": 890.00 }
]
```

---

### 4. Métodos de Pago (Efectivo vs QR)

**Endpoint**: `GET /api/reports/payment-methods`
**Controller**: `ReportsController`
**Acceso**: ADMIN
**Query Params**: `period` (DAY|WEEK|MONTH|YEAR), `start`, `end`
**Retorna**: `JSON`

#### Respuesta
```json
[
  { "label": "Lun 1", "efectivo": 1000.00, "qr": 250.50 },
  { "label": "Mar 2", "efectivo": 600.00, "qr": 290.00 }
]
```

---

### 5. Tipos de Pedido (Mesa vs Llevar)

**Endpoint**: `GET /api/reports/order-types`
**Controller**: `ReportsController`
**Acceso**: ADMIN
**Query Params**: `period` (DAY|WEEK|MONTH|YEAR), `start`, `end`
**Retorna**: `JSON`

#### Respuesta
```json
[
  { "label": "Lun 1", "mesa": 15, "llevar": 8 },
  { "label": "Mar 2", "mesa": 12, "llevar": 10 }
]
```

#### Auto-agrupación por Rango
El sistema determina automáticamente la granularidad según el tamaño del rango o el periodo predefinido:

| Rango / Periodo | Agrupación | Formato Label |
| :--- | :--- | :--- |
| DAY | Por hora | `HH:MM` |
| WEEK / < 14 días | Por día | `Lun 1`, `Mar 2`, etc. |
| MONTH / ≤ 60 días | Por semana | `Sem 1`, `Sem 2`, etc. |
| YEAR / > 60 días | Por mes | `Ene`, `Feb`, etc. |

> [!IMPORTANT]
> Las fechas se parsean como **hora local** (no UTC). `'2026-03-01'` se interpreta como `2026-03-01T00:00:00` en América/La_Paz. Esto es intencional para consistencia con la zona horaria del servidor.

---

## ⚙️ Módulo y Dependencias

```
ReportsModule
├── Exports: ReportsService
├── Imports: TypeOrmModule.forFeature([Order])
│
├── Inyectado en: CashierSessionsController (para PDFs)
└── Tiene su propio: ReportsController (para datos de ventas)
```

`CashierSessionsModule` importa `ReportsModule` para poder inyectar `ReportsService` en su controlador.

---

**Versión:** 3.1 | **Actualizado:** 2026-05-05
