# ⚙️ Integrations

Documentación técnica de servicios externos e integraciones del sistema.

---

## 🔌 WebSockets — Socket.IO (Tiempo Real)

El sistema utiliza **Socket.IO** a través de `@nestjs/websockets` para notificaciones en tiempo real entre el cajero y la cocina.

### Gateway: `OrdersGateway` (`src/orders/orders.gateway.ts`)

```typescript
@WebSocketGateway({
    cors: { origin: '*' },
    namespace: '/orders',
})
```

- **Namespace**: `/orders` — El frontend se conecta a `ws://localhost:3000/orders`.
- **CORS**: Permite todos los orígenes (`*`). En producción, restringir al dominio del frontend.
- **Transporte**: WebSocket puro (el cliente envía `transports: ['websocket']`).

### Eventos Emitidos (Servidor → Cliente)

| Evento | Momento | Datos |
| :--- | :--- | :--- |
| `new_order` | Al crear una orden exitosamente | Objeto `Order` completo con detalles y relaciones |
| `order_status_updated` | Al cambiar el estado de una orden o cancelarla | Objeto `Order` actualizado |

### Eventos Recibidos (Cliente → Servidor)

| Evento | Respuesta | Propósito |
| :--- | :--- | :--- |
| `ping` | `{ event: 'pong', data: 'Connection alive' }` | Health check de la conexión |

### Lifecycle Hooks
- **`afterInit`** — Log de inicialización del gateway.
- **`handleConnection`** — Log del ID del socket + conteo de clientes conectados.
- **`handleDisconnect`** — Log de desconexión del socket.

### Integración con OrdersService
El gateway se inyecta en `OrdersService` y se invoca en:
- `create()` → `this.ordersGateway.emitNewOrder(completedOrder)`
- `updateStatus()` → `this.ordersGateway.emitOrderStatusUpdated(updatedOrder)`
- `cancel()` → `this.ordersGateway.emitOrderStatusUpdated(updatedOrder)`

---

## 🔊 Text-to-Speech (TTS) — Microsoft Edge

El sistema genera audio MP3 para anunciar pedidos listos en la cocina usando voces neurales de Microsoft Edge.

### Módulo: `TtsModule` (`src/tts/`)

**Componentes:**
- `TtsController` — Endpoints expuestos (no protegidos por JWT, acceso público).
- `TtsService` — Lógica de generación de audio con caché en memoria.

### Arquitectura

```
Frontend (Kitchen)
     │
     │ fetch GET /api/tts/pedido/45
     ▼
TtsController
     │
     │ delega
     ▼
TtsService
     │
     ├── cache hit? → retorna Buffer del Map
     │
     └── cache miss? → genera audio:
            │
            ├── Dynamic import: msedge-tts (ESM puro)
            ├── Voz: es-MX-DaliaNeural
            ├── Formato: AUDIO_24KHZ_48KBITRATE_MONO_MP3
            ├── Texto: "Pedido número {N}, por favor"
            └── toStream() → Buffer → cache + respuesta
```

### Endpoints TTS

| Método | Ruta | Descripción | Auth |
| :--- | :--- | :--- | :--- |
| GET | `/api/tts/pedido/:numero` | Genera/retorna MP3 para un número de pedido (1-9999) | Público |
| DELETE | `/api/tts/cache` | Limpia toda la caché de audios en memoria | Público |

### Headers de Respuesta (GET pedido)
```
Content-Type: audio/mpeg
Content-Length: {bytes}
Cache-Control: public, max-age=86400
```

### Detalles Técnicos Importantes
- **Dynamic Import**: `msedge-tts` es un módulo ESM puro. NestJS usa CommonJS, así que se importa dinámicamente en `onModuleInit()`.
- **toStream vs rawToStream**: Se usa `toStream(texto)` con texto plano. `rawToStream()` con SSML personalizado causa desconexión silenciosa del servidor de Microsoft.
- **Caché**: `Map<number, Buffer>` en memoria. Se almacena el Buffer completo del MP3 por número de pedido. Persiste mientras el proceso esté activo.
- **Sin Auth**: Los endpoints de TTS no están protegidos por JWT/Roles para permitir acceso directo desde el frontend sin overhead de autenticación para archivos de audio.

---

## ☁️ Cloudinary (Manejo de Imágenes)

Cloudinary se utiliza para el almacenamiento persistente de imágenes de productos y categorías.

### Configuración

**Módulo**: `CloudinaryModule` (`src/cloudinary/`)
**Provider**: `cloudinary.provider.ts` — Inicializa el SDK con variables de entorno:
```typescript
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key:    CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});
```

**Variables de entorno requeridas:**
```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

### Servicio: `CloudinaryService`

#### `uploadImage(file, folder?)`
- Recibe un `Express.Multer.File` (archivo en buffer de memoria).
- Sube el archivo usando `cloudinary.uploader.upload_stream`.
- Folder por defecto: `'products'`.
- **Retorna**: `UploadApiResponse` con `secure_url` (HTTPS).
- La URL resultante se almacena en `products.image_url`.
- Implementación: usa Node.js `Readable` stream para pipear el buffer al uploader.

#### `deleteImage(imageUrl)`
- Recibe la URL completa de Cloudinary.
- Llama internamente a `extractPublicId(imageUrl)` para obtener el ID de Cloudinary.
- Elimina el recurso con `cloudinary.uploader.destroy(publicId)`.
- Los errores se suprimen (catch silencioso + `console.error`), para no interrumpir la operación principal.

#### `extractPublicId(imageUrl)` _(privado)_
Parsea la URL de Cloudinary para extraer el `publicId`:
```
URL: https://res.cloudinary.com/mycloud/image/upload/v123/products/abc123.jpg
     ↓ parse
publicId: 'products/abc123'
```

### Flujo de Actualización de Imagen
```
Request (PATCH /products/:id con multipart) 
  → Multer intercepta archivo → buffer en memoria
  → deleteImage(oldUrl)         # Elimina imagen anterior
  → uploadImage(file)           # Sube nueva imagen
  → updateProductDto.imageUrl = result.secure_url
  → productRepository.save()    # Persiste URL en BD
```

### Multer Configuration
- Multer está configurado en memoria (`memoryStorage()`).
- El campo del formulario debe llamarse `file`.

---

## 🚦 CORS

Habilitado globalmente en `main.ts`:
```typescript
app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
});
```

> [!WARNING]
> En producción, configurar `origin` con el dominio específico del frontend.

---

## 🕐 Zona Horaria (Bolivia)

El proceso de Node.js tiene forzada la zona horaria `America/La_Paz` (UTC-4):
```typescript
process.env.TZ = 'America/La_Paz'; // main.ts línea 2
```
Adicionalmente, la conexión PostgreSQL configura la zona horaria a nivel de sesión:
```typescript
extra: { options: '-c timezone=America/La_Paz' }
```
Esto impacta todos los timestamps generados por el servidor y los formatos de fecha en los reportes PDF.

---

## 🗄️ PostgreSQL Connection

Configuración de TypeORM en `app.module.ts`:
```typescript
TypeOrmModule.forRootAsync({
  useFactory: (configService) => ({
    type: 'postgres',
    host:     configService.get('DB_HOST'),
    port:     configService.get('DB_PORT'),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_NAME'),
    autoLoadEntities: true,
    synchronize: process.env.NODE_ENV !== 'production',
    dropSchema: process.env.DB_DROP_SCHEMA === 'true',
    extra: { options: '-c timezone=America/La_Paz' },
  }),
})
```
- `synchronize: true` solo cuando `NODE_ENV !== 'production'` — auto-sincroniza el esquema.
- `dropSchema: true` solo con `DB_DROP_SCHEMA=true` — permite `npm run db:fresh`.
- `autoLoadEntities: true` — carga automáticamente todas las entidades registradas en módulos.

## 📺 Display Público (TV Menu)

API pública para que dispositivos tipo TV o pantallas externas consulten la configuración del menú sin necesidad de autenticación JWT.

### Endpoint: `GET /api/display/:token`

- **Auth**: Público (sin JWT).
- **Parámetro**: `token` (Código de 6 caracteres).
- **Cache**: No tiene caché en el servidor (consultas directas a BD), pero se recomienda caché en el cliente.

### Flujo de Datos
1. La TV solicita datos usando el código de acceso.
2. El servidor valida que el token exista y la configuración esté `isActive = true`.
3. El servidor obtiene los productos activos de la categoría configurada (o todos si no hay categoría).
4. Retorna la configuración visual y la lista de productos simplificada.

---

**Versión:** 3.1 | **Actualizado:** 2026-05-05
