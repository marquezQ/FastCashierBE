# FastCashier — Backend API

> API REST del sistema de punto de venta (POS) para negocio de comida rápida, construida con **NestJS**, **TypeORM** y **PostgreSQL**.

---

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Tech Stack](#tech-stack)
- [Arquitectura de Módulos](#arquitectura-de-módulos)
- [Requisitos Previos](#requisitos-previos)
- [Guía de Instalación](#guía-de-instalación)
- [Variables de Entorno](#variables-de-entorno)
- [Scripts Disponibles](#scripts-disponibles)
- [Documentación API (Swagger)](#documentación-api-swagger)
- [Funcionalidades Principales](#funcionalidades-principales)
- [WebSockets](#websockets)
- [Integraciones Externas](#integraciones-externas)

---

## Descripción

**FastCashierBE** es el backend de un sistema POS completo para un restaurante de comida rápida (pollo broaster). Gestiona el ciclo de vida completo de las órdenes — desde la toma en caja hasta la entrega en cocina — con comunicación en tiempo real vía WebSockets, reportes en PDF, anuncios de voz (TTS) y un sistema de pantallas TV para el menú.

**Roles del sistema:**
| Rol | Responsabilidades |
|---|---|
| `ADMIN` | Gestión completa: usuarios, productos, categorías, reportes, dashboard |
| `CASHIER` | Apertura/cierre de turno, creación y cancelación de órdenes |
| `KITCHEN` | Vista y cambio de estado de órdenes (monitor de cocina) |

---

## Tech Stack

| Tecnología | Versión | Uso |
|---|---|---|
| **Node.js** | v20+ | Runtime |
| **NestJS** | ^11 | Framework principal (DI, Guards, Pipes, Modules) |
| **TypeScript** | ^5.7 | Tipado estricto |
| **TypeORM** | ^0.3.27 | ORM para PostgreSQL |
| **PostgreSQL** | latest | Base de datos relacional |
| **Socket.IO** | vía `@nestjs/platform-socket.io` | Tiempo real (cocina ↔ caja) |
| **Swagger** | ^11 | Documentación API auto-generada |
| **Cloudinary** | ^2.9 | Almacenamiento de imágenes |
| **PDFKit** | ^0.17 | Generación de reportes PDF |
| **msedge-tts** | ^2.0.4 | Text-to-Speech (anuncios de cocina) |

---

## Arquitectura de Módulos

```
src/
├── auth/               # JWT + Passport (login, guards, estrategias)
├── users/              # CRUD de usuarios con roles
├── roles/              # Entidad y seed de roles
├── products/           # CRUD de productos + toggle activo + búsqueda
├── categories/         # Categorías de menú con ordenamiento visual
├── orders/             # Ciclo de vida de órdenes + dashboard + métricas
├── order-details/      # Detalles de cada línea de orden
├── cashier-sessions/   # Turnos de caja: apertura, cierre, arqueo
├── reports/            # Reportes comparativos (métodos de pago, tipos de orden)
├── dashboard/          # Métricas consolidadas para el admin
├── display-configs/    # Configuración de pantallas TV (menú público)
├── tts/                # Text-to-Speech para anuncios de cocina
├── cloudinary/         # Manejo de imágenes en la nube
└── database/           # Seeders iniciales
```

---

## Requisitos Previos

- **Node.js** v20 o superior
- **npm** v10 o superior
- **PostgreSQL** corriendo localmente (o conexión remota)
- (Opcional) Cuenta de **Cloudinary** para manejo de imágenes de productos

---

## Guía de Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd FastCashierBE
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus valores (ver sección [Variables de Entorno](#variables-de-entorno)).

### 4. Levantar la base de datos

Asegúrate de que PostgreSQL esté corriendo y que la base de datos especificada en `.env` exista:

```sql
CREATE DATABASE punto_venta_db;
```

> Con `NODE_ENV=development`, TypeORM sincroniza el esquema automáticamente al iniciar.

### 5. Correr el proyecto en modo desarrollo

```bash
npm run start:dev
```

El servidor estará disponible en `http://localhost:3000`.

### 6. (Opcional) Poblar la base de datos con datos de prueba

```bash
npm run db:fresh
```

> ⚠️ **¡Cuidado!** Este comando elimina **todas las tablas** y las recrea con datos semilla. Solo usar en desarrollo.

Datos de prueba creados:
- **Roles**: `ADMIN`, `CASHIER`, `KITCHEN`
- **Usuarios**: `admin@gmail.com`, `cashier@gmail.com`, `cook@gmail.com` — contraseña: `123456`
- **Categorías**: COMIDA, REFRESCOS, BEBIDAS CALIENTES, POSTRES
- **Productos**: 5 productos de ejemplo

---

## Variables de Entorno

Copia `.env.example` a `.env` y completa los valores:

```bash
# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_NAME=punto_venta_db

# JWT
JWT_SECRET=tu_secreto_super_seguro
JWT_EXPIRATION=24h

# Servidor
PORT=3000
NODE_ENV=development   # "production" para desactivar synchronize

# Solo en desarrollo: elimina y recrea todas las tablas al iniciar
DB_DROP_SCHEMA=false

# Cloudinary (para imágenes de productos)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

> **Importante:** `NODE_ENV=development` activa `synchronize: true` en TypeORM, lo que auto-migra el esquema. **Nunca usar en producción.**

---

## Scripts Disponibles

```bash
# Desarrollo con hot-reload
npm run start:dev

# Resetear BD + seed (solo desarrollo)
npm run db:fresh

# Compilar a JavaScript
npm run build

# Ejecutar en producción (requiere build previo)
npm run start:prod

# Linting con auto-fix
npm run lint

# Formatear código con Prettier
npm run format

# Tests unitarios
npm run test

# Tests con cobertura
npm run test:cov

# Tests end-to-end
npm run test:e2e
```

---

## Documentación API (Swagger)

Con el servidor corriendo, accede a la documentación interactiva en:

```
http://localhost:3000/api/docs
```

Todos los endpoints están documentados con sus DTOs, respuestas y requisitos de autenticación.

---

## Funcionalidades Principales

### 🔐 Autenticación
- Login con usuario/contraseña → retorna JWT.
- Guards basados en roles (`@Roles(Role.ADMIN)`, etc.) protegen todos los endpoints.

### 🧾 Órdenes
- Ciclo de vida completo: `PENDING → IN_PREPARATION → READY → DELIVERED` (o `CANCELLED`).
- Número de orden generado automáticamente: `ORD-S{sesionId}-{NNN}`.
- Al crear una orden se congela el precio unitario del producto.
- Cancelación revierte los totales del turno de caja en tiempo real.

### 🏦 Turnos de Caja (Cashier Sessions)
- Un cajero solo puede tener **un turno abierto a la vez**.
- Acumula `totalCash`, `totalQr`, `totalSales` y `orderCount` en tiempo real.
- Al cerrar genera un arqueo con diferencia entre lo declarado y lo esperado.
- Soporta filtros de fecha: últimos 7 días, mes actual, rango personalizado.

### 📊 Reportes y Dashboard
- **Dashboard Admin**: ventas totales, ticket promedio, tiempo promedio de cocina, top productos, desglose por canal (dine-in / takeout).
- **Reportes PDF**: reporte individual de sesión, reporte comparativo de métodos de pago y tipos de orden.
- Reportes comparativos con agregación SQL para alto rendimiento.

### 📺 Pantallas TV (Display)
- El admin crea configuraciones de pantalla con un `accessToken` de 6 caracteres.
- El endpoint público `GET /api/display/:token` permite que TVs consulten el menú sin autenticación.
- Configurable: categoría, intervalo de rotación, transición, precios visibles, productos por slide.

---

## WebSockets

El gateway de Socket.IO está disponible en el namespace `/orders`:

```
ws://localhost:3000/orders
```

| Evento | Dirección | Descripción |
|---|---|---|
| `new_order` | Servidor → Cliente | Se emite al crear una nueva orden |
| `order_status_updated` | Servidor → Cliente | Se emite al cambiar estado o cancelar |
| `ping` | Cliente → Servidor | Health check de conexión (responde `pong`) |

---

## Integraciones Externas

### ☁️ Cloudinary
Almacenamiento de imágenes de productos. Se sube el archivo en memoria (Multer) y se persiste la URL pública en la base de datos. Al actualizar la imagen, la anterior se elimina automáticamente.

### 🔊 Text-to-Speech (Microsoft Edge TTS)
Cuando un pedido pasa a `READY`, el frontend solicita `GET /api/tts/pedido/:numero`. El servidor genera un MP3 con la voz `es-MX-DaliaNeural` diciendo _"Pedido número N, por favor"_ y lo cachea en memoria.

### 🕐 Zona Horaria
El sistema fuerza `America/La_Paz` (UTC-4, Bolivia) tanto en el proceso Node.js (`process.env.TZ`) como en la conexión PostgreSQL (`-c timezone=America/La_Paz`).

---

## Licencia

Proyecto privado — todos los derechos reservados.
