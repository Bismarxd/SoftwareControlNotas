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

    const estrategiaEliminada = await prisma.estrategia.update({
      where: { id },
      data: {
        eliminado: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      status: true,
      message: "Estrategia eliminada correctamente.",
      estrategia: estrategiaEliminada,
    });
  } catch (error: any) {
    console.error("Error al eliminar la estrategia:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al eliminar la estrategia." },
      { status: 500 }
    );
  }
}
