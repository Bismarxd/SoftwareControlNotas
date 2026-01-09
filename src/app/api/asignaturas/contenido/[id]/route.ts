import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Ruta para eliminar contenido
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

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
