# 🤖 FastCashierBE - Agent Documentation Index

Bienvenido al contexto modular de **FastCashierBE**. Esta carpeta contiene la documentación estructurada y actualizada necesaria para que cualquier agente de IA o desarrollador comprenda el proyecto rápidamente sin procesar archivos masivos.

**FastCashierBE** es la API REST del sistema de Punto de Venta (POS) para un negocio de comida rápida (pollo broaster). Gestiona usuarios, sesiones de caja, órdenes, productos, categorías, reportes PDF, métricas administrativas, notificaciones WebSocket en tiempo real y audio TTS para anuncios de pedidos.

---

## 📂 Guía de Documentación

| Archivo | Contenido |
| :--- | :--- |
| 🚀 [**Tech Stack**](./tech-stack.md) | Versiones exactas de frameworks, dependencias (incluyendo msedge-tts, Socket.IO), scripts NPM, seeders y zona horaria. |
| 📊 [**Database & Entities**](./database.md) | Diagrama ER completo, todas las entidades con columnas, tipos, constraints e índices. |
| 🧠 [**Business Logic**](./business-rules.md) | Sesiones de caja (timestamps server-side, diferencia cash+QR), máquina de estados de órdenes con WebSocket, cancelaciones, dashboard admin, TTS. |
| 🛡️ [**Security & Auth**](./security.md) | JWT, Guards, RBAC, matriz de permisos por rol y endpoint (incluyendo TTS y Reports), soft-delete. |
| 📡 [**API Standards**](./api-standards.md) | Inventario completo de endpoints (incluyendo TTS, Reports, PDF individual), convenciones REST, DTOs, Swagger. |
| ⚙️ [**Integrations**](./integrations.md) | WebSocket Gateway (Socket.IO /orders), TTS (msedge-tts), Cloudinary, CORS, zona horaria, PostgreSQL. |
| 📄 [**Reports**](./reports.md) | PDFs de turnos (multi-sesión e individual con órdenes), rendimiento de ventas (auto-agrupación), moneda Bs./- |

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
│   ├── orders/             # Crear/cancelar órdenes, máquina de estados, dashboard, WebSocket Gateway
│   ├── order-details/      # Items de orden con precio histórico congelado
│   ├── cashier-sessions/   # Apertura/cierre de caja, estadísticas, PDF individual
│   ├── reports/            # ReportsService + ReportsController: PDFs y datos de ventas
│   ├── tts/                # TTS con msedge-tts: genera audio MP3 para anuncios de pedidos
│   ├── cloudinary/         # CloudinaryService: upload/delete vía stream
│   ├── database/           # Seeds: roles, users, categories, products
│   ├── app.module.ts       # Módulo raíz + TypeORM + ConfigModule + todos los módulos
│   └── main.ts             # Bootstrap, Swagger, seeders, ValidationPipe, CORS, TZ
└── .agent/                 # Esta carpeta — documentación para IAs y devs
```

---

## 🔑 Credenciales por Defecto (Seed)

| Rol | Email | Contraseña |
| :--- | :--- | :--- |
| Admin | `admin@gmail.com` | `123456` |
| Cajero | `cashier@gmail.com` | `123456` |
| Cocinero | `cook@gmail.com` | `123456` |

> Los seeders se ejecutan automáticamente al iniciar con `DB_DROP_SCHEMA=true` (`npm run db:fresh`). Son idempotentes.

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

# 4. Iniciar en modo desarrollo
npm run start:dev

# 5. Para resetear la BD completamente (seeders)
npm run db:fresh

# 6. Swagger disponible en:
# http://localhost:3000/api/docs
```

---

## 🎯 Cómo Usar Este Contexto

Antes de trabajar en cualquier funcionalidad, lee el archivo correspondiente:

- **Nueva feature de BD / Entidad**: → `database.md` primero.
- **Lógica de negocio / Reglas de orden / Sesión**: → `business-rules.md`.
- **Endpoint nuevo / Permisos**: → `api-standards.md` + `security.md`.
- **WebSockets / TTS / Cloudinary / PDF**: → `integrations.md` + `reports.md`.
- **Dependencias / Setup de entorno**: → `tech-stack.md`.

---

**Versión:** 3.0 | **Actualizado:** 2026-04-14 | **Revisado por:** Antigravity (análisis completo del código fuente)
