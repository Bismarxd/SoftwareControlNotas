import { NextResponse } from "next/server";

//Ruta para cerrar Sesión
export async function POST() {
  try {
    // Crear respuesta
    const res = NextResponse.json({
      message: "Sesión cerrada correctamente",
      status: true,
    });

    // 🔑 Eliminar la cookie del token
    res.cookies.set("token", "", {
      httpOnly: true,
      expires: new Date(0), // expira inmediatamente
    });

    return res;
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    return NextResponse.json(
      { message: "Error al cerrar sesión", status: false },
      { status: 500 }
    );
  }
}
