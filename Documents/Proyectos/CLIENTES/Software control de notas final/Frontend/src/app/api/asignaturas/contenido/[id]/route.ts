import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


// Ruta para eliminar contenido
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { status: false, message: "ID inválido." },
        { status: 400 }
      );
    }

    // Actualizar el registro para marcarlo como eliminado
    const contenidoEliminado = await prisma.contenido.update({
      where: { id },
      data: {
        eliminado: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      status: true,
      message: "Contenido eliminado correctamente.",
      contenido: contenidoEliminado,
    });
  } catch (error: any) {
    console.error("Error al eliminar el contenido:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al eliminar el contenido." },
      { status: 500 }
    );
  }
}
