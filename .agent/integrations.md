# ⚙️ Integrations

Documentación técnica de servicios externos e integraciones del sistema.

---

## ☁️ Cloudinary (Manejo de Imágenes)

Se utiliza Cloudinary para el almacenamiento persistente de imágenes de productos y perfiles.

- **Servicio**: `CloudinaryService` (`src/cloudinary`)
- **Configuración**: Se inicializa mediante un Provider que utiliza las variables de entorno de Cloudinary.
- **Funcionalidades**:
  - `uploadImage(file, folder)`: Recibe un buffer de Multer y lo sube al folder especificado (default: 'products'). Retorna la URL segura.
  - `deleteImage(imageUrl)`: Extrae el `publicId` de la URL y elimina el recurso de los servidores de Cloudinary.

### 🔍 Extracción de Public ID
El sistema implementa una lógica privada `extractPublicId` para interpretar la estructura de URLs de Cloudinary y recuperar la ruta interna necesaria para la eliminación.

---

## 📧 Mail (Pendiente)
*Nota: El sistema está preparado para integrar servicios de notificación pero no se han implementado proveedores externos de correo aún.*

---

## 📡 WebSockets (Opcional)
*Nota: La arquitectura NestJS permite agregar Gateways para actualizaciones en tiempo real de la cocina, pero actualmente se utiliza polling o recarga manual en el frontend.*
