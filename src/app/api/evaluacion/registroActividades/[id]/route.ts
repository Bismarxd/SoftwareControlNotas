import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Ruta para eliminar
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

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
