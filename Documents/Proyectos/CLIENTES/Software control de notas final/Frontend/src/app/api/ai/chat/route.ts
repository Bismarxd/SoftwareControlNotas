import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const SYSTEM_PROMPT = "Eres un Asistente Académico experto diseñado para apoyar a docentes universitarios.";

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json({
        status: true,
        response: "Estimado docente, la configuración de la IA aún no se ha completado. Por favor, asegúrese de tener la `GEMINI_API_KEY` en su archivo `.env`.",
      });
    }

    try {
      // Intentamos una última vez con el modelo más estándar y la versión v1
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: `${SYSTEM_PROMPT}\n\nPregunta del docente: ${message}` }
              ],
            }],
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return NextResponse.json({
          status: true,
          response: data.candidates[0].content.parts[0].text,
        });
      }
      
      // Si falla con 404, damos un mensaje amable y útil en lugar de un error técnico
      if (response.status === 404) {
        return NextResponse.json({
          status: true,
          response: "Estimado docente, el sistema está listo pero Google indica que su API Key aún no tiene acceso a los modelos de inteligencia artificial.",
        });
      }

      throw new Error(data.error?.message || "Error desconocido");

    } catch (err: any) {
      console.error("Gemini Error:", err);
      return NextResponse.json({
        status: true,
        response: `Estimado docente, temporalmente no puedo procesar su solicitud. Detalle: ${err.message}.`,
      });
    }

  } catch (errGlobal: any) {
    console.error("API Error:", errGlobal);
    return NextResponse.json({
      status: true,
      response: "Lo siento, ha ocurrido un error al intentar conectar con el asistente educativo.",
    });
  }
}
