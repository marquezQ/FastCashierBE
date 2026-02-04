# 🚀 Tech Stack

**FastCashierBE** es una API REST robusta construida con un stack moderno enfocado en la mantenibilidad y escalabilidad.

---

## 🛠️ Tecnologías Core

- **Runtime**: Node.js (v20+)
- **Framework**: [NestJS](https://nestjs.com/) (v11) - Arquitectura modular basada en inyección de dependencias.
- **Lenguaje**: TypeScript - Tipado estricto para mayor seguridad en el desarrollo.
- **ORM**: [TypeORM](https://typeorm.io/) (v0.3.x) - Mapeo objeto-relacional con soporte para migraciones y decoradores.
- **Base de Datos**: PostgreSQL - Base de datos relacional persistente.

---

## 📦 Dependencias Clave

### Utilidades & Seguridad
- **@nestjs/jwt & passport-jwt**: Estrategia de autenticación JWT.
- **bcrypt**: Encriptación de contraseñas.
- **class-validator & class-transformer**: Validación de datos en tiempo de ejecución (DTOs).

### Integraciones
- **cloudinary**: SDK oficial para la gestión de imágenes en la nube.
- **multer**: Middleware para el manejo de carga de archivos (multipart/form-data).

### Documentación
- **@nestjs/swagger**: Generación automática de documentación OpenAPI/Swagger.

---

## ⚙️ Configuración del Entorno
Las variables de entorno críticas se encuentran en el `.env`:
- `DB_*`: Configuración de conexión a PostgreSQL.
- `JWT_SECRET`: Llave privada para firma de tokens.
- `CLOUDINARY_URL`: Configuración del servicio de imágenes.

---
