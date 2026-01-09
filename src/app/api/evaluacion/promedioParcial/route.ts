import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const {
      estudianteId,
      asignaturaId,
      tipo, // "evidencia" | "criterio" | "competencia" | "final" | "segundoTurno"
      promedio,
      competenciaId,
      criterioId,
      evidenciaId,
    } = await req.json();

    // Validación básica
    if (!estudianteId || !asignaturaId || !tipo || promedio === undefined) {
      return NextResponse.json(
        { status: false, message: "Faltan datos obligatorios." },
        { status: 400 }
      );
    }

    const promedioNum = Number(promedio);
    if (isNaN(promedioNum)) {
      return NextResponse.json(
        { status: false, message: "El promedio debe ser un número válido." },
        { status: 400 }
      );
    }

    // Buscar si ya existe un registro de promedio similar
    const promedioExistente = await prisma.promedioparcial.findFirst({
      where: {
        estudianteId: Number(estudianteId),
        asignaturaId: Number(asignaturaId),
        tipo: tipo,
        competenciaId: competenciaId ? Number(competenciaId) : null,
        criterioId: criterioId ? Number(criterioId) : null,
        evidenciaId: evidenciaId ? Number(evidenciaId) : null,
      },
    });

    if (promedioExistente) {
      const actualizado = await prisma.promedioparcial.update({
        where: { id: promedioExistente.id },
        data: {
          promedio: promedioNum,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        status: true,
        message: "Promedio actualizado correctamente.",
        data: actualizado,
      });
    } else {
      const creado = await prisma.promedioparcial.create({
        data: {
          estudianteId: Number(estudianteId),
          asignaturaId: Number(asignaturaId),
          tipo,
          promedio: promedioNum,
          competenciaId: competenciaId ? Number(competenciaId) : null,
          criterioId: criterioId ? Number(criterioId) : null,
          evidenciaId: evidenciaId ? Number(evidenciaId) : null,
        },
      });

      return NextResponse.json({
        status: true,
        message: "Promedio creado correctamente.",
        data: creado,
      });
    }
  } catch (error: any) {
    console.error("Error al guardar promedio:", error);
    return NextResponse.json(
      {
        status: false,
        message: "Error al guardar el promedio.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

//Para obtener
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const asignaturaId = url.searchParams.get("asignaturaId");

    if (!asignaturaId) {
      return NextResponse.json(
        { status: false, message: "Falta el parámetro asignaturaId." },
        { status: 400 }
      );
    }

    const promedios = await prisma.promedioparcial.findMany({
      where: {
        asignaturaId: Number(asignaturaId),
        eliminado: false,
      },
      include: {
        estudiante: true,
        competencia: true,
        criterio: true,
        evidencia: true,
      },
    });

    return NextResponse.json({ status: true, promedios });
  } catch (error: any) {
    console.error("Error al obtener promedios:", error);
    return NextResponse.json(
      {
        status: false,
        message: "Error al obtener promedios.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
