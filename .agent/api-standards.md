# 📡 API Standards

El sistema sigue convenciones estrictas para garantizar la compatibilidad con herramientas de generación de código y frontend. Toda endpoint empieza con el prefijo global `/api`.

---

## 📚 Documentación Swagger (OpenAPI)

| Recurso | URL |
| :--- | :--- |
| **UI Interactiva** | `http://localhost:3000/api/docs` |
| **JSON Schema** | `http://localhost:3000/api/docs-json` |

### Decoradores Imperativos
- `@ApiTags('Nombre')`: Agrupa los endpoints por módulo en la UI.
- `@ApiOperation({ summary, description })`: Describe el comportamiento del endpoint.
- `@ApiResponse({ status, description, type })`: Define los códigos HTTP posibles.
- `@ApiProperty({ example, description })`: Documenta cada campo de los DTOs.
- `@ApiParam({ name, description })`: Documenta parámetros de ruta.
- `@ApiQuery({ name, description, required })`: Documenta query parameters.
- `@ApiBearerAuth('JWT-auth')`: Indica que el endpoint requiere token JWT.

### Tags Swagger Registrados
- `Authentication`: Login, register, validate-token.
- `Users`: CRUD de usuarios.
- `Roles`: CRUD de roles.
- `Categories`: CRUD de categorías.
- `Products`: CRUD de productos + búsqueda + agrupado.
- `Orders`: CRUD de órdenes + kitchen display + métricas.
- `Cashier Sessions`: Sesiones + estadísticas + PDF.
- `Reports`: Rendimiento de ventas por rango.
- `TTS`: Generación de audio para pedidos.

---

## 🏗️ DTOs (Data Transfer Objects)

Ubicados en `src/**/dto/*.dto.ts`. Exportados via `index.ts` en cada carpeta.

### Patrones de Uso
- **Creación**: `CreateXxxDto` con todos los campos requeridos y validaciones.
- **Actualización**: `UpdateXxxDto` extiende `PartialType(CreateXxxDto)` → todos los campos opcionales.
- **Consulta**: DTOs específicos para query params (ej: `FindAllSessionsDto`, `AdminMetricsFilterDto`).
- **Respuesta**: DTOs para datos de respuesta estructurados (ej: `SessionStatisticsDto`, `ResponsiblePersonDto`).

### Validadores Más Usados
```typescript
@IsNotEmpty()          // No vacío
@IsString()            // Es string
@IsNumber()            // Es número
@IsEnum(['A', 'B'])    // Enum válido
@IsOptional()          // Opcional (no falla si ausente)
@IsDateString()        // Formato ISO date (YYYY-MM-DD)
@IsArray()             // Es array
@ValidateNested()      // Valida objetos anidados
@Type(() => Class)     // Transforma a clase (requerido para class-validator con arrays)
@Min(0)                // Valor mínimo
@IsPositive()          // Número positivo
```

### Pipeline Global de Validación
Configurado en `main.ts`:
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,          // Elimina propiedades no declaradas en el DTO
  forbidNonWhitelisted: true, // Lanza error si vienen propiedades extra
  transform: true,          // Convierte tipos automáticamente (string → number, etc.)
}));
```

---

## 🛣️ Convenciones de Rutas

### Prefijo Global
```
/api  →  definido en main.ts con app.setGlobalPrefix('api')
```

### Nomenclatura de Recursos
- **Plural**: `/orders`, `/products`, `/cashier-sessions`, `/users`, `/categories`.
- **Sub-recursos**: Siempre anidados bajo el recurso padre (ej: `/orders/:id/status`, `/cashier-sessions/:id/close`).
- **Colecciones especiales**: Endpoints de acción con nombres descriptivos (ej: `kitchen-display`, `metrics/dashboard`).

### Parámetros
- **Path params**: `:id` con `ParseIntPipe` para IDs numéricos.
- **Query params**: Para filtros opcionales (`?status=PENDING`, `?period=7d`, `?q=busqueda`).
- **Body**: JSON para creación/actualización.

---

## 🗺️ Inventario Completo de Endpoints

### Auth (`/api/auth`)
| Método | Ruta | Descripción | Roles |
| :--- | :--- | :--- | :--- |
| POST | `/login` | Iniciar sesión | Público |
| POST | `/register` | Registrar usuario | Público |
| POST | `/validate` | Verificar token | Público |

### Users (`/api/users`)
| Método | Ruta | Descripción | Roles |
| :--- | :--- | :--- | :--- |
| GET | `/` | Listar todos los usuarios | ADMIN |
| GET | `/:id` | Obtener usuario por ID | ADMIN |
| POST | `/` | Crear usuario | ADMIN |
| PATCH | `/:id` | Actualizar usuario | ADMIN |
| DELETE | `/:id` | Desactivar usuario | ADMIN |

### Categories (`/api/categories`)
| Método | Ruta | Descripción | Roles |
| :--- | :--- | :--- | :--- |
| GET | `/` | Listar todas | Todos |
| GET | `/:id` | Por ID | Todos |
| POST | `/` | Crear | ADMIN |
| PATCH | `/:id` | Actualizar | ADMIN |
| DELETE | `/:id` | Soft-delete | ADMIN |

### Products (`/api/products`)
| Método | Ruta | Descripción | Roles |
| :--- | :--- | :--- | :--- |
| GET | `/` | Listar activos | Todos |
| GET | `/search?q=` | Buscar por nombre/código | Todos |
| GET | `/grouped-by-category` | Agrupados (todos) | Todos |
| GET | `/active-grouped` | Solo activos, agrupados | Todos |
| GET | `/:id` | Por ID | Todos |
| POST | `/` | Crear (con imagen multipart) | ADMIN |
| PATCH | `/:id` | Actualizar (con imagen) | ADMIN |
| PATCH | `/:id/toggle-active` | Activar/desactivar | ADMIN |
| DELETE | `/:id` | Soft-delete | ADMIN |

### Orders (`/api/orders`)
| Método | Ruta | Descripción | Roles |
| :--- | :--- | :--- | :--- |
| POST | `/` | Crear orden (+ emit `new_order` WS) | ADMIN, CASHIER |
| GET | `/` | Listar órdenes (`?status=`) | Todos |
| GET | `/pending` | Órdenes pendientes/en-preparación | Todos |
| GET | `/kitchen-display` | Display cocina (últimas 18h, activas) | Todos |
| GET | `/history` | Historial cocina (últimas 18h, completadas) | Todos |
| GET | `/stats?sessionId=` | Estadísticas por sesión | ADMIN, CASHIER |
| GET | `/metrics/dashboard` | Métricas admin dashboard | ADMIN |
| GET | `/metrics/cancellations` | Reporte de cancelaciones | ADMIN |
| GET | `/session/:sessionId` | Órdenes de una sesión | ADMIN, CASHIER |
| GET | `/number/:orderNumber` | Por número de orden | Todos |
| GET | `/:id` | Por ID | Todos |
| PATCH | `/:id` | Actualizar orden | ADMIN, CASHIER |
| PATCH | `/:id/status` | Cambiar estado (+ emit `order_status_updated` WS) | Todos |
| POST | `/:id/cancel` | Cancelar orden (+ emit WS, `body: {reason}`) | ADMIN, CASHIER |
| DELETE | `/:id` | Eliminar (solo CANCELLED) | ADMIN |

### Cashier Sessions (`/api/cashier-sessions`)
| Método | Ruta | Descripción | Roles |
| :--- | :--- | :--- | :--- |
| POST | `/` | Abrir nueva sesión (server timestamp) | ADMIN, CASHIER |
| GET | `/` | Listar sesiones (`?period=`, `?startDate=`) | ADMIN, CASHIER |
| GET | `/report/pdf` | Generar PDF multi-sesión | ADMIN, CASHIER |
| GET | `/user/:userId` | Sesiones de un usuario | ADMIN, CASHIER |
| GET | `/current/:userId` | Sesión activa de un usuario | ADMIN, CASHIER |
| GET | `/:id` | Por ID | ADMIN, CASHIER |
| GET | `/:id/summary` | Resumen financiero de sesión | ADMIN, CASHIER |
| GET | `/:id/statistics` | Estadísticas detalladas | ADMIN, CASHIER |
| GET | `/:id/report/pdf` | **PDF individual de sesión con órdenes** | ADMIN, CASHIER |
| PATCH | `/:id` | Actualizar sesión abierta | ADMIN, CASHIER |
| POST | `/:id/close` | Cerrar sesión (server timestamp) | ADMIN, CASHIER |
| DELETE | `/:id` | Eliminar sesión vacía y cerrada | ADMIN |

### Reports (`/api/reports`)
| Método | Ruta | Descripción | Roles |
| :--- | :--- | :--- | :--- |
| GET | `/sales?start=&end=` | Rendimiento de ventas por rango (JSON) | ADMIN |

### TTS (`/api/tts`)
| Método | Ruta | Descripción | Roles |
| :--- | :--- | :--- | :--- |
| GET | `/pedido/:numero` | Generar/retornar audio MP3 (1-9999) | Público |
| DELETE | `/cache` | Limpiar caché de audios | Público |

---

## 🔄 Códigos de Respuesta Estándar

| Código | Situación |
| :--- | :--- |
| `200 OK` | GET exitoso, PATCH exitoso, POST de acción (cancel, close) |
| `201 Created` | POST de creación exitoso |
| `204 No Content` | DELETE exitoso |
| `400 Bad Request` | Validación de DTO fallida, lógica inválida (ej: transición de estado incorrecta, pago insuficiente) |
| `401 Unauthorized` | Token ausente, expirado o inválido; usuario inactivo |
| `403 Forbidden` | Token válido pero sin el rol requerido |
| `404 Not Found` | Recurso no encontrado por ID |
| `409 Conflict` | Violación de unicidad (ej: sesión ya abierta, código de producto duplicado) |
| `500 Internal Server Error` | Error del servidor (ej: fallo de generación TTS) |

---

**Versión:** 3.0 | **Actualizado:** 2026-04-14
