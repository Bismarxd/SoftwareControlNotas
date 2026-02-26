import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // 👈 CLAVE
    const semestreId = Number(id);

    if (isNaN(semestreId)) {
      return NextResponse.json(
        { status: false, error: "ID de semestre inválido" },
        { status: 400 }
      );
    }

    const asignaturaSeleccionada = await prisma.asignatura.findFirst({
      where: {
        semestreId,
        seleccionado: true,
        eliminado: false,
      },
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
      },
    });

    if (!asignaturaSeleccionada) {
      return NextResponse.json({
        status: false,
        message: "No hay ninguna asignatura seleccionada en este semestre.",
      });
    }

    return NextResponse.json({
      status: true,
      asignaturaSeleccionada,
      message:
        "Asignatura seleccionada encontrada. Solo una puede estar marcada como seleccionada por semestre.",
    });
  } catch (error) {
    console.error("Error al obtener asignatura seleccionada:", error);
    return NextResponse.json(
      { status: false, error: "Error al obtener asignatura seleccionada" },
      { status: 500 }
    );
  }
}
