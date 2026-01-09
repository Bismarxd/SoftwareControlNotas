import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

//Ruta para crear los recursos
export async function POST(req: Request) {
  try {
    const { descripcion, tipo, asignaturaId } = await req.json();

    if (!descripcion || !tipo || !asignaturaId) {
      return NextResponse.json(
        { status: false, message: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    const nuevoRecurso = await prisma.recursos.create({
      data: {
        descripcion,
        tipo,
        asignaturaId,
      },
    });

    return NextResponse.json({
      status: true,
      message: "Recurso agregado correctamente.",
      recurso: nuevoRecurso,
    });
  } catch (error: any) {
    console.error("Error al agregar los recursos:", error.message);
    console.error(error);
    return NextResponse.json(
      { status: false, message: "Error al agregar el recurso." },
      { status: 500 }
    );
  }
}

// Ruta para Obtener los recursos por asignaturaId
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

    const recursos = await prisma.recursos.findMany({
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
      recursos,
    });
  } catch (error: any) {
    console.error("Error al obtener los recursos:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al obtener los recursos.", error },
      { status: 500 }
    );
  }
}

// Ruta para editar un recurso
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
    const recursoExistente = await prisma.recursos.findUnique({
      where: { id: Number(id) },
    });

    if (!recursoExistente) {
      return NextResponse.json(
        { status: false, message: "La estrategia no existe." },
        { status: 404 }
      );
    }

    // Actualizar los datos
    const recursoActualizada = await prisma.recursos.update({
      where: { id: Number(id) },
      data: {
        descripcion,
        tipo,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      status: true,
      message: "Recurso actualizado correctamente.",
      recurso: recursoActualizada,
    });
  } catch (error: any) {
    console.error("Error al actualizar el Recurso:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al actualizar el Recurso." },
      { status: 500 }
    );
  }
}
