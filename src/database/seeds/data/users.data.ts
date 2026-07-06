// Datos de usuarios para el seeder inicial.
//
// ⚠️  NO hardcodees usuarios reales aquí. Todos los valores se leen del
// archivo .env para que cada instancia del proyecto (demo, clienteA, etc.)
// pueda tener sus propios admins sin modificar el código fuente.
//
// SEED_MODE=demo       → Se carga esta lista completa (usuarios de ejemplo).
// SEED_MODE=production → Se carga solo getProductionUsers() (2 admins reales).
//
// Configura los valores en .env antes de ejecutar `npm run db:fresh`.

// ---------------------------------------------------------------------------
// Usuarios para SEED_MODE=demo
// Datos ficticios de ejemplo para la instancia de demostración.
// ---------------------------------------------------------------------------
export const demoUsers = [
  {
    fullName: 'Pedro Marquez',
    email: 'admin@gmail.com',
    password: '123456',
    phone: '70000001',
    roleId: 1, // ADMIN
    isActive: true,
  },
  {
    fullName: 'Fernando Marquez',
    email: 'fernando@gmail.com',
    password: '123456',
    phone: '70000001',
    roleId: 1, // ADMIN
    isActive: true,
  },
  {
    fullName: 'Maria Lopez',
    email: 'cashier@gmail.com',
    password: '123456',
    phone: '70000002',
    roleId: 2, // CASHIER
    isActive: true,
  },
  {
    fullName: 'Diego Maradona',
    email: 'diego@gmail.com',
    password: '123456',
    phone: '70000002',
    roleId: 2, // CASHIER
    isActive: true,
  },
  {
    fullName: 'Delma Martinez',
    email: 'cook@gmail.com',
    password: '123456',
    phone: '70000003',
    roleId: 3, // KITCHEN
    isActive: true,
  },
  {
    fullName: 'Juana Perez',
    email: 'juana@gmail.com',
    password: '123456',
    phone: '70000003',
    roleId: 3, // KITCHEN
    isActive: true,
  },
];

// ---------------------------------------------------------------------------
// Usuarios para SEED_MODE=production
// Lee del .env. Solo 2 admins: el desarrollador y el dueño del negocio.
// El dueño puede crear cajeros, cocineros y más admins desde el panel.
// ---------------------------------------------------------------------------
export const getProductionUsers = () => [
  {
    fullName: process.env.SEED_ADMIN_NAME || 'Admin Sistema',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@sistema.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe2024!',
    phone: '00000000',
    roleId: 1, // ADMIN — desarrollador / soporte técnico
    isActive: true,
  },
  {
    fullName: process.env.SEED_OWNER_NAME || 'Dueño del Negocio',
    email: process.env.SEED_OWNER_EMAIL || 'owner@negocio.com',
    password: process.env.SEED_OWNER_PASSWORD || 'ChangeMe2024!',
    phone: '00000000',
    roleId: 1, // ADMIN — dueño del negocio
    isActive: true,
  },
];
