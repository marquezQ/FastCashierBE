# 🚀 Guía de Deployment Multi-Cliente en VPS

Cómo onboardear un nuevo cliente en el VPS personal sin tocar la instancia demo ni ningún otro cliente existente.

---

## 🏗️ Arquitectura en el VPS

```
/var/www/fastcashier/               ← Demo actual (no tocar)
  ├── backend/                      ← Este repo (PORT=3000, DB=punto_venta_db)
  └── frontend/                     ← Build de Vite (apunta a demo API)

/var/www/fastcashier-primerclienteA/  ← 🆕 Cliente A
  ├── backend/                         (PORT=3001, DB=fastcashier_primerclienteA)
  └── frontend/                        (apunta a API del cliente A)

/var/www/fastcashier-clienteB/        ← (Futuro Cliente B)
  ├── backend/                         (PORT=3002, DB=fastcashier_clienteB)
  └── frontend/
```

**Reglas:**
- Cada cliente tiene su propio puerto, su propia BD y su propio proceso en PM2.
- El código fuente es IDÉNTICO en todas las instancias (mismo repo, mismo branch).
- Lo único diferente es el `.env` de cada instancia.

---

## 📋 Paso a Paso: Onboardear un Nuevo Cliente

### Paso 1 — Crear la base de datos en PostgreSQL

```bash
# Conectarse a PostgreSQL como superusuario
sudo -u postgres psql

-- Dentro de psql:
CREATE DATABASE fastcashier_primerclienteA;
CREATE USER primerclienteA_user WITH PASSWORD 'password_muy_seguro_aqui';
GRANT ALL PRIVILEGES ON DATABASE fastcashier_primerclienteA TO primerclienteA_user;
\q
```

### Paso 2 — Clonar el backend en la carpeta del cliente

```bash
# Crear directorio del cliente
mkdir -p /var/www/fastcashier-primerclienteA/backend
cd /var/www/fastcashier-primerclienteA/backend

# Clonar el repo (mismo repo del demo, misma codebase)
git clone <URL-DEL-REPO> .
npm install
```

### Paso 3 — Crear el `.env` del cliente

```bash
# Copiar el template
cp .env.example .env
nano .env    # o vim .env
```

Rellenar con los valores del cliente. Ver las secciones comentadas en `.env.example`.
El `.env` para PrimerCliente se ve así:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=primerclienteA_user
DB_PASSWORD=password_muy_seguro_aqui
DB_NAME=fastcashier_primerclienteA

# JWT — IMPORTANTE: usar un secreto DIFERENTE al del demo
JWT_SECRET=otro_secreto_largo_y_unico_para_este_cliente
JWT_EXPIRATION=24h

# Servidor
PORT=3001
NODE_ENV=production        ← Siempre 'production' en el VPS
DB_DROP_SCHEMA=false       ← false en producción

# Cloudinary — misma cuenta, carpeta diferente
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
CLOUDINARY_FOLDER=primerclienteA/products

# Seed inicial
SEED_MODE=production
SEED_ADMIN_NAME=Pedro Marquez
SEED_ADMIN_EMAIL=tu@email.com
SEED_ADMIN_PASSWORD=tu_password_admin_seguro

SEED_OWNER_NAME=Nombre del Dueño
SEED_OWNER_EMAIL=dueno@sunegocio.com
SEED_OWNER_PASSWORD=password_inicial_para_el_dueno
```

### Paso 4 — Primer seed (UNA sola vez)

> ⚠️ Este paso BORRA y recrea la BD. Solo ejecutarlo en la primera instalación.

```bash
# Temporarily override NODE_ENV and DB_DROP_SCHEMA solo para el seed inicial
NODE_ENV=development DB_DROP_SCHEMA=true npm run start:dev

# Cuando veas en los logs:
# "====== MASTER SEED FINISHED SUCCESSFULLY ======"
# Presiona Ctrl+C para detener el proceso.
```

Después del seed, la BD tendrá:
- Los 3 roles del sistema (ADMIN, CASHIER, KITCHEN)
- Tu usuario admin (para soporte técnico)
- El usuario admin del dueño del negocio

El dueño puede iniciar sesión y crear: cajeros, cocineros, categorías, productos.

### Paso 5 — Build de producción y arranque con PM2

```bash
# Compilar TypeScript
npm run build

# Arrancar con PM2 (proceso separado del demo)
pm2 start dist/main.js --name "fastcashier-primerclienteA"

# Guardar la lista de procesos para que sobreviva reinicios del servidor
pm2 save
```

### Paso 6 — Configurar NGINX para el nuevo dominio

```bash
# Crear configuración de NGINX para el backend del cliente
sudo nano /etc/nginx/sites-available/fastcashier-primerclienteA-api
```

```nginx
server {
    listen 80;
    server_name api.primerclienteA.com;  # Ajusta al dominio real

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activar el sitio
sudo ln -s /etc/nginx/sites-available/fastcashier-primerclienteA-api \
           /etc/nginx/sites-enabled/

# SSL gratuito con Let's Encrypt
sudo certbot --nginx -d api.primerclienteA.com

# Recargar NGINX
sudo nginx -s reload
```

### Paso 7 — Frontend del cliente

```bash
mkdir -p /var/www/fastcashier-primerclienteA/frontend
cd /var/www/fastcashier-primerclienteA/frontend

# Clonar el repo del frontend
git clone <URL-REPO-FRONTEND> .
npm install

# Crear .env.production con la URL de la API del cliente
echo "VITE_API_URL=https://api.primerclienteA.com" > .env.production

# Build de producción
npm run build
# El output estará en dist/
```

Configuración NGINX para el frontend:

```nginx
server {
    listen 80;
    server_name app.primerclienteA.com;

    root /var/www/fastcashier-primerclienteA/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/fastcashier-primerclienteA-app \
           /etc/nginx/sites-enabled/
sudo certbot --nginx -d app.primerclienteA.com
sudo nginx -s reload
```

---

## 🔄 Actualizar Todos los Clientes con Nuevas Features

Cuando hagas mejoras al backend o frontend, actualiza así:

### Script de actualización del backend

```bash
# /var/www/scripts/update-backend.sh
#!/bin/bash
INSTANCE=$1
cd /var/www/$INSTANCE/backend

echo "🔄 Actualizando backend: $INSTANCE"
git pull origin main
npm install
npm run build
pm2 restart $INSTANCE
echo "✅ $INSTANCE actualizado"
```

```bash
chmod +x /var/www/scripts/update-backend.sh

# Actualizar clientes uno por uno:
./update-backend.sh fastcashier-primerclienteA
# En el futuro:
# ./update-backend.sh fastcashier-clienteB
# ./update-backend.sh fastcashier-clienteC
```

### Script de actualización del frontend

```bash
# /var/www/scripts/update-frontend.sh
#!/bin/bash
INSTANCE=$1
cd /var/www/$INSTANCE/frontend

echo "🔄 Actualizando frontend: $INSTANCE"
git pull origin main
npm install
npm run build
echo "✅ Frontend de $INSTANCE actualizado (build en dist/)"
```

> **Nota**: El demo también puede actualizarse con el mismo script:
> `./update-backend.sh fastcashier` (el que está en /var/www/fastcashier/)

---

## 📊 Tabla de Instancias Activas

Mantén esta tabla actualizada cuando agregues nuevos clientes:

| ID PM2 | Nombre PM2 | Puerto | Base de Datos | Cloudinary Folder | Dominio API | Dominio App |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 0 | `fastcashier-backend` | 3000 | `punto_venta_db` | `products` | `api.demo.tudominio.com` | `demo.tudominio.com` |
| 1 | `fastcashier-primerclienteA` | 3001 | `fastcashier_primerclienteA` | `primerclienteA/products` | `api.primerclienteA.com` | `app.primerclienteA.com` |

---

## ⚠️ Checklist de Seguridad por Cliente

Antes de entregar acceso al cliente, verifica:

- [ ] `NODE_ENV=production` en el `.env` del cliente
- [ ] `DB_DROP_SCHEMA=false` en el `.env`
- [ ] JWT_SECRET diferente al demo y a otros clientes
- [ ] Contraseña del SEED_OWNER_* comunicada de forma segura al dueño
- [ ] El dueño cambió su contraseña en el primer login
- [ ] SSL activo en ambos dominios (API y frontend)
- [ ] El proceso PM2 está en la lista de `pm2 list`
- [ ] `pm2 save` ejecutado para persistir tras reinicios

---

## 🛠️ Comandos Útiles en el VPS

```bash
# Ver todos los procesos corriendo
sudo su - deploy
pm2 list

# Logs de una instancia específica
pm2 logs fastcashier-primerclienteA

# Reiniciar una instancia
pm2 restart fastcashier-primerclienteA

# Ver estado del sistema
pm2 monit
```

---

**Versión:** 1.0 | **Actualizado:** 2026-07-06
