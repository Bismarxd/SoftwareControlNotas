import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

//Ruta para crear la evidencia
export async function POST(req: Request) {
  try {
    const { tipo, nombre, criterioId } = await req.json();

    if (!tipo || !nombre || !criterioId) {
      return NextResponse.json(
        { status: false, message: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    const nuevaEvidencia = await prisma.evidencia.create({
      data: {
        criterioId,
        tipo,
        nombre,
      },
    });

    return NextResponse.json({
      status: true,
      message: "Evidencia agregada correctamente.",
      evidencia: nuevaEvidencia,
    });
  } catch (error: any) {
    console.error("Error al agregar la evidencia:", error.message);
    console.error(error);
    return NextResponse.json(
      { status: false, message: "Error al agregar la evidencia." },
      { status: 500 }
    );
  }
}
