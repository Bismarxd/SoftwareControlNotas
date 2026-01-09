import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

//Ruta para crear el criterio de evaluacion
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { descripcion, nombre, competenciaId, porcentaje } = body;

    // Solo lo realmente obligatorio
    if (!descripcion || !nombre || competenciaId === undefined) {
      return NextResponse.json(
        { status: false, message: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    const nuevaCriterio = await prisma.criterioevaluacion.create({
      data: {
        descripcion,
        nombre,
        competenciaId,
        porcentaje: porcentaje ?? 0, // 👈 DEFAULT AQUÍ
      },
    });

    return NextResponse.json({
      status: true,
      message: "Criterio agregado correctamente.",
      criterio: nuevaCriterio,
    });
  } catch (error: any) {
    console.error("Error al agregar el criterio:", error);
    return NextResponse.json(
      { status: false, message: "Error al agregar el criterio." },
      { status: 500 }
    );
  }
}

// Ruta para editar un criterio
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, descripcion, nombre, porcentaje } = body;

    if (id === undefined || !descripcion || !nombre) {
      return NextResponse.json(
        { status: false, message: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    const criterioExistente = await prisma.criterioevaluacion.findUnique({
      where: { id: Number(id) },
    });

    if (!criterioExistente) {
      return NextResponse.json(
        { status: false, message: "El Criterio no existe." },
        { status: 404 }
      );
    }

    const criterioActualizado = await prisma.criterioevaluacion.update({
      where: { id: Number(id) },
      data: {
        descripcion,
        nombre,
        porcentaje: porcentaje ?? 0, // 👈 DEFAULT AQUÍ TAMBIÉN
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      status: true,
      message: "Criterio actualizado correctamente.",
      competencia: criterioActualizado,
    });
  } catch (error: any) {
    console.error("Error al actualizar el Criterio:", error);
    return NextResponse.json(
      { status: false, message: "Error al actualizar el Criterio." },
      { status: 500 }
    );
  }
}
