# 🛡️ Security & Auth

La seguridad del sistema se basa en **JWT** y **RBAC** (Role-Based Access Control).

---

## 🔑 Autenticación (JWT)

- **Módulo**: `AuthModule` (`src/auth`)
- **Estrategia**: `JwtStrategy` extrae el Bearer token de los headers.
- **Flujo**:
  1. Login exitoso genera un JWT firmado con `JWT_SECRET`.
  2. El payload incluye `sub` (userId), `email` y `roleId`.
  3. El cliente debe enviar el token en cada request: `Authorization: Bearer <token>`.

---

## 🪪 Roles & Permisos

El sistema utiliza tres roles predefinidos (vistos en `RolesGuard`):
1. **ADMIN** (ID 1): Acceso total a todas las operaciones, incluyendo CRUD de usuarios y configuración sensible.
2. **CASHIER** (ID 2): Apertura/cierre de caja, creación de órdenes y visualización de estadísticas de sesión.
3. **KITCHEN** (ID 3): Visualización de órdenes pendientes y cambio de estado a 'En preparación', 'Listo' o 'Entregado'.

### Decoradores
- `@UseGuards(JwtAuthGuard, RolesGuard)`: Protege el controlador o método.
- `@Roles('ADMIN', '...')`: Especifica qué roles tienen permiso.

---

## 🛡️ Guards Principales

### JwtAuthGuard
Verifica que el token sea válido y no haya expirado. Adjunta el objeto `user` al request.

### RolesGuard
Compara el `roleId` del usuario autenticado contra los requeridos por el decorador `@Roles`. 
> [!NOTE]
> Mapeo interno: `ADMIN: 1`, `CASHIER: 2`, `KITCHEN: 3`.

---

## 🏠 Protección por Soft Delete
Las entidades `User`, `Category` y `Product` tienen un campo `isActive`. 
- El sistema filtra automáticamente (o mediante servicios) los elementos inactivos para evitar accesos no deseados a datos "eliminados".
- No se permite eliminar físicamente registros con historial transaccional (ej: productos con órdenes).
