import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Ruta para seleccionar una asignatura y desmarcar las demás del mismo semestre
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const asignaturaId = parseInt(params.id, 10);
    const body = await request.json();
    const { semestreId } = body;

    if (!semestreId || !asignaturaId) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    // Desmarcar las demás asignaturas del mismo semestre
    await prisma.asignatura.updateMany({
      where: { semestreId },
      data: { seleccionado: false },
    });

    // Marcar la seleccionada como true
    const asignaturaSeleccionada = await prisma.asignatura.update({
      where: { id: asignaturaId },
      data: { seleccionado: true },
    });

    return NextResponse.json(asignaturaSeleccionada, { status: 200 });
  } catch (error) {
    console.error("Error al seleccionar asignatura:", error);
    return NextResponse.json(
      { error: "Error al seleccionar asignatura" },
      { status: 500 }
    );
  }
}
