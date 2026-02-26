import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


// Ruta para obtener una competencia por ID
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const competenciaId = parseInt(id);

    if (isNaN(competenciaId)) {
      return NextResponse.json(
        { status: false, message: "ID inválido" },
        { status: 400 }
      );
    }

    const competencia = await prisma.competencia.findUnique({
      where: { id: competenciaId },
      include: {
        criterioevaluacion: {
          include: {
            evidencia: true,
          },
        },
      },
    });

    if (!competencia) {
      return NextResponse.json(
        { status: false, message: "Competencia no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: true, competencia });
  } catch (error) {
    console.error("Error al obtener la competencia:", error);
    return NextResponse.json(
      { status: false, message: "Error al obtener la competencia" },
      { status: 500 }
    );
  }
}

// Ruta para eliminar
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);

    const competenciaEliminada = await prisma.competencia.update({
      where: { id },
      data: {
        eliminado: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      status: true,
      message: "Competencia eliminada correctamente.",
      competencia: competenciaEliminada,
    });
  } catch (error: any) {
    console.error("Error al eliminar la competencia:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al eliminar la competencia." },
      { status: 500 }
    );
  }
}
