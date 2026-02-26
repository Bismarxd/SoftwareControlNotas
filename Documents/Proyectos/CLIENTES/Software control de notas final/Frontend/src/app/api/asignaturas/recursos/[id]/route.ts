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
