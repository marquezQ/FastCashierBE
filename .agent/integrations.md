# ⚙️ Integrations

Documentación técnica de servicios externos e integraciones del sistema.

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
folder: 'products'
filename sin extensión: 'abc123'
publicId: 'products/abc123'
```

### Flujo de Actualización de Imagen
```
Request (PATCH /products/:id con multipart) 
  → Multer intercepta archivo → buffer en memoria
  → deleteImage(oldUrl)         # Elimina imagen anterior
  → uploadImage(file)           # Sube nueva imagen
  → updateProductDto.imageUrl = result.secure_url  # Actualiza DTO
  → productRepository.save()    # Persiste URL en BD
```

### Multer Configuration
- Multer está configurado en memoria (`memoryStorage()`).
- El límite de tamaño y tipos de archivo se configuran en los controladores de `products` y `categories`.
- El campo del formulario debe llamarse `file`.

---

## 🚦 CORS

Habilitado globalmente en `main.ts` con:
```typescript
app.enableCors(); // Permite todos los orígenes
```

> [!WARNING]
> En producción, se recomienda configurar CORS con `origin` específico para el dominio del frontend.

---

## 🕐 Zona Horaria (Bolivia)

El proceso de Node.js tiene forzada la zona horaria `America/La_Paz` (UTC-4):
```typescript
process.env.TZ = 'America/La_Paz'; // main.ts línea 2
```
Esto impacta todos los timestamps generados por el servidor y los formatos de fecha en los reportes PDF.

---

## 📧 Mail (No implementado)

El sistema no tiene integración de correo electrónico actualmente. Se podría integrar `@nestjs-modules/mailer` o `nodemailer` para:
- Envío de reportes por email.
- Notificaciones de cierre de caja.
- Recuperación de contraseñas.

---

## 📡 WebSockets / Tiempo Real (No implementado)

Actualmente la cocina utiliza **polling** (el frontend hace requests periódicos). La arquitectura NestJS permite agregar `@WebSocketGateway` para actualizaciones en tiempo real mediante Socket.io:
- Notificación al crear una nueva orden (cocina ve el pedido instantáneamente).
- Actualización de estado en tiempo real para el panel del cajero.

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
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: configService.get('NODE_ENV') === 'development',
    logging:     configService.get('NODE_ENV') === 'development',
  }),
})
```
- `synchronize: true` solo en `development` — auto-sincroniza el esquema.
- `logging: true` solo en `development` — imprime queries SQL en consola.

---

**Versión:** 2.0 | **Actualizado:** 2026-03-01
