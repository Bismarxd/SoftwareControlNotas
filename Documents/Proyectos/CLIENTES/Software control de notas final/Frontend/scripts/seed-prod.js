// Production seed: inserts the default user only if it doesn't exist yet.
// Safe to run on every container start.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.usuario.findUnique({
    where: { nombreUsuario: 'bismar' },
  });

  if (existing) {
    console.log('[seed-prod] Usuario ya existe, se omite la inserción.');
    return;
  }

  await prisma.usuario.create({
    data: {
      nombreUsuario: 'bismar',
      contrasena: '$2b$10$p1EB9baNWx4ckAAch85bfeMeGuAFxgsbX4s0R6vyRvGVYqGar7gNq',
    },
  });

  console.log('[seed-prod] Usuario "bismar" creado exitosamente.');
}

main()
  .catch((e) => {
    console.error('[seed-prod] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
