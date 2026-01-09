import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Ruta para crear el estudiante
export async function POST(req: Request) {
  try {
    const { nombre, ci, asignaturaId, email, registro, celular } =
      await req.json();

    // Validar campos obligatorios
    if (
      !nombre ||
      !ci ||
      !asignaturaId ||
      registro === undefined ||
      registro === null
    ) {
      return NextResponse.json(
        { status: false, message: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    // Validar que el registro sea un número
    if (isNaN(Number(registro))) {
      return NextResponse.json(
        { status: false, message: "El registro debe ser un número válido." },
        { status: 400 }
      );
    }

    // Crear el estudiante
    const nuevoEstudiante = await prisma.estudiante.create({
      data: {
        nombre: nombre.trim(),
        ci: String(ci).trim(),
        asignaturaId: Number(asignaturaId),
        registro: Number(registro),
        email: email && email.trim() !== "" ? email.trim() : "-",
        celular: Number(celular),
      },
    });

    return NextResponse.json({
      status: true,
      message: "Estudiante agregado correctamente.",
      estudiante: nuevoEstudiante,
    });
  } catch (error: any) {
    console.error("Error al agregar el estudiante:", error);
    return NextResponse.json(
      { status: false, message: "Error al agregar el estudiante." },
      { status: 500 }
    );
  }
}

// Ruta para Obtener los estudiantes por la materiaId
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

    const estudiantes = await prisma.estudiante.findMany({
      where: {
        asignaturaId: Number(asignaturaId),
        eliminado: false,
      },
      include: { asistencia: true, notaactividad: true },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      status: true,
      estudiantes,
    });
  } catch (error: any) {
    console.error("Error al obtener los estudientes:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al obtener los estudientes.", error },
      { status: 500 }
    );
  }
}

// Ruta para editar un estudiante
export async function PUT(req: Request) {
  try {
    const { id, nombre, ci, email, registro, celular } = await req.json();

    if (!id || !nombre || !ci) {
      return NextResponse.json(
        { status: false, message: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    // Verificar si el objetivo existe
    const estudianteExistente = await prisma.estudiante.findUnique({
      where: { id: Number(id) },
    });

    if (!estudianteExistente) {
      return NextResponse.json(
        { status: false, message: "El estudiante no existe." },
        { status: 404 }
      );
    }

    // Actualizar los datos
    const estudianteActualizado = await prisma.estudiante.update({
      where: { id: Number(id) },
      data: {
        nombre,
        ci: String(ci),
        email: email && email.trim() !== "" ? email.trim() : "-",
        registro: Number(registro),
        celular: Number(celular),
      },
    });

    return NextResponse.json({
      status: true,
      message: "estudiante actualizado correctamente.",
      estudiante: estudianteActualizado,
    });
  } catch (error: any) {
    console.error("Error al actualizar estudiante:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al actualizar el estudiante." },
      { status: 500 }
    );
  }
}
