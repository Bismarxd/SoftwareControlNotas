import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


// Ruta para eliminar
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);

    const competenciaEliminada = await prisma.actividad.update({
      where: { id },
      data: {
        eliminado: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      status: true,
      message: "Actividad eliminada correctamente.",
      competencia: competenciaEliminada,
    });
  } catch (error: any) {
    console.error("Error al eliminar la actividad:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al eliminar la actividad." },
      { status: 500 }
    );
  }
}
