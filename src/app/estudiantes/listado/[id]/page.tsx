"use client";
import React, { useEffect, useState, useMemo } from "react";
import SidebarLayout from "@/components/Sidebar/SidebarLayout";
import axios from "axios";
import { useParams } from "next/navigation";
import { Estudiante } from "@/types/semestre";
import { ArrowLeft, FileText } from "lucide-react";
import jsPDF from "jspdf";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const DatosEstudiante = () => {
  const router = useRouter();
  const { id } = useParams();
  const [estudiante, setEstudiante] = useState<Estudiante | undefined>();

  useEffect(() => {
    if (!id) return;
    const fetchEstudiante = async () => {
      const res = await axios.get(`/api/estudiantes/listado/${id}`);
      if (res.data.status) setEstudiante(res.data.estudiante);
    };
    fetchEstudiante();
  }, [id]);

  const promediosOrdenados = useMemo(() => {
    if (!estudiante) return [];

    const mapa = new Map();

    estudiante.promedioparcial.forEach((p: any) => {
      if (p.tipo === "final" || !p.competencia) return;
      const compId = p.competencia.id;

      if (!mapa.has(compId)) {
        mapa.set(compId, {
          competenciaNombre: p.competencia.tipo,
          promedioCompetencia: undefined,
          criterios: new Map(),
        });
      }

      const comp = mapa.get(compId);

      if (p.tipo === "competencia") {
        comp.promedioCompetencia = p.promedio;
        return;
      }

      if (!p.criterio) return;
      const critId = p.criterio.id;

      if (!comp.criterios.has(critId)) {
        comp.criterios.set(critId, {
          criterioNombre: p.criterio.nombre,
          promedioCriterio: undefined,
          evidencias: [],
        });
      }

      const crit = comp.criterios.get(critId);

      if (p.tipo === "criterio") {
        crit.promedioCriterio = p.promedio;
        return;
      }

      if (p.tipo === "evidencia" && p.evidencia) {
        crit.evidencias.push({
          evidenciaNombre: p.evidencia.nombre,
          promedio: p.promedio,
        });
      }
    });

    return Array.from(mapa.values()).map((c) => ({
      ...c,
      criterios: Array.from(c.criterios.values()),
    }));
  }, [estudiante]);

  //para exportar en pdf
  const exportarPDF = async () => {
    if (!estudiante) return;

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginX = 15;
    let cursorY = 15;

    const addText = (
      text: string,
      fontSize = 12,
      bold = false,
      color = "#000000"
    ) => {
      pdf.setFontSize(fontSize);
      pdf.setFont(bold ? "bold" : "normal");
      pdf.setTextColor(color);

      const lineHeight = fontSize * 0.5;
      const splitText = pdf.splitTextToSize(text, pageWidth - marginX * 2);

      splitText.forEach((line: any) => {
        if (cursorY + lineHeight > pageHeight - 15) {
          pdf.addPage();
          cursorY = 15;
        }
        pdf.text(line, marginX, cursorY);
        cursorY += lineHeight;
      });
      cursorY += 2;
    };

    const addBar = (
      percent: number,
      width = pageWidth - marginX * 2,
      height = 4,
      color = "#1f2937"
    ) => {
      if (cursorY + height > pageHeight - 15) {
        pdf.addPage();
        cursorY = 15;
      }
      pdf.setFillColor(color);
      pdf.rect(marginX, cursorY, (width * percent) / 100, height, "F");
      pdf.setDrawColor(200);
      pdf.rect(marginX, cursorY, width, height, "S");
      cursorY += height + 5;
    };

    // Datos del estudiante
    addText(`Nombre: ${estudiante.nombre}`, 16, true, "#0f172a");
    addText(`CI: ${estudiante.ci}`);
    addText(`Email: ${estudiante.email}`);
    addText(`Registro: ${estudiante.registro}`);
    addText(`Asistencia: ${estudiante.porcentajeAsistencia}`);
    cursorY += 5;

    // Competencias
    promediosOrdenados.forEach((comp) => {
      addText(`Competencia: ${comp.competenciaNombre}`, 14, true, "#1e40af");
      if (comp.promedioCompetencia != null) {
        addText(`Promedio: ${comp.promedioCompetencia}`, 12, true, "#1f2937");
        addBar(comp.promedioCompetencia, pageWidth - marginX * 2, 6, "#1e40af");
      }
      comp.criterios.forEach((crit: any) => {
        addText(`- Criterio: ${crit.criterioNombre}`, 12, true, "#334155");
        if (crit.promedioCriterio != null) {
          addText(`  Promedio: ${crit.promedioCriterio}`, 12, true, "#0f172a");
          addBar(
            crit.promedioCriterio,
            pageWidth - marginX * 2 - 10,
            4,
            "#334155"
          );
        }
        if (crit.evidencias.length > 0) {
          crit.evidencias.forEach((ev: any) => {
            addText(
              `    • ${ev.evidenciaNombre}: ${ev.promedio}`,
              11,
              false,
              "#475569"
            );
          });
        } else {
          addText(`    • No hay evidencias`, 11, false, "#94a3b8");
        }
      });
      cursorY += 5; // espacio entre competencias
    });

    pdf.save(`${estudiante.nombre}_ficha.pdf`);
  };

  if (!estudiante) return <SidebarLayout>Cargando...</SidebarLayout>;

  return (
    <SidebarLayout>
      <div className="p-8 space-y-8 flex flex-col items-center">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg shadow-sm transition"
        >
          <ArrowLeft size={18} />
          Volver
        </button>
        {/* FICHA DEL ESTUDIANTE - Tipo Carnet */}
        <div
          id="ficha-estudiante"
          className="bg-white text-gray-800 border border-gray-200 rounded-lg shadow-sm w-full max-w-6xl mx-auto p-8 flex flex-col gap-8"
        >
          {/* ===== ENCABEZADO PRINCIPAL ===== */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-2xl p-6 border border-gray-200 shadow-sm">
            {/* Nombre */}
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                {estudiante.nombre}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Información general del estudiante
              </p>
            </div>

            {/* Datos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* CI */}
              <div className="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition">
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  CI
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  {estudiante.ci}
                </p>
              </div>

              {/* Registro */}
              <div className="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition">
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Registro
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  {estudiante.registro}
                </p>
              </div>

              {/* Email */}
              <div className="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition">
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Email
                </p>
                <p className="text-sm font-medium text-gray-800 break-all">
                  {estudiante.email}
                </p>
              </div>

              {/* Asistencia */}
              <div className="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition">
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Asistencia
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-bold text-gray-900">
                    {estudiante.porcentajeAsistencia}%
                  </p>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full">
                    <div
                      className={`h-2 rounded-full ${
                        Number(estudiante.porcentajeAsistencia) >= 75
                          ? "bg-green-500"
                          : Number(estudiante.porcentajeAsistencia) >= 50
                          ? "bg-yellow-400"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${estudiante.porcentajeAsistencia}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== COMPETENCIAS ===== */}
          <div className="flex flex-col gap-8">
            {promediosOrdenados.map((comp, i) => {
              const nota = comp.promedioCompetencia ?? 0;
              const color =
                nota >= 51
                  ? "from-green-400 to-green-600"
                  : nota >= 40
                  ? "from-yellow-400 to-yellow-500"
                  : "from-red-400 to-red-600";

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="bg-white rounded-2xl border border-gray-200 shadow-md hover:shadow-lg transition p-6"
                >
                  {/* ===== HEADER COMPETENCIA ===== */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {comp.competenciaNombre}
                    </h2>

                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">Nota</span>
                      <span
                        className={`text-xl font-bold text-white px-4 py-1 rounded-full bg-gradient-to-r ${color}`}
                      >
                        {nota}
                      </span>
                    </div>
                  </div>

                  {/* ===== BARRA COMPETENCIA ===== */}
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden mb-8">
                    <div
                      className={`h-4 bg-gradient-to-r ${color}`}
                      style={{ width: `${nota}%` }}
                    />
                  </div>

                  {/* ===== CRITERIOS ===== */}
                  <div className="grid lg:grid-cols-2 gap-8">
                    {comp.criterios.map((crit: any, j: number) => {
                      const notaCrit = crit.promedioCriterio ?? 0;

                      return (
                        <div
                          key={j}
                          className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                        >
                          {/* Header criterio */}
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-gray-800">
                              {crit.criterioNombre}
                            </h3>
                            <span className="text-sm font-bold text-gray-700">
                              Nota {notaCrit}
                            </span>
                          </div>

                          {/* Barra criterio */}
                          <div className="h-2.5 bg-gray-200 rounded-full mb-4">
                            <div
                              className="h-2.5 bg-gray-700 rounded-full"
                              style={{ width: `${notaCrit}%` }}
                            />
                          </div>

                          {/* Evidencias */}
                          <div className="space-y-2">
                            {crit.evidencias.length > 0 ? (
                              crit.evidencias.map((ev: any, k: number) => (
                                <div
                                  key={k}
                                  className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border text-sm"
                                >
                                  <span className="text-gray-600">
                                    {ev.evidenciaNombre}
                                  </span>
                                  <span className="font-semibold text-gray-800">
                                    Nota {ev.promedio}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm italic text-gray-400">
                                No se registraron evidencias
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ===== ACCIONES ===== */}
          <div className="flex justify-end border-t pt-6">
            <button
              onClick={exportarPDF}
              className="flex items-center gap-2 px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
            >
              <FileText size={16} />
              Exportar PDF
            </button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default DatosEstudiante;
