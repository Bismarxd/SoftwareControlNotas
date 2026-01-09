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

    const criterioEliminado = await prisma.criterioevaluacion.update({
      where: { id },
      data: {
        eliminado: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      status: true,
      message: "Criterio eliminado correctamente.",
      competencia: criterioEliminado,
    });
  } catch (error: any) {
    console.error("Error al eliminar el criterio:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al eliminar el criterio." },
      { status: 500 }
    );
  }
}
