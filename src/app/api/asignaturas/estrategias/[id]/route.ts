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
