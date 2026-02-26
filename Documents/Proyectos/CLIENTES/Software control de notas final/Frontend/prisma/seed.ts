import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const nombreUsuario = "bismar"
  const contrasena = "$2b$10$p1EB9baNWx4ckAAch85bfeMeGuAFxgsbX4s0R6vyRvGVYqGar7gNq"

  const usuarioExistente = await prisma.usuario.findUnique({
    where: { nombreUsuario },
  })

  if (!usuarioExistente) {
    await prisma.usuario.create({
      data: {
        nombreUsuario,
        contrasena,
      },
    })
    console.log('✅ Usuario inicial creado con éxito.')
  } else {
    console.log('ℹ️ El usuario inicial ya existe.')
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
