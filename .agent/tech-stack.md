# 🚀 Tech Stack

**FastCashierBE** es la API REST del sistema de punto de venta (POS) para un negocio de comida rápida (pollo broaster). Construida con un stack moderno enfocado en mantenibilidad, seguridad y escalabilidad.

---

## 🛠️ Tecnologías Core

| Tecnología | Versión | Uso |
| :--- | :--- | :--- |
| **Node.js** | v20+ | Runtime de JavaScript |
| **NestJS** | ^11.0.1 | Framework principal (DI, módulos, guards, pipes) |
| **TypeScript** | ^5.7.3 | Tipado estricto en toda la aplicación |
| **TypeORM** | ^0.3.27 | ORM para mapeo objeto-relacional con PostgreSQL |
| **PostgreSQL** | latest | Base de datos relacional persistente |
| **Express** | ^5.0.0 | Plataforma HTTP subyacente de NestJS |

---

## 📦 Dependencias Clave

### Autenticación & Seguridad
| Paquete | Versión | Propósito |
| :--- | :--- | :--- |
| `@nestjs/jwt` | ^11.0.1 | Generación y verificación de tokens JWT |
| `@nestjs/passport` | ^11.0.5 | Integración de Passport con NestJS |
| `passport-jwt` | ^4.0.1 | Estrategia JWT para Passport |
| `passport-local` | ^1.0.0 | Estrategia de usuario/contraseña |
| `bcrypt` | ^6.0.0 | Hashing de contraseñas |

### Validación & Transformación
| Paquete | Versión | Propósito |
| :--- | :--- | :--- |
| `class-validator` | ^0.14.2 | Decoradores de validación en DTOs (`@IsNotEmpty`, `@IsEnum`, etc.) |
| `class-transformer` | ^0.5.1 | Transformación de objetos planos a clases y viceversa |
| `@nestjs/mapped-types` | ^2.1.0 | `PartialType`, `OmitType` para derivar DTOs |

### WebSockets (Tiempo Real)
| Paquete | Versión | Propósito |
| :--- | :--- | :--- |
| `@nestjs/websockets` | ^11.1.16 | Módulo de NestJS para WebSocket Gateways |
| `@nestjs/platform-socket.io` | ^11.1.16 | Adaptador Socket.IO para NestJS |

### Text-to-Speech (TTS)
| Paquete | Versión | Propósito |
| :--- | :--- | :--- |
| `msedge-tts` | ^2.0.4 | Generación de audio MP3 con voces de Microsoft Edge (ESM, import dinámico) |

### Integraciones Externas
| Paquete | Versión | Propósito |
| :--- | :--- | :--- |
| `cloudinary` | ^2.9.0 | SDK oficial para almacenamiento de imágenes en la nube |
| `multer` | (vía @nestjs/platform-express) | Middleware para manejo de archivos multipart/form-data |

### Reportes
| Paquete | Versión | Propósito |
| :--- | :--- | :--- |
| `pdfkit` | ^0.17.2 | Generación de documentos PDF |
| `pdfkit-table` | ^0.1.99 | Extensión para renderizar tablas en PDF |

### Documentación API
| Paquete | Versión | Propósito |
| :--- | :--- | :--- |
| `@nestjs/swagger` | ^11.2.5 | Generación automática de documentación OpenAPI/Swagger |

### Base de Datos
| Paquete | Versión | Propósito |
| :--- | :--- | :--- |
| `pg` | ^8.16.3 | Driver oficial de PostgreSQL para Node.js |
| `@nestjs/typeorm` | ^11.0.0 | Módulo de NestJS para TypeORM |

---

## ⚙️ Configuración del Entorno

Variables de entorno en `.env` (ver `.env.example`):

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
NODE_ENV=development  # Activa synchronize en TypeORM
DB_DROP_SCHEMA=false  # Solo true cuando se necesita resetear la BD (db:fresh)

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

> [!IMPORTANT]
> `NODE_ENV=development` activa `synchronize: true` en TypeORM, lo cual auto-migra el esquema. **Nunca usar en producción.** En producción, usar migraciones explícitas.

---

## 🕐 Zona Horaria

El sistema fuerza la zona horaria `America/La_Paz` (UTC-4, Bolivia) en dos niveles:

1. **Proceso Node.js** — `process.env.TZ = 'America/La_Paz'` (en `main.ts`, línea 2)
2. **PostgreSQL** — `extra: { options: '-c timezone=America/La_Paz' }` en la configuración de TypeORM

Esto garantiza que todos los timestamps generados por el servidor y las consultas SQL estén en la zona horaria correcta.

---

## 📜 Scripts de NPM

```bash
npm run start:dev    # Modo desarrollo con hot-reload (watch)
npm run db:fresh     # Resetear BD completamente (DB_DROP_SCHEMA=true + start:dev)
npm run build        # Compilar TypeScript → dist/
npm run start:prod   # Ejecutar desde dist/ (producción)
npm run lint         # ESLint con auto-fix
npm run test         # Jest unit tests
npm run test:cov     # Tests con cobertura
npm run test:e2e     # End-to-end tests
```

> [!WARNING]
> `npm run db:fresh` ejecuta el seeder completo después de eliminar todas las tablas. **Solo usar en desarrollo.**

---

## 🌱 Sistema de Seeders

Los seeders se ejecutan automáticamente **solo** cuando se cumplen AMBAS condiciones:
- `NODE_ENV !== 'production'`
- `DB_DROP_SCHEMA === 'true'`

El orden de ejecución es crítico por dependencias FK:

1. **Roles** → `ADMIN`, `CASHIER`, `KITCHEN`
2. **Users** → `admin@gmail.com`, `cashier@gmail.com`, `cook@gmail.com` (contraseña: `123456`)
3. **Categories** → `COMIDA`, `REFRESCOS`, `BEBIDAS CALIENTES`, `POSTRES`
4. **Products** → 5 productos de ejemplo con categorías asignadas

Los seeders utilizan lógica de upsert (solo crean si no existen), por lo que son seguros de ejecutar múltiples veces.

---

**Versión:** 3.1 | **Actualizado:** 2026-05-05
