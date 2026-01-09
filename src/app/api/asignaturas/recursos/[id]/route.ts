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

    const recursoEliminado = await prisma.recursos.update({
      where: { id },
      data: {
        eliminado: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      status: true,
      message: "Recurso eliminado correctamente.",
      recurso: recursoEliminado,
    });
  } catch (error: any) {
    console.error("Error al eliminar el recurso:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al eliminar el recurso." },
      { status: 500 }
    );
  }
}
