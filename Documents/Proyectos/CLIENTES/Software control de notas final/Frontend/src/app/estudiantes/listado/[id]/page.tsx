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
      <div className="p-8 space-y-8 min-h-screen bg-gray-50 dark:bg-gray-900 black:bg-black transition-colors duration-300">
        <div className="flex items-center justify-between max-w-6xl mx-auto w-full">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-800 black:bg-zinc-900 text-gray-700 dark:text-gray-200 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 black:border-zinc-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition font-bold"
          >
            <ArrowLeft size={18} />
            Volver
          </button>
          
          <button
            onClick={exportarPDF}
            className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 dark:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-700 dark:hover:bg-rose-600 transition font-bold"
          >
            <FileText size={18} />
            Exportar PDF
          </button>
        </div>

        {/* FICHA DEL ESTUDIANTE - Premium Card */}
        <div
          id="ficha-estudiante"
          className="bg-white dark:bg-gray-900 black:bg-black text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-800 black:border-zinc-900 rounded-3xl shadow-xl w-full max-w-6xl mx-auto p-10 flex flex-col gap-10 transition-colors duration-300"
        >
          {/* ===== ENCABEZADO PRINCIPAL ===== */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/40 dark:to-gray-800/20 black:from-zinc-900 black:to-zinc-950 rounded-3xl p-8 border border-gray-200/60 dark:border-gray-700/50 black:border-zinc-800 shadow-inner">
            {/* Nombre */}
            <div className="mb-8">
              <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                {estudiante.nombre}
              </h1>
              <div className="h-1.5 w-24 bg-teal-500 rounded-full mt-4" />
            </div>

            {/* Datos en Grilla */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[
                { label: "CI", value: estudiante.ci },
                { label: "Registro", value: estudiante.registro },
                { label: "Email", value: estudiante.email, fullWidth: true },
                { label: "Asistencia", value: `${estudiante.porcentajeAsistencia}%`, isProgress: true }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className={`bg-white dark:bg-gray-800 black:bg-zinc-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 black:border-zinc-800/50 shadow-sm hover:shadow-md transition-all duration-300 group ${item.fullWidth ? 'md:col-span-2' : ''}`}
                >
                  <p className="text-xs uppercase font-black tracking-widest text-gray-400 dark:text-gray-500 mb-2 group-hover:text-teal-500 transition-colors">
                    {item.label}
                  </p>
                  {item.isProgress ? (
                    <div className="space-y-3">
                      <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">
                        {item.value}
                      </p>
                      <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 black:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            Number(estudiante.porcentajeAsistencia) >= 75
                              ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                              : Number(estudiante.porcentajeAsistencia) >= 50
                              ? "bg-amber-500"
                              : "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                          }`}
                          style={{ width: `${estudiante.porcentajeAsistencia}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className={`text-xl font-bold text-gray-800 dark:text-gray-200 truncate ${item.label === 'Email' ? 'normal-case' : ''}`}>
                      {item.value || "---"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ===== SECCIÓN DE COMPETENCIAS ===== */}
          <div className="grid grid-cols-1 gap-10">
            <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tighter flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center">
                <FileText size={20} />
              </span>
              Progreso por Competencias
            </h2>
            
            <div className="space-y-8">
              {promediosOrdenados.map((comp, i) => {
                const nota = comp.promedioCompetencia ?? 0;
                const statusColor =
                  nota >= 51
                    ? "text-emerald-500 bg-emerald-500"
                    : nota >= 40
                    ? "text-amber-500 bg-amber-500"
                    : "text-rose-500 bg-rose-500";

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-gray-50 dark:bg-gray-800/30 black:bg-zinc-900/40 rounded-3xl border border-gray-100 dark:border-gray-700/50 black:border-zinc-800 p-8 hover:bg-white dark:hover:bg-gray-800 transition-all duration-500 group"
                  >
                    {/* Header Competencia */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-500">
                          Competencia {i + 1}
                        </span>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white">
                          {comp.competenciaNombre}
                        </h3>
                      </div>

                      <div className="flex items-center gap-4 bg-white dark:bg-gray-800 black:bg-zinc-900 px-6 py-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 black:border-zinc-800">
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Nota</span>
                        <span className={`text-4xl font-black ${statusColor.split(' ')[0]}`}>
                          {nota}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Large */}
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 black:bg-zinc-800 rounded-2xl overflow-hidden mb-12 shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${nota}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`h-full rounded-2xl ${statusColor.split(' ')[1]}`}
                      />
                    </div>

                    {/* Grilla de Criterios */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {comp.criterios.map((crit: any, j: number) => {
                        const notaCrit = crit.promedioCriterio ?? 0;
                        return (
                          <div
                            key={j}
                            className="bg-white dark:bg-gray-900/50 black:bg-black/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 black:border-zinc-900 group-hover:border-teal-500/30 transition-all"
                          >
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-bold text-gray-800 dark:text-gray-200 overflow-hidden text-ellipsis">
                                {crit.criterioNombre}
                              </h4>
                              <span className="text-lg font-black text-teal-500">{notaCrit}</span>
                            </div>

                            <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 black:bg-zinc-900 rounded-full mb-6 overflow-hidden">
                              <div
                                className="h-full bg-teal-500 rounded-full transition-all duration-1000"
                                style={{ width: `${notaCrit}%` }}
                              />
                            </div>

                            <div className="space-y-2">
                              {crit.evidencias.length > 0 ? (
                                crit.evidencias.map((ev: any, k: number) => (
                                  <div
                                    key={k}
                                    className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 black:bg-zinc-900/30 px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 black:border-zinc-800 text-sm hover:border-teal-500 transition-colors"
                                  >
                                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                                      {ev.evidenciaNombre}
                                    </span>
                                    <span className="font-black text-gray-900 dark:text-white">
                                      {ev.promedio}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs italic text-gray-400 dark:text-gray-600 text-center py-2">
                                  No hay evidencias registradas
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
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default DatosEstudiante;
