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

    const estudianteEliminado = await prisma.estudiante.update({
      where: { id },
      data: {
        eliminado: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      status: true,
      message: "Estudiante eliminado correctamente.",
      recurso: estudianteEliminado,
    });
  } catch (error: any) {
    console.error("Error al eliminar el estudiante:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al eliminar el estudiante." },
      { status: 500 }
    );
  }
}

// Obtener estudiante por ID
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);
    const estudiante = await prisma.estudiante.findUnique({
      where: { id },
      include: {
        notaactividad: {
          include: {
            actividad: true,
          },
        },

        promedioparcial: {
          where: {
            estudianteId: id,
          },
          include: {
            competencia: true,
            criterio: true,
            evidencia: {
              include: {
                actividad: true,
              },
            },
          },
        },
      },
    });

    if (!estudiante) {
      return NextResponse.json(
        { status: false, message: "Estudiante no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: true,
      estudiante,
    });
  } catch (error: any) {
    console.error("Error al obtener estudiante:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al obtener el estudiante." },
      { status: 500 }
    );
  }
}

//Para actualizar la asistencia
export async function POST(req: Request) {
  try {
    const { estudianteId, claseId, presente } = await req.json();

    if (!estudianteId || !claseId) {
      return NextResponse.json(
        { status: false, message: "Faltan datos obligatorios." },
        { status: 400 }
      );
    }

    // Guardar o actualizar la asistencia
    const asistencia = await prisma.asistencia.upsert({
      where: { estudianteId_claseId: { estudianteId, claseId } },
      update: { presente },
      create: { estudianteId, claseId, presente, fecha: new Date() },
    });

    // Obtener todas las asistencias del estudiante
    const asistenciasTotales = await prisma.asistencia.findMany({
      where: { estudianteId, eliminado: false },
    });

    const total = asistenciasTotales.length;
    const presentes = asistenciasTotales.filter((a) => a.presente).length;
    const porcentaje = total > 0 ? (presentes / total) * 100 : 0;

    // Actualizar el porcentaje en el estudiante
    await prisma.estudiante.update({
      where: { id: estudianteId },
      data: { porcentajeAsistencia: porcentaje },
    });

    return NextResponse.json({
      status: true,
      message: "Asistencia actualizada correctamente.",
      asistencia,
      porcentaje,
    });
  } catch (error: any) {
    console.error("Error al actualizar asistencia:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al actualizar asistencia." },
      { status: 500 }
    );
  }
}
