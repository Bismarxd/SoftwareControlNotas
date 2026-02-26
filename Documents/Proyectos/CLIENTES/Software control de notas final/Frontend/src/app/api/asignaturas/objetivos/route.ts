import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


//Ruta para crear el objetivo
export async function POST(req: Request) {
  try {
    const { descripcion, tipo, asignaturaId } = await req.json();

    if (!descripcion || !tipo || !asignaturaId) {
      return NextResponse.json(
        { status: false, message: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    const nuevoObjetivo = await prisma.objetivos.create({
      data: {
        descripcion,
        tipo,
        asignaturaId: Number(asignaturaId),
      },
    });

    return NextResponse.json({
      status: true,
      message: "Objetivo agregado correctamente.",
      objetivo: nuevoObjetivo,
    });
  } catch (error: any) {
    console.error("Error al agregar objetivo:", error.message);
    console.error(error);
    return NextResponse.json(
      { status: false, message: "Error al agregar el objetivo." },
      { status: 500 }
    );
  }
}

// Ruta para Obtener los objetivos
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

    const objetivos = await prisma.objetivos.findMany({
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
      objetivos,
    });
  } catch (error: any) {
    console.error("Error al obtener objetivos:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al obtener los objetivos.", error },
      { status: 500 }
    );
  }
}

// Ruta para editar un objetivo
export async function PUT(req: Request) {
  try {
    const { id, descripcion, tipo } = await req.json();

    if (!id || !descripcion || !tipo) {
      return NextResponse.json(
        { status: false, message: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    // Verificar si el objetivo existe
    const objetivoExistente = await prisma.objetivos.findUnique({
      where: { id: Number(id) },
    });

    if (!objetivoExistente) {
      return NextResponse.json(
        { status: false, message: "El objetivo no existe." },
        { status: 404 }
      );
    }

    // Actualizar los datos
    const objetivoActualizado = await prisma.objetivos.update({
      where: { id: Number(id) },
      data: {
        descripcion,
        tipo,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      status: true,
      message: "Objetivo actualizado correctamente.",
      objetivo: objetivoActualizado,
    });
  } catch (error: any) {
    console.error("Error al actualizar objetivo:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al actualizar el objetivo." },
      { status: 500 }
    );
  }
}
