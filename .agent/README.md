# 🤖 FastCashierBE - Agent Documentation Index

Bienvenido al contexto modular de **FastCashierBE**. Esta carpeta contiene la documentación estructurada y actualizada necesaria para que cualquier agente de IA o desarrollador comprenda el proyecto rápidamente sin procesar archivos masivos.

**FastCashierBE** es la API REST del sistema de Punto de Venta (POS) para un negocio de comida rápida (pollo broaster). Gestiona usuarios, sesiones de caja, órdenes, productos, categorías, reportes PDF y métricas administrativas.

---

## 📂 Guía de Documentación

| Archivo | Contenido |
| :--- | :--- |
| 🚀 [**Tech Stack**](./tech-stack.md) | Versiones exactas de frameworks, dependencias, scripts NPM, seeders y zona horaria. |
| 📊 [**Database & Entities**](./database.md) | Diagrama ER completo, todas las entidades con columnas, tipos, constraints e índices. |
| 🧠 [**Business Logic**](./business-rules.md) | Sesiones de caja, máquina de estados de órdenes, cancelaciones, dashboard admin, productos. |
| 🛡️ [**Security & Auth**](./security.md) | JWT, Guards, RBAC, matriz de permisos por rol y endpoint, soft-delete como seguridad. |
| 📡 [**API Standards**](./api-standards.md) | Inventario completo de endpoints, convenciones REST, DTOs, Swagger y códigos HTTP. |
| ⚙️ [**Integrations**](./integrations.md) | Cloudinary (upload/delete), CORS, zona horaria, conexión PostgreSQL, WebSockets. |
| 📄 [**Reports**](./reports.md) | Generación PDF de turnos: contenido, columnas, lógica, moneda (Bs./-) y filtros. |

---

## 🏗️ Arquitectura del Sistema

```
FastCashierBE/
├── src/
│   ├── auth/               # JWT + Passport + Guards + Decoradores
│   ├── users/              # CRUD de usuarios, seeders, lastAccess
│   ├── roles/              # ADMIN | CASHIER | KITCHEN
│   ├── categories/         # Catálogo de categorías con orden visual
│   ├── products/           # Catálogo de productos, búsqueda, Cloudinary
│   ├── orders/             # Crear/cancelar órdenes, máquina de estados, dashboard
│   ├── order-details/      # Items de orden con precio histórico congelado
│   ├── cashier-sessions/   # Apertura/cierre de caja, estadísticas, PDF
│   ├── reports/            # ReportsService: genera buffers PDF con pdfkit-table
│   ├── cloudinary/         # CloudinaryService: upload/delete vía stream
│   ├── app.module.ts       # Módulo raíz + TypeORM + ConfigModule
│   └── main.ts             # Bootstrap, Swagger, seeders, ValidationPipe global
└── .agent/                 # Esta carpeta — documentación para IAs y devs
```

---

## 🔑 Credenciales por Defecto (Seed)

| Rol | Email | Contraseña |
| :--- | :--- | :--- |
| Admin | `admin@gmail.com` | `123456` |
| Cajero | `cashier@gmail.com` | `123456` |
| Cocinero | `cook@gmail.com` | `123456` |

> Los seeders se ejecutan automáticamente al iniciar el servidor. Son idempotentes (no duplican datos).

---

## ⚡ Inicio Rápido

```bash
# 1. Copiar variables de entorno
cp .env.example .env
# (editar .env con tus credenciales de PostgreSQL y Cloudinary)

# 2. Instalar dependencias
npm install

# 3. Asegurar que PostgreSQL esté corriendo y la DB exista:
# CREATE DATABASE punto_venta_db;

# 4. Iniciar en modo desarrollo (seeders corren automáticamente)
npm run start:dev

# 5. Swagger disponible en:
# http://localhost:3000/api/docs
```

---

## 🎯 Cómo Usar Este Contexto

Antes de trabajar en cualquier funcionalidad, lee el archivo correspondiente:

- **Nueva feature de BD / Entidad**: →`database.md` primero.
- **Lógica de negocio / Reglas de orden / Sesión**: → `business-rules.md`.
- **Endpoint nuevo / Permisos**: → `api-standards.md` + `security.md`.
- **Imágenes / Cloudinary / PDF**: → `integrations.md` + `reports.md`.
- **Dependencias / Setup de entorno**: → `tech-stack.md`.

---

**Versión:** 2.0 | **Actualizado:** 2026-03-01 | **Revisado por:** Antigravity (análisis completo del código fuente)
