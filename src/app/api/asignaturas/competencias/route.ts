import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


//Ruta para crear la competencia
export async function POST(req: Request) {
  try {
    const { porcentaje, descripcion, tipo, asignaturaId } = await req.json();

    if (!descripcion || !tipo || !asignaturaId || !porcentaje) {
      return NextResponse.json(
        { status: false, message: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    const nuevaCompetencia = await prisma.competencia.create({
      data: {
        descripcion,
        tipo,
        porcentaje,
        asignaturaId,
      },
    });

    return NextResponse.json({
      status: true,
      message: "Competencia agregado correctamente.",
      competencia: nuevaCompetencia,
    });
  } catch (error: any) {
    console.error("Error al agregar la competencia:", error.message);
    console.error(error);
    return NextResponse.json(
      { status: false, message: "Error al agregar la competencia." },
      { status: 500 }
    );
  }
}

// Ruta para Obtener las competencias
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const asignaturaId = searchParams.get("asignaturaId");

    if (!asignaturaId) {
      return NextResponse.json(
        { status: false, message: "El ID de la asignatura es obligatorio." },
        { status: 400 }
      );
    }

    const competencias = await prisma.competencia.findMany({
      where: {
        asignaturaId: Number(asignaturaId),
        eliminado: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        criterioevaluacion: {
          where: { eliminado: false },
          include: {
            evidencia: {
              where: { eliminado: false },
              include: {
                actividad: {
                  where: { eliminado: false },
                  include: {
                    notaactividad: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      status: true,
      competencias,
    });
  } catch (error: any) {
    console.error("Error al obtener las competencias:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al obtener las competencias.", error },
      { status: 500 }
    );
  }
}

// Ruta para editar una competencia
export async function PUT(req: Request) {
  try {
    const { id, descripcion, tipo, porcentaje } = await req.json();

    if (!id || !descripcion || !tipo || !porcentaje) {
      return NextResponse.json(
        { status: false, message: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    // Verificar si la competencia existe
    const comptenciaExistente = await prisma.competencia.findUnique({
      where: { id: Number(id) },
    });

    if (!comptenciaExistente) {
      return NextResponse.json(
        { status: false, message: "La Comptencia no existe." },
        { status: 404 }
      );
    }

    // Actualizar los datos
    const competenciaActualizada = await prisma.competencia.update({
      where: { id: Number(id) },
      data: {
        descripcion,
        tipo,
        porcentaje,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      status: true,
      message: "Objetivo actualizado correctamente.",
      competencia: competenciaActualizada,
    });
  } catch (error: any) {
    console.error("Error al actualizar objetivo:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al actualizar el objetivo." },
      { status: 500 }
    );
  }
}
