import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

//Ruta para crear la actividad
export async function POST(req: Request) {
  try {
    const { nombre, fecha, evidenciaId } = await req.json();

    if (!nombre || !fecha || !evidenciaId) {
      return NextResponse.json(
        { status: false, message: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    const nuevaActividad = await prisma.actividad.create({
      data: {
        nombre,
        fecha,
        evidenciaId,
      },
    });

    return NextResponse.json({
      status: true,
      message: "Actividad agregada correctamente.",
      competencia: nuevaActividad,
    });
  } catch (error: any) {
    console.error("Error al agregar la actividad:", error.message);
    console.error(error);
    return NextResponse.json(
      { status: false, message: "Error al agregar la actividad." },
      { status: 500 }
    );
  }
}

//Para editar
export async function PUT(req: Request) {
  try {
    const { id, nombre, fecha, evidenciaId } = await req.json();

    // Validaciones
    if (!id || !nombre || !fecha || !evidenciaId) {
      return NextResponse.json(
        { status: false, message: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    // Actualizar la actividad
    const actividadEditada = await prisma.actividad.update({
      where: { id: Number(id) },
      data: {
        nombre,
        fecha,
        evidenciaId,
      },
    });

    return NextResponse.json({
      status: true,
      message: "Actividad editada correctamente.",
      actividad: actividadEditada,
    });
  } catch (error: any) {
    console.error("Error al editar la actividad:", error.message);
    console.error(error);
    return NextResponse.json(
      { status: false, message: "Error al editar la actividad." },
      { status: 500 }
    );
  }
}
