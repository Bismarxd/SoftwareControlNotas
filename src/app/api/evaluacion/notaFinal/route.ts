import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { estudianteId, notaFinal, notaSegundoTurno } = await req.json();

    // Validación básica
    if (!estudianteId || notaFinal === undefined || notaFinal === null) {
      return NextResponse.json(
        { status: false, message: "Faltan datos obligatorios." },
        { status: 400 }
      );
    }

    const puntajeNum = Number(notaFinal);
    const segundoTurnoNum =
      notaSegundoTurno !== undefined ? Number(notaSegundoTurno) : null;

    if (
      isNaN(puntajeNum) ||
      (segundoTurnoNum !== null && isNaN(segundoTurnoNum))
    ) {
      return NextResponse.json(
        { status: false, message: "El puntaje debe ser un número válido." },
        { status: 400 }
      );
    }

    // Buscar nota existente
    const notaExistente = await prisma.calificacionfinal.findFirst({
      where: { estudianteId: Number(estudianteId) },
    });

    if (notaExistente) {
      // Actualizar nota
      const notaActualizada = await prisma.calificacionfinal.update({
        where: { id: notaExistente.id },
        data: {
          notaFinal: puntajeNum,
          notaSegundoTurno: segundoTurnoNum ?? notaExistente.notaSegundoTurno, // actualizar solo si se envía
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        status: true,
        message: "Nota actualizada correctamente",
        nota: notaActualizada,
      });
    } else {
      // Crear nueva nota
      const nuevaNota = await prisma.calificacionfinal.create({
        data: {
          estudianteId: Number(estudianteId),
          notaFinal: puntajeNum,
          notaSegundoTurno: segundoTurnoNum ?? undefined,
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
