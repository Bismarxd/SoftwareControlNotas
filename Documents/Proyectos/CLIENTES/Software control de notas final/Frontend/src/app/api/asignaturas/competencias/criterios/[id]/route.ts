import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


// Ruta para eliminar
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);

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
