import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


// Ruta para crear un nuevo semestre
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { usuarioId, nombre, fechaInicio, fechaFin, estado, seleccionado } =
      body;

    if (!usuarioId || !nombre || !fechaInicio || !fechaFin) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    // Si el semestre que se crea será "Activo"
    if (estado === "Activo") {
      await prisma.semestre.updateMany({
        where: {
          usuarioId,
          estado: true,
        },
        data: {
          estado: false,
        },
      });
    }

    if (estado === "Si") {
      await prisma.semestre.updateMany({
        where: {
          usuarioId,
          seleccionado: true,
        },
        data: {
          seleccionado: false,
        },
      });
    }

    const nuevoSemestre = await prisma.semestre.create({
      data: {
        usuarioId,
        nombre,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        estado: estado === "Activo" ? true : false,
        seleccionado: seleccionado === "Si" ? true : false,
        eliminado: false,
      },
    });

    return NextResponse.json({ nuevoSemestre, status: true });
  } catch (error) {
    console.error("Error al crear el semestre:", error);
    return NextResponse.json({
      error: "Error al crear el semestre",
      status: false,
    });
  }
}

//Ruta para obtener los semestres
export async function GET() {
  try {
    const semestres = await prisma.semestre.findMany({
      where: {
        eliminado: false,
      },
      orderBy: {
        fechaInicio: "desc",
      },
    });

    return NextResponse.json({ semestres, status: true });
  } catch (error) {
    console.error("Error al obtener semestres:", error);
    return NextResponse.json({
      error: "Error al obtener los semestres",
      status: false,
    });
  }
}
