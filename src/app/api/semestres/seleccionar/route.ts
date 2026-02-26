import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


// Obtener el semestre por el id
export async function PATCH(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    // Quitar selección de todos
    await prisma.semestre.updateMany({
      data: { seleccionado: false },
    });

    // Marcar el nuevo seleccionado
    const semestreSeleccionado = await prisma.semestre.update({
      where: { id },
      data: { seleccionado: true },
    });

    return NextResponse.json({ semestreSeleccionado, status: true });
  } catch (error) {
    console.error("Error al seleccionar semestre:", error);
    return NextResponse.json({
      error: "Error al seleccionar semestre",
      status: false,
    });
  }
}
