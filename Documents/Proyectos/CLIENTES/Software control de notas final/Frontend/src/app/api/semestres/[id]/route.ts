import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


// UpdateData con campos opcionales
/*
interface UpdateData {
  nombre?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  estado?: boolean | string;
}
*/

// Ruta para obtener un semestre por el id
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    const semestre = await prisma.semestre.findUnique({
      where: { id: Number(idParam) },
    });

    if (!semestre) {
      return NextResponse.json(
        { error: "Semestre no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(semestre, { status: 200 });
  } catch (error) {
    console.error("Error al obtener semestre:", error);
    return NextResponse.json(
      { error: "Error al obtener semestre" },
      { status: 500 }
    );
  }
}

// Ruta para Editar el semestre
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { status: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { nombre, fechaInicio, fechaFin, estado } = body;

    const updateData: {
      nombre?: string;
      fechaInicio?: Date;
      fechaFin?: Date;
      estado?: boolean;
    } = {};

    if (nombre) updateData.nombre = nombre;
    if (fechaInicio) updateData.fechaInicio = new Date(fechaInicio);
    if (fechaFin) updateData.fechaFin = new Date(fechaFin);

    // ✅ Convertir el estado (string → boolean)
    if (estado !== undefined) {
      if (estado === "Activo" || estado === true) {
        updateData.estado = true;

        // Si este semestre se activa, desactiva los demás
        await prisma.semestre.updateMany({
          where: { id: { not: id } },
          data: { estado: false },
        });
      } else {
        updateData.estado = false;
      }
    }

    // Actualizar semestre
    const semestreActualizado = await prisma.semestre.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      { status: true, semestreActualizado },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al actualizar semestre:", error);
    return NextResponse.json(
      { status: false, error: "Error al actualizar semestre" },
      { status: 500 }
    );
  }
}

// Para eliminar el semestre (borrado lógico)
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    const semestreId = Number(idParam);

    if (isNaN(semestreId)) {
      return NextResponse.json(
        { status: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    // Borrado lógico: marcar eliminado
    await prisma.semestre.update({
      where: { id: semestreId },
      data: {
        eliminado: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      status: true,
      message: "Semestre eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar semestre:", error);
    return NextResponse.json({
      status: false,
      error: "Error al eliminar semestre",
    });
  }
}
