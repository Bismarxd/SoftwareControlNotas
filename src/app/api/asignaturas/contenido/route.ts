import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Ruta para crear contenido
export async function POST(req: Request) {
  try {
    const { titulo, descripcion, tipo, asignaturaId, recurso } =
      await req.json();

    if (!titulo || !descripcion || !tipo || !asignaturaId) {
      return NextResponse.json(
        { status: false, message: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    const nuevoContenido = await prisma.contenido.create({
      data: {
        titulo,
        descripcion,
        tipo,
        asignaturaId,
        recurso,
      },
    });

    return NextResponse.json({
      status: true,
      message: "Contenido agregado correctamente.",
      contenido: nuevoContenido,
    });
  } catch (error: any) {
    console.error("Error al agregar el contenido:", error.message);
    console.error(error);
    return NextResponse.json(
      { status: false, message: "Error al agregar el contenido." },
      { status: 500 }
    );
  }
}

// Ruta para obtener el contenido por asignaturaId
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

    const contenido = await prisma.contenido.findMany({
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
      contenido,
    });
  } catch (error: any) {
    console.error("Error al obtener el contenido:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al obtener el contenido.", error },
      { status: 500 }
    );
  }
}

// Ruta para editar contenido
export async function PUT(req: Request) {
  try {
    const { id, titulo, descripcion, tipo, recurso } = await req.json();

    if (!id || !titulo || !descripcion || !tipo) {
      return NextResponse.json(
        { status: false, message: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    // Verificar si el contenido existe
    const contenidoExistente = await prisma.contenido.findUnique({
      where: { id: Number(id) },
    });

    if (!contenidoExistente) {
      return NextResponse.json(
        { status: false, message: "El contenido no existe." },
        { status: 404 }
      );
    }

    // Actualizar los datos
    const contenidoActualizado = await prisma.contenido.update({
      where: { id: Number(id) },
      data: {
        titulo,
        descripcion,
        tipo,
        recurso,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      status: true,
      message: "Contenido actualizado correctamente.",
      contenido: contenidoActualizado,
    });
  } catch (error: any) {
    console.error("Error al actualizar el contenido:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al actualizar el contenido." },
      { status: 500 }
    );
  }
}
