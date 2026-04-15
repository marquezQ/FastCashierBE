# 🛡️ Security & Auth

La seguridad del sistema se basa en **JWT** (JSON Web Tokens) y **RBAC** (Role-Based Access Control) implementados con NestJS Passport.

---

## 🔑 Autenticación (JWT)

### Flujo de Login
1. El cliente hace `POST /api/auth/login` con `{ email, password }`.
2. `AuthService.login()` busca el usuario por email mediante `UsersService.findByEmail()`.
3. Valida que el usuario exista y que `isActive = true`.
4. Compara la contraseña con `bcrypt.compare(password, passwordHash)`.
5. Si es válido, actualiza `lastAccess` del usuario.
6. Genera un JWT firmado con `JWT_SECRET`:
   ```typescript
   payload: { sub: user.idUser, email: user.email }
   ```
7. Devuelve `{ user, access_token }`.

### Flujo de Register
- `POST /api/auth/register` crea un nuevo usuario y devuelve también un `access_token`.
- **Nota:** Este endpoint no está protegido por roles (acceso público). La lógica de a quién se le permite registrarse debe controlarse desde el frontend o añadiendo validaciones.

### Validación de Token
- `POST /api/auth/validate` permite verificar si un token es válido sin necesidad de consumir un endpoint protegido.

### Uso del Token
El cliente debe enviar el token JWT en **cada request** protegido:
```http
Authorization: Bearer <access_token>
```

---

## 🪪 Roles & Permisos (RBAC)

### Roles del Sistema

| Rol | ID Interno | Descripción |
| :--- | :--- | :--- |
| **ADMIN** | 1 | Acceso total. CRUD de usuarios, reportes, eliminación de sesiones y órdenes. |
| **CASHIER** | 2 | Apertura/cierre de caja, creación y cancelación de órdenes, estadísticas de sesión. |
| **KITCHEN** | 3 | Lectura de pedidos activos y cambio de estado (hasta DELIVERED). No puede crear/cancelar órdenes. |

### Matriz de Permisos por Endpoint

| Módulo | Endpoint | ADMIN | CASHIER | KITCHEN |
| :--- | :--- | :---: | :---: | :---: |
| **Auth** | `POST /auth/login` | ✅ | ✅ | ✅ |
| **Auth** | `POST /auth/register` | ✅ | ✅ | ✅ |
| **Users** | `GET /users` | ✅ | ❌ | ❌ |
| **Users** | `POST /users` | ✅ | ❌ | ❌ |
| **Users** | `PATCH /users/:id` | ✅ | ❌ | ❌ |
| **Orders** | `POST /orders` | ✅ | ✅ | ❌ |
| **Orders** | `GET /orders` | ✅ | ✅ | ✅ |
| **Orders** | `GET /orders/kitchen-display` | ✅ | ✅ | ✅ |
| **Orders** | `PATCH /orders/:id/status` | ✅ | ✅ | ✅ |
| **Orders** | `POST /orders/:id/cancel` | ✅ | ✅ | ❌ |
| **Orders** | `DELETE /orders/:id` | ✅ | ❌ | ❌ |
| **Orders** | `GET /orders/metrics/dashboard` | ✅ | ❌ | ❌ |
| **Orders** | `GET /orders/metrics/cancellations` | ✅ | ❌ | ❌ |
| **Sessions** | `POST /cashier-sessions` | ✅ | ✅ | ❌ |
| **Sessions** | `GET /cashier-sessions` | ✅ | ✅ | ❌ |
| **Sessions** | `POST /cashier-sessions/:id/close` | ✅ | ✅ | ❌ |
| **Sessions** | `DELETE /cashier-sessions/:id` | ✅ | ❌ | ❌ |
| **Sessions** | `GET /cashier-sessions/report/pdf` | ✅ | ✅ | ❌ |
| **Sessions** | `GET /cashier-sessions/:id/report/pdf` | ✅ | ✅ | ❌ |
| **Reports** | `GET /reports/sales` | ✅ | ❌ | ❌ |
| **Products** | `POST /products` | ✅ | ❌ | ❌ |
| **Products** | `GET /products` | ✅ | ✅ | ✅ |
| **Categories** | CRUD completo | ✅ | ❌ | ❌ |
| **TTS** | `GET /tts/pedido/:numero` | ✅ | ✅ | ✅ |
| **TTS** | `DELETE /tts/cache` | ✅ | ✅ | ✅ |

> [!NOTE]
> Los endpoints de TTS (`/api/tts/*`) no están protegidos por `JwtAuthGuard` ni `RolesGuard`. Son accesibles sin autenticación para minimizar la latencia en la reproducción de audio en la cocina.

---

## 🛡️ Guards Implementados

### `JwtAuthGuard` (`src/auth/guards/jwt-auth.guard.ts`)
- Extiende `AuthGuard('jwt')` de Passport.
- Extrae el Bearer token del header `Authorization`.
- Verifica la firma y expiración del token contra `JWT_SECRET`.
- Si es válido, adjunta el objeto `user` al `request` para uso en controladores.
- Si es inválido o está ausente → `401 Unauthorized`.

### `RolesGuard` (`src/auth/guards/roles.guard.ts`)
- Compara el `roleId` del usuario autenticado contra los roles requeridos por el decorador `@Roles()`.
- Mapeo interno: `{ ADMIN: 1, CASHIER: 2, KITCHEN: 3 }`.
- Si el rol no coincide → `403 Forbidden`.
- Se aplica **siempre** junto con `JwtAuthGuard`: `@UseGuards(JwtAuthGuard, RolesGuard)`.

### `LocalAuthGuard` (`src/auth/guards/local-auth.guard.ts`)
- Usado internamente por la estrategia `passport-local` para validar credenciales en el flujo de login.

---

## 🔐 Decoradores de Seguridad

```typescript
// Aplicar en controlador o método individual
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'CASHIER')
```

- `@UseGuards(JwtAuthGuard, RolesGuard)`: Aplica ambos guards en orden.
- `@Roles(...roles)`: Define qué roles tienen acceso. Es un reflector de metadatos.

---

## 🏠 Soft Delete como Mecanismo de Seguridad

Las entidades `User`, `Category` y `Product` usan `isActive: boolean` en lugar de eliminación física:
- **usuarios**: Si `isActive = false`, el login falla con `401 Unauthorized ('User inactive')`.
- **productos**: Si `isActive = false`, no pueden incluirse en nuevas órdenes (validación en `ProductsService.findByIds()`).
- **categorías**: Filtradas automáticamente en las consultas de productos activos.

---

## 🔒 Hashing de Contraseñas

- Librería: `bcrypt` v6.
- La columna `passwordHash` tiene `select: false` en TypeORM, lo que significa que **nunca se devuelve en queries estándar** a menos que se solicite explícitamente con `.addSelect('user.passwordHash')`.
- Solo `AuthService` y `UsersService.findByEmail()` acceden al hash para comparación.

---

**Versión:** 3.0 | **Actualizado:** 2026-04-14
