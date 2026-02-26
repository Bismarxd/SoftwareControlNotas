import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


//Ruta para editar
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    const { descripcion, tipo } = await req.json();
    const id = Number(idParam);

    if (!descripcion || !tipo) {
      return NextResponse.json(
        { status: false, message: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    const objetivoActualizado = await prisma.objetivos.update({
      where: { id },
      data: {
        descripcion,
        tipo,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      status: true,
      message: "Objetivo actualizado correctamente.",
      objetivoActualizado,
    });
  } catch (error: any) {
    console.error("Error al actualizar objetivo:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al actualizar el objetivo." },
      { status: 500 }
    );
  }
}

// Ruta para eliminar
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);

    const objetivoEliminado = await prisma.objetivos.update({
      where: { id },
      data: {
        eliminado: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      status: true,
      message: "Objetivo eliminado correctamente.",
      objetivo: objetivoEliminado,
    });
  } catch (error: any) {
    console.error("Error al eliminar objetivo:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al eliminar el objetivo." },
      { status: 500 }
    );
  }
}
