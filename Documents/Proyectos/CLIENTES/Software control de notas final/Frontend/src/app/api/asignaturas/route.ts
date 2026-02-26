import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";


// Ruta para crear una nueva asignatura
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      semestreId,
      nombre,
      sigla,
      nivel,
      prerequisito,
      area,
      hp,
      hc,
      haa,
      hip,
      he,
      creditos,
      justificacion,
    } = body;

    // Validar los campos que son obligatorios
    if (!nombre || !sigla || !nivel || !prerequisito || !area) {
      return NextResponse.json({
        message:
          "Faltan datos requeridos: nombre, sigla, nivel, prerequisito o área",
        status: false,
      });
    }

    const nuevaAsignatura = await prisma.asignatura.create({
      data: {
        semestreId: semestreId || 0,
        nombre,
        sigla,
        nivel,
        prerequisito,
        area,
        hp: Number(hp) || 0,
        hc: Number(hc) || 0,
        haa: Number(haa) || 0,
        hip: Number(hip) || 0,
        he: Number(he) || 0,
        creditos: Number(creditos) || 0,
        justificacion: justificacion || "",
      },
    });

    return NextResponse.json({ nuevaAsignatura, status: true });
  } catch (error) {
    console.error("Error al crear la asignatura:", error);
    return NextResponse.json({
      message: "Error al crear la asignatura",
      status: false,
    });
  }
}
