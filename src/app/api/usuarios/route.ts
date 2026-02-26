import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";


// Ruta para obtener el usuario
export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany();
    return NextResponse.json({ usuarios, status: true });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json({
      message: "Error al traer los usuarios",
      status: false,
    });
  }
}

// Actualizar nombre de usuario
export async function PUT(req: Request) {
  try {
    const {
      id,
      nombreUsuario, // ✅ viene del frontend
      contrasenaActual,
      nuevaContrasena,
    } = await req.json();

    if (!id) {
      return NextResponse.json({
        message: "Falta el ID del usuario.",
        status: false,
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(id) },
    });

    if (!usuario) {
      return NextResponse.json({
        message: "Usuario no encontrado.",
        status: false,
      });
    }

    const dataActualizacion: any = {};

    // ✅ Cambiar nombre de usuario solo si es diferente
    if (nombreUsuario && nombreUsuario !== usuario.nombreUsuario) {
      dataActualizacion.nombreUsuario = nombreUsuario;
    }

    // ✅ Cambiar contraseña
    if (nuevaContrasena) {
      if (!contrasenaActual) {
        return NextResponse.json({
          message: "Debes ingresar tu contraseña actual.",
          status: false,
        });
      }

      const coincide = await bcrypt.compare(
        contrasenaActual,
        usuario.contrasena
      );
      if (!coincide) {
        return NextResponse.json({
          message: "La contraseña actual es incorrecta.",
          status: false,
        });
      }

      const salt = await bcrypt.genSalt(10);
      dataActualizacion.contrasena = await bcrypt.hash(nuevaContrasena, salt);
    }

    if (Object.keys(dataActualizacion).length === 0) {
      return NextResponse.json({
        message: "No hay cambios para actualizar.",
        status: false,
      });
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id: Number(id) },
      data: dataActualizacion,
    });

    return NextResponse.json({
      message: "Usuario actualizado correctamente.",
      usuario: {
        id: usuarioActualizado.id,
        nombreUsuario: usuarioActualizado.nombreUsuario,
      },
      status: true,
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return NextResponse.json({
      message: "Error al actualizar usuario.",
      status: false,
    });
  }
}
