import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Ruta para obtener las materias por el semestre
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const semestreId = Number(params.id);

    if (isNaN(semestreId)) {
      return NextResponse.json({
        message: "ID de semestre inválido",
        status: false,
      });
    }

    const asignaturas = await prisma.asignatura.findMany({
      where: { semestreId, eliminado: false },
      include: {
        competencia: {
          include: {
            criterioevaluacion: {
              include: {
                evidencia: true,
              },
            },
          },
        },
        estudiante: {
          include: {
            promedioparcial: true,
          },
        },
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({ asignaturas, status: true });
  } catch (error) {
    console.error("Error al obtener asignaturas:", error);
    return NextResponse.json({
      error,
      message: "Error al obtener asignaturas",
      status: false,
    });
  }
}

// Ruta para editar una asignatura específica
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const asignaturaId = Number(params.id);
    if (isNaN(asignaturaId)) {
      return NextResponse.json(
        { status: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      nombre,
      sigla,
      nivel,
      prerequisito,
      area,
      hp,
      hc,
      haa,
      hip,
      he,
      creditos,
      justificacion,
    } = body;

    const updateData: any = {};
    if (nombre) updateData.nombre = nombre;
    if (sigla) updateData.sigla = sigla;
    if (nivel) updateData.nivel = nivel;
    if (prerequisito) updateData.prerequisito = prerequisito;
    if (area) updateData.area = area;
    if (hp !== undefined) updateData.hp = Number(hp);
    if (hc !== undefined) updateData.hc = Number(hc);
    if (haa !== undefined) updateData.haa = Number(haa);
    if (hip !== undefined) updateData.hip = Number(hip);
    if (he !== undefined) updateData.he = Number(he);
    if (creditos !== undefined) updateData.creditos = Number(creditos);
    if (justificacion) updateData.justificacion = justificacion;

    const asignaturaActualizada = await prisma.asignatura.update({
      where: { id: asignaturaId },
      include: {
        estudiante: true,
        competencia: {
          include: {
            criterioevaluacion: true,
          },
        },
      },
      data: updateData,
    });

    return NextResponse.json({ status: true, asignaturaActualizada });
  } catch (error) {
    console.error("Error al actualizar asignatura:", error);
    return NextResponse.json({
      status: false,
      error: "Error al actualizar asignatura",
    });
  }
}

// Para eliminar la asignatura (borrado lógico)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const asignaturaId = Number(params.id);

    if (isNaN(asignaturaId)) {
      return NextResponse.json({ status: false, error: "ID inválido" });
    }

    // Borrado lógico: marcar eliminado
    await prisma.asignatura.update({
      where: { id: asignaturaId },
      data: {
        eliminado: true,
        deletedAt: new Date(),
        seleccionado: false,
      },
    });

    return NextResponse.json({
      status: true,
      message: "Asignatura eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar la asignatura:", error);
    return NextResponse.json({
      status: false,
      error: "Error al eliminar la asignatura",
    });
  }
}
