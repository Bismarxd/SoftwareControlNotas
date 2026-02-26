import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


//Ruta para crear la estrategia
export async function POST(req: Request) {
  try {
    const { descripcion, tipo, asignaturaId } = await req.json();

    if (!descripcion || !tipo || !asignaturaId) {
      return NextResponse.json(
        { status: false, message: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    const nuevoObjetivo = await prisma.estrategia.create({
      data: {
        descripcion,
        tipo,
        asignaturaId,
      },
    });

    return NextResponse.json({
      status: true,
      message: "Estrategia agregada correctamente.",
      estrategia: nuevoObjetivo,
    });
  } catch (error: any) {
    console.error("Error al agregar la estrategia:", error.message);
    console.error(error);
    return NextResponse.json(
      { status: false, message: "Error al agregar la estrategia." },
      { status: 500 }
    );
  }
}

// Ruta para Obtener las estrategias por asignaturaId
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

    const estrategias = await prisma.estrategia.findMany({
      where: {
        asignaturaId: Number(asignaturaId),
        eliminado: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      status: true,
      estrategias,
    });
  } catch (error: any) {
    console.error("Error al obtener las estrategias:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al obtener las estrategias.", error },
      { status: 500 }
    );
  }
}

// Ruta para editar una estrategia
export async function PUT(req: Request) {
  try {
    const { id, descripcion, tipo } = await req.json();

    if (!id || !descripcion || !tipo) {
      return NextResponse.json(
        { status: false, message: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    // Verificar si la estrategia existe
    const objetivoExistente = await prisma.estrategia.findUnique({
      where: { id: Number(id) },
    });

    if (!objetivoExistente) {
      return NextResponse.json(
        { status: false, message: "La estrategia no existe." },
        { status: 404 }
      );
    }

    // Actualizar los datos
    const estrategiaActualizada = await prisma.estrategia.update({
      where: { id: Number(id) },
      data: {
        descripcion,
        tipo,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      status: true,
      message: "Estrategia actualizada correctamente.",
      estrategia: estrategiaActualizada,
    });
  } catch (error: any) {
    console.error("Error al actualizar la estrategia:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al actualizar la estrategia." },
      { status: 500 }
    );
  }
}
