import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Obtener asistencias de una asignatura
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const asignaturaId = Number(searchParams.get("asignaturaId"));

    if (!asignaturaId)
      return NextResponse.json({
        status: false,
        message: "Falta asignaturaId",
      });

    // Traer estudiantes con sus asistencias
    const estudiantes = await prisma.estudiante.findMany({
      where: { asignaturaId, eliminado: false },
      include: { asistencia: true },
    });

    return NextResponse.json({ status: true, estudiantes });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { status: false, message: "Error al obtener asistencias" },
      { status: 500 }
    );
  }
}

// Registrar/actualizar asistencias
export async function POST(req: Request) {
  try {
    const { estudianteId, claseId, presente } = await req.json();

    if (!estudianteId || !claseId || presente === undefined) {
      return NextResponse.json(
        { status: false, message: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    // 1️⃣ Guardar o actualizar la asistencia del estudiante
    const asistencia = await prisma.asistencia.upsert({
      where: { estudianteId_claseId: { estudianteId, claseId } },
      update: { presente, updatedAt: new Date() },
      create: { estudianteId, claseId, presente, fecha: new Date() },
    });

    // 2️⃣ Obtener la asignatura del estudiante
    const estudiante = await prisma.estudiante.findUnique({
      where: { id: estudianteId },
      select: { asignaturaId: true },
    });

    if (!estudiante) {
      return NextResponse.json({
        status: false,
        message: "Estudiante no encontrado",
      });
    }

    // 3️⃣ Traer todas las clases de esa asignatura (activas)
    const clases = await prisma.clase.findMany({
      where: { asignaturaId: estudiante.asignaturaId, eliminado: false },
      select: { id: true },
    });

    const totalClases = clases.length;

    // 4️⃣ Contar cuántas clases tiene el estudiante como presente
    let presentes = 0;
    for (const clase of clases) {
      const a = await prisma.asistencia.findFirst({
        where: { estudianteId, claseId: clase.id, eliminado: false },
      });
      if (a?.presente) presentes++;
    }

    // 5️⃣ Calcular porcentaje
    const porcentaje =
      totalClases > 0
        ? Number(((presentes / totalClases) * 100).toFixed(2))
        : 0;

    // 6️⃣ Actualizar el porcentaje en el estudiante
    await prisma.estudiante.update({
      where: { id: estudianteId },
      data: { porcentajeAsistencia: porcentaje, updatedAt: new Date() },
    });

    // 7️⃣ Retornar resultado
    return NextResponse.json({
      status: true,
      message: "Asistencia y porcentaje actualizados correctamente",
      asistencia,
      porcentaje,
    });
  } catch (error: any) {
    console.error("Error al actualizar asistencia:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al actualizar asistencia" },
      { status: 500 }
    );
  }
}
