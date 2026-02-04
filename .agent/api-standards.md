# 📡 API Standards

El sistema sigue convenciones estrictas para garantizar la compatibilidad con herramientas de generación de código y frontend.

---

## 📝 Documentación Swagger (OpenAPI)

Toda la API está documentada dinámicamente:
- **URL UI**: `http://localhost:3000/api/docs`
- **JSON**: `http://localhost:3000/api/docs-json`

### Decoradores Imperativos
- `@ApiTags`: Agrupa los endpoints por módulo.
- `@ApiOperation`: Breve descripción del comportamiento.
- `@ApiResponse`: Define los códigos HTTP posibles y sus tipos de retorno.
- `@ApiProperty`: Documenta cada campo dentro de los DTOs, incluyendo ejemplos.

---

## 🏗️ DTOs (Data Transfer Objects)

Ubicados en `src/**/dto/*.dto.ts`.
- **Validación**: Se utiliza `class-validator` para reglas como `@IsNotEmpty`, `@IsEnum`, `@IsNumber`, etc.
- **Transformación**: `PartialType` y `OmitType` se usan para evitar duplicación de código en DTOs de actualización.
- **Mantenibilidad**: Todos los DTOs están exportados vía `index.ts` en cada carpeta de módulo.

---

## 🛣️ Convenciones de Rutas

- Todos los endpoints empiezan con el prefijo global definido en `main.ts` (normalmente `/api`).
- **Nombres de Recursos**: Siempre en plural (ej: `/orders`, `/products`).
- **Parámetros**: Uso de `:id` (numérico) con `ParseIntPipe`.
- **Filtros**: Parámetros de consulta (Query params) para estados (`?status=open`).

---

## 🔄 Respuestas Estándar

- **Éxito**: 200 OK (GET/PATCH), 201 Created (POST), 204 No Content (DELETE).
- **Errores**:
  - **400 Bad Request**: Errores de validación de campos.
  - **401 Unauthorized**: Falta o invalidez de token JWT.
  - **403 Forbidden**: Token válido pero sin privilegios de rol suficientes.
  - **404 Not Found**: Recurso inexistente.
  - **409 Conflict**: Violación de lógica de negocio (ej: doble sesión abierta).
