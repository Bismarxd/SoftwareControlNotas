import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Ruta para iniciar sesión
export async function POST(req: NextRequest) {
  try {
    const { nombreUsuario, contrasena } = await req.json();

    if (!nombreUsuario || !contrasena) {
      return NextResponse.json({
        message: "Debe llenar todos los campos",
        status: false,
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { nombreUsuario },
    });

    if (!usuario) {
      return NextResponse.json({
        message: "Usuario no encontrado",
        status: false,
      });
    }

    const passwordValid = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!passwordValid) {
      return NextResponse.json(
        { message: "Contraseña incorrecta" },
        { status: 401 }
      );
    }

    // const { contrasena: _, ...usuarioSinPassword } = usuario;

    // ✅ Generar token JWT
    const token = jwt.sign(
      { id: usuario.id, nombreUsuario: usuario.nombreUsuario },
      process.env.JWT_SECRET || "mi_codigo_super_seguro",
      { expiresIn: "1d" } // dura 1 día
    );

    // Guardar el token en los cookies
    const res = NextResponse.json({
      message: "Login exitoso",
      usuario,
      status: true,
    });
    res.cookies.set("token", token, { httpOnly: true });

    return res;
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    } else {
      return NextResponse.json({
        message: "Error desconocido del servidor",
        status: false,
      });
    }
  }
}
