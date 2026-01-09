import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { estudianteId, actividadId, puntaje } = await req.json();

    if (
      !estudianteId ||
      !actividadId ||
      puntaje === undefined ||
      puntaje === null
    ) {
      return NextResponse.json(
        { status: false, message: "Faltan datos obligatorios." },
        { status: 400 }
      );
    }

    const puntajeNum = Number(puntaje);
    if (isNaN(puntajeNum)) {
      return NextResponse.json(
        { status: false, message: "El puntaje debe ser un número válido." },
        { status: 400 }
      );
    }

    const notaExistente = await prisma.notaactividad.findFirst({
      where: {
        estudianteId: Number(estudianteId),
        actividadId: Number(actividadId),
      },
    });

    if (notaExistente) {
      const notaActualizada = await prisma.notaactividad.update({
        where: { id: notaExistente.id },
        data: { puntaje: puntajeNum, updatedAt: new Date() },
      });
      return NextResponse.json({
        status: true,
        message: "Nota actualizada correctamente",
        nota: notaActualizada,
      });
    } else {
      const nuevaNota = await prisma.notaactividad.create({
        data: {
          estudianteId: Number(estudianteId),
          actividadId: Number(actividadId),
          puntaje: puntajeNum,
        },
      });
      return NextResponse.json({
        status: true,
        message: "Nota creada correctamente",
        nota: nuevaNota,
      });
    }
  } catch (error: any) {
    console.error("Error al registrar la nota:", error);
    return NextResponse.json(
      {
        status: false,
        message: "Error al registrar la nota.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
