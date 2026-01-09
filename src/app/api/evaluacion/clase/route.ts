import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

//Para crear la clase
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fecha, asignaturaId } = body;

    if (!fecha || !asignaturaId) {
      return NextResponse.json(
        { status: false, error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    //Convierte la fecha
    const parsedDate = new Date(fecha);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { status: false, error: "Formato de fecha inválido" },
        { status: 400 }
      );
    }

    const nuevaClase = await prisma.clase.create({
      data: {
        fecha: new Date(fecha),
        asignatura: {
          connect: { id: asignaturaId },
        },
      },
    });

    return NextResponse.json({ status: true, nuevaClase });
  } catch (error) {
    console.error("Error al crear la fecha:", error);
    return NextResponse.json(
      { status: false, error: "Error al crear la fecha" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

//Para obtener las clases
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

    const clases = await prisma.clase.findMany({
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
      clases,
    });
  } catch (error: any) {
    console.error("Error al obtener los estudientes:", error.message);
    return NextResponse.json(
      { status: false, message: "Error al obtener los estudientes.", error },
      { status: 500 }
    );
  }
}
