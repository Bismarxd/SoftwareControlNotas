"use client";

import React, { useEffect, useState } from "react";
import {
  Estudiante,
  Actividad,
  Competencia,
  Criterio,
  Evidencia,
  Asignaturas,
} from "@/types/semestre";
import { Pencil, FileText, FileSpreadsheet } from "lucide-react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

interface NotaActividad {
  estudianteId: number;
  actividadId: number;
  valor: number | null;
  simbolo?: string;
}

interface TablaActividadesProps {
  estudiantesFiltrados: Estudiante[];
  setEstudiantes: React.Dispatch<React.SetStateAction<Estudiante[]>>;
  actividades: Actividad[];
  competencias: any[];
  modoGeneral: "nota" | "simbolo";
  handleEditarActividad: (id: number) => void;
  handleEliminar: (id: number) => void;
}

// ─── Shared cell style helpers ────────────────────────────────────────────────
const cellClass = (editable: boolean, tieneNota: boolean) => {
  if (editable)
    return "border border-gray-200 dark:border-gray-700 px-2 py-1.5 text-center relative bg-white dark:bg-gray-800/60";
  if (tieneNota)
    return "border border-gray-200 dark:border-gray-700 px-2 py-1.5 text-center relative bg-emerald-50 dark:bg-emerald-900/20";
  return "border border-gray-200 dark:border-gray-700 px-2 py-1.5 text-center relative bg-gray-50 dark:bg-gray-800/30";
};

const inputClass =
  "w-14 text-center border border-gray-300 dark:border-gray-600 rounded-lg p-1 text-sm font-semibold bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed";

const selectClass =
  "border border-gray-300 dark:border-gray-600 rounded-lg px-1 py-0.5 text-center text-sm w-16 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed";

const TablaActividades: React.FC<TablaActividadesProps> = ({
  estudiantesFiltrados,
  setEstudiantes,
  actividades,
  competencias,
  modoGeneral,
  handleEditarActividad: _handleEditarActividad,
  handleEliminar: _handleEliminar,
}) => {
  const valorSimboloMap: Record<string, number> = {
    "⭐": 10,
    "▲+": 9,
    "▲": 8,
    "▲-": 7,
    "⚪+": 6,
    "⚪": 5,
    "⚪-": 4,
    "🟩+": 3,
    "🟩": 2,
    "🟩-": 1,
  };

  const [notasActividad, setNotasActividad] = useState<NotaActividad[]>([]);
  const [editableCells, setEditableCells] = useState<Record<string, boolean>>({});
  const [inputNotas, setInputNotas] = useState<Record<string, string>>({});
  const [materia, setMateria] = useState<Asignaturas | null>(null);

  useEffect(() => {
    const materiaJSON = localStorage.getItem("materia");
    if (materiaJSON) setMateria(JSON.parse(materiaJSON));
  }, []);

  useEffect(() => {
    const inicialNotas: NotaActividad[] = [];
    const inicialInputs: Record<string, string> = {};

    setEditableCells((prevEditableCells) => {
      const nuevosEditables: Record<string, boolean> = {};

      estudiantesFiltrados.forEach((est) => {
        actividades
          .filter(
            (a: any): a is { id: number } =>
              a !== undefined && a.id !== undefined
          )
          .forEach((act) => {
            const valor = est.notas?.[act.id] ?? null;
            const key = `${est.id}-${act.id}`;

            inicialNotas.push({ estudianteId: est.id, actividadId: act.id, valor });
            inicialInputs[key] = valor !== null ? String(valor) : "";

            const previa = prevEditableCells?.[key];
            nuevosEditables[key] = previa !== undefined ? previa : valor === null;
          });
      });

      return nuevosEditables;
    });

    setNotasActividad(inicialNotas);
    setInputNotas(inicialInputs);
  }, [estudiantesFiltrados, actividades]);

  const toggleEditable = (estudianteId: number, actividadId: number, valor?: boolean) => {
    const key = `${estudianteId}-${actividadId}`;
    setEditableCells((prev) => ({
      ...prev,
      [key]: valor !== undefined ? valor : !prev[key],
    }));
  };

  const isEditable = (estudianteId: number, actividadId: number) =>
    editableCells[`${estudianteId}-${actividadId}`] ?? false;

  const obtenerNota = (estudianteId: number, actividadId: number) =>
    notasActividad.find(
      (n) => n.estudianteId === estudianteId && n.actividadId === actividadId
    ) || { valor: null, simbolo: "" };

  const obtenerSimbolo = (valor: number) => {
    if (valor >= 10) return "⭐";
    if (valor >= 9)  return "▲+";
    if (valor >= 8)  return "▲";
    if (valor >= 7)  return "▲-";
    if (valor >= 6)  return "⚪+";
    if (valor >= 5)  return "⚪";
    if (valor >= 4)  return "⚪-";
    if (valor >= 3)  return "🟩+";
    if (valor >= 2)  return "🟩";
    if (valor >= 1)  return "🟩-";
    return "";
  };

  const guardarPromedio = async (
    estudianteId: number,
    comps: Competencia[],
    notas: NotaActividad[]
  ) => {
    let sumaCompetenciaFinal = 0;

    for (const comp of comps) {
      let sumaCriterios = 0;
      let cantidadCriterios = 0;

      for (const crit of comp.criterioevaluacion || []) {
        let sumaEvidencias = 0;
        let cantidadEvidencias = 0;

        for (const ev of crit.evidencia || []) {
          let suma = 0;
          let count = 0;

          for (const act of ev.actividad || []) {
            const nota = notas.find(
              (n) => n.estudianteId === estudianteId && n.actividadId === act.id
            )?.valor ?? 0;
            suma += nota;
            count++;
          }

          if (count > 0) {
            const promedioEv = suma / count;
            try {
              await axios.post("/api/evaluacion/promedioParcial", {
                estudianteId, asignaturaId: comp.asignaturaId,
                tipo: "evidencia", promedio: promedioEv,
                competenciaId: comp.id, criterioId: crit.id, evidenciaId: ev.id,
              });
            } catch (e) { console.error("Error guardando promedio de evidencia:", e); }

            sumaEvidencias += promedioEv;
            cantidadEvidencias++;
          }
        }

        if (cantidadEvidencias > 0) {
          const promedioCrit = sumaEvidencias / cantidadEvidencias;
          try {
            await axios.post("/api/evaluacion/promedioParcial", {
              estudianteId, asignaturaId: comp.asignaturaId,
              tipo: "criterio", promedio: promedioCrit,
              competenciaId: comp.id, criterioId: crit.id, evidenciaId: null,
            });
          } catch (e) { console.error("Error guardando promedio de criterio:", e); }

          sumaCriterios += promedioCrit;
          cantidadCriterios++;
        }
      }

      if (cantidadCriterios > 0) {
        const promedioComp = sumaCriterios / cantidadCriterios;
        sumaCompetenciaFinal += promedioComp;
        try {
          await axios.post("/api/evaluacion/promedioParcial", {
            estudianteId, asignaturaId: comp.asignaturaId,
            tipo: "competencia", promedio: promedioComp,
            competenciaId: comp.id, criterioId: null, evidenciaId: null,
          });
        } catch (e) { console.error("Error guardando promedio de competencia:", e); }
      }
    }

    try {
      await axios.post("/api/evaluacion/promedioParcial", {
        estudianteId, asignaturaId: comps[0]?.asignaturaId ?? 0,
        tipo: "final", promedio: sumaCompetenciaFinal,
        competenciaId: null, criterioId: null, evidenciaId: null,
      });
    } catch (e) { console.log("Error guardando el promedio final", e); }
  };

  const guardarNota = async (
    estudianteId: number,
    actividadId: number,
    valor: number | null,
    simbolo?: string
  ) => {
    const nuevasNotas = notasActividad.map((n) =>
      n.estudianteId === estudianteId && n.actividadId === actividadId
        ? { ...n, valor, simbolo }
        : n
    );
    setNotasActividad(nuevasNotas);

    try {
      if (valor !== null) {
        await axios.post("/api/evaluacion/registroNotas", { estudianteId, actividadId, puntaje: valor });
        setEstudiantes((prev) =>
          prev.map((e) =>
            e.id === estudianteId
              ? { ...e, notas: { ...e.notas, [actividadId]: valor } }
              : e
          )
        );
        await guardarPromedio(estudianteId, competencias, nuevasNotas);
      }
    } catch (e) { console.error("Error al guardar la nota en la DB:", e); }
  };

  // ─── Exportar PDF ─────────────────────────────────────────────────────────
  const exportarPDF = () => {
    if (!materia) return;
    const doc = new jsPDF("l", "pt", "a4");
    doc.setFontSize(18); doc.setTextColor(5, 0, 77);
    doc.text(`${materia.nombre}`, 40, 40);
    doc.setFontSize(12);
    doc.text(`${materia.sigla}`, 40, 60);

    const head: any[] = [];
    const fila1: any[] = [{ content: "#", rowSpan: 4 }, { content: "Nombre", rowSpan: 4 }];

    competencias.forEach((comp: Competencia) => {
      const total = comp.criterioevaluacion?.reduce((t: number, crit: any) =>
        t + (crit.evidencia?.reduce((te: number, ev: any) => te + (ev.actividad?.length ?? 0) + 1, 0) ?? 0), 0) ?? 0;
      if (total > 0) fila1.push({ content: comp.tipo, colSpan: total } as any);
    });
    head.push(fila1);

    const fila2: any[] = [];
    competencias.forEach((comp: any) =>
      comp.criterioevaluacion?.forEach((crit: any) => {
        const total = crit.evidencia?.reduce((t: number, ev: any) => t + (ev.actividad?.length ?? 0) + 1, 0) ?? 0;
        if (total > 0) fila2.push({ content: crit.nombre ?? "Sin criterio", colSpan: total });
      })
    );
    head.push(fila2);

    const fila3: any[] = [];
    competencias.forEach((comp: any) =>
      comp.criterioevaluacion?.forEach((crit: any) =>
        crit.evidencia?.forEach((ev: any) =>
          fila3.push({ content: ev.nombre ?? "Sin evidencia", colSpan: (ev.actividad?.length ?? 0) + 1 })
        )
      )
    );
    head.push(fila3);

    const fila4: any[] = [];
    competencias.forEach((comp: any) =>
      comp.criterioevaluacion?.forEach((crit: any) =>
        crit.evidencia?.forEach((ev: any) => {
          ev.actividad?.forEach((a: any) => fila4.push({ content: a.nombre ?? "Sin nombre" }));
          fila4.push({ content: "Prom Ev" });
        })
      )
    );
    head.push(fila4);

    const body: any[] = estudiantesFiltrados.map((est, idx) => {
      const fila: any[] = [{ content: idx + 1 }, { content: est.nombre }];
      competencias.forEach((comp: any) =>
        comp.criterioevaluacion?.forEach((crit: any) =>
          crit.evidencia?.forEach((ev: any) => {
            const notasEv = ev.actividad?.map((a: any) =>
              notasActividad.find((n) => n.estudianteId === est.id && n.actividadId === a.id)?.valor ?? 0
            ) ?? [];
            ev.actividad?.forEach((a: any) =>
              fila.push({ content: notasActividad.find((n) => n.estudianteId === est.id && n.actividadId === a.id)?.valor ?? 0 })
            );
            const prom = notasEv.reduce((a: number, b: number) => a + b, 0) / (notasEv.length || 1);
            fila.push({ content: prom.toFixed(2) });
          })
        )
      );
      return fila;
    });

    autoTable(doc, { head, body, startY: 80, theme: "grid",
      styles: { fontSize: 8, halign: "center", valign: "middle" },
      headStyles: { fillColor: [0, 77, 77], textColor: 255 } });
    doc.save(`${materia.nombre}.pdf`);
  };

  // ─── Exportar Excel ───────────────────────────────────────────────────────
  const exportarExcel = async () => {
    if (!materia) return;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(materia.nombre);

    const headerStyle: any = {
      font: { bold: true, color: { argb: "FFFFFFFF" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF004D4D" } },
      alignment: { vertical: "middle", horizontal: "center" },
      border: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } },
    };
    const normalStyle: any = {
      alignment: { vertical: "middle", horizontal: "center" },
      border: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } },
    };

    ws.addRow([`Materia: ${materia.nombre}`]);
    ws.addRow([`Sigla: ${materia.sigla}`]);
    ws.addRow([]);

    const headRows: ExcelJS.Row[] = [];
    for (let i = 0; i < 4; i++) headRows.push(ws.addRow([]));

    let col = 1;
    ws.mergeCells(4, col, 7, col); headRows[0].getCell(col).value = "#"; headRows[0].getCell(col).style = headerStyle; col++;
    ws.mergeCells(4, col, 7, col); headRows[0].getCell(col).value = "Nombre"; headRows[0].getCell(col).style = headerStyle; col++;

    competencias.forEach((comp) => {
      const total = comp.criterioevaluacion?.reduce((t: number, crit: any) =>
        t + (crit.evidencia?.reduce((te: number, ev: any) => te + (ev.actividad?.length ?? 0) + 1, 0) ?? 0), 0) ?? 0;
      if (total > 0) {
        ws.mergeCells(4, col, 4, col + total - 1);
        headRows[0].getCell(col).value = comp.tipo; headRows[0].getCell(col).style = headerStyle;
        col += total;
      }
    });

    col = 3;
    competencias.forEach((comp) =>
      comp.criterioevaluacion?.forEach((crit: any) => {
        const total = crit.evidencia?.reduce((t: number, ev: any) => t + (ev.actividad?.length ?? 0) + 1, 0) ?? 0;
        if (total > 0) {
          ws.mergeCells(5, col, 5, col + total - 1);
          headRows[1].getCell(col).value = crit.nombre ?? "Sin criterio"; headRows[1].getCell(col).style = headerStyle;
          col += total;
        }
      })
    );

    col = 3;
    competencias.forEach((comp) =>
      comp.criterioevaluacion?.forEach((crit: any) =>
        crit.evidencia?.forEach((ev: any) => {
          const totalCols = (ev.actividad?.length ?? 0) + 1;
          ws.mergeCells(6, col, 6, col + totalCols - 1);
          headRows[2].getCell(col).value = ev.nombre ?? "Sin evidencia"; headRows[2].getCell(col).style = headerStyle;
          col += totalCols;
        })
      )
    );

    col = 3;
    competencias.forEach((comp) =>
      comp.criterioevaluacion?.forEach((crit: any) =>
        crit.evidencia?.forEach((ev: any) => {
          ev.actividad?.forEach((a: any) => {
            headRows[3].getCell(col).value = a.nombre ?? "Sin nombre"; headRows[3].getCell(col).style = headerStyle; col++;
          });
          headRows[3].getCell(col).value = "Prom Ev"; headRows[3].getCell(col).style = headerStyle; col++;
        })
      )
    );

    estudiantesFiltrados.forEach((est, idx) => {
      const fila: any[] = [idx + 1, est.nombre];
      competencias.forEach((comp) =>
        comp.criterioevaluacion?.forEach((crit: any) =>
          crit.evidencia?.forEach((ev: any) => {
            const notasEv = ev.actividad?.map((a: any) =>
              notasActividad.find((n) => n.estudianteId === est.id && n.actividadId === a.id)?.valor ?? 0
            ) ?? [];
            ev.actividad?.forEach((a: any) =>
              fila.push(notasActividad.find((n) => n.estudianteId === est.id && n.actividadId === a.id)?.valor ?? 0)
            );
            const prom = notasEv.reduce((a: number, b: number) => a + b, 0) / (notasEv.length || 1);
            fila.push(Number(prom.toFixed(2)));
          })
        )
      );
      const row = ws.addRow(fila);
      row.eachCell((cell: any) => (cell.style = normalStyle));
    });

    ws.columns.forEach((c: any) => {
      let maxLength = 10;
      c.eachCell({ includeEmpty: true }, (cell: any) => {
        const len = cell.value ? cell.value.toString().length : 0;
        if (len > maxLength) maxLength = len;
      });
      c.width = maxLength + 2;
    });

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `${materia.nombre}.xlsx`; link.click();
    URL.revokeObjectURL(url);
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Export buttons */}
      <div className="flex gap-2 p-3 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={exportarPDF}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer"
        >
          <FileText size={15} /> PDF
        </button>
        <button
          onClick={exportarExcel}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer"
        >
          <FileSpreadsheet size={15} /> Excel
        </button>
      </div>

      {/* Mobile scroll hint */}
      <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 dark:bg-teal-900/20 border-b border-teal-100 dark:border-teal-900/40 sm:hidden">
        <svg className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-xs font-bold text-teal-700 dark:text-teal-300">
          Desliza horizontalmente para ver todas las columnas
        </span>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto overflow-y-auto max-h-[50vh] sm:max-h-[60vh] lg:max-h-[70vh] scroll-smooth">
        <table className="min-w-max w-full border-collapse text-sm relative">

          {/* ── THEAD ── */}
          <thead className="sticky top-0 z-30 text-white">
            {/* Fila 1: # Nombre Competencias */}
            <tr>
              <th
                className="border border-teal-700 px-4 py-2 text-left sticky left-0 bg-teal-900 z-40 font-bold"
                style={{ minWidth: "50px" }}
                rowSpan={4}
              >#</th>
              <th
                className="border border-teal-700 px-4 py-2 text-left sticky left-[50px] bg-teal-900 z-40 font-bold"
                style={{ minWidth: "200px" }}
                rowSpan={4}
              >Nombre</th>

              {competencias.map((comp: Competencia) => {
                const total = comp.criterioevaluacion?.reduce(
                  (t: number, crit: Criterio) =>
                    t + (crit.evidencia?.reduce((te, ev) => te + (ev.actividad?.length ?? 0) + 1, 0) ?? 0), 0
                ) ?? 0;
                if (total === 0) return null;
                return (
                  <th key={comp.id} colSpan={total}
                    className="border border-teal-700 bg-teal-950 text-center px-3 py-2.5 text-xs font-black uppercase tracking-widest">
                    {comp.tipo} · {comp.porcentaje} pts
                  </th>
                );
              })}
            </tr>

            {/* Fila 2: Criterios */}
            <tr>
              {competencias.flatMap((comp) =>
                comp.criterioevaluacion?.map((crit: Criterio) => {
                  const total = crit.evidencia?.reduce((t, ev) => t + (ev.actividad?.length ?? 0) + 1, 0) ?? 0;
                  if (total === 0) return null;
                  return (
                    <th key={crit.id} colSpan={total}
                      className="border border-teal-700 bg-teal-800 text-center px-2 py-2 text-xs font-bold">
                      {crit.nombre ?? "Sin criterio"}
                    </th>
                  );
                }) ?? []
              )}
            </tr>

            {/* Fila 3: Evidencias */}
            <tr>
              {competencias.flatMap((comp) =>
                comp.criterioevaluacion?.flatMap((crit: Criterio) =>
                  crit.evidencia?.map((ev: Evidencia) => {
                    const total = ev.actividad?.length ?? 0;
                    if (total === 0) return null;
                    return (
                      <th key={ev.id} colSpan={total + 1}
                        className="border border-teal-700 bg-teal-700 text-center px-2 py-2 text-xs font-semibold">
                        {ev.nombre ?? "Sin evidencia"}
                      </th>
                    );
                  }) ?? []
                ) ?? []
              )}
            </tr>

            {/* Fila 4: Actividades + Prom Ev */}
            <tr>
              {competencias.flatMap((comp) =>
                comp.criterioevaluacion?.flatMap((crit: Criterio) =>
                  crit.evidencia?.flatMap((ev: Evidencia) => {
                    const actThs = ev.actividad?.map((act) => (
                      <th key={act.id}
                        className="border border-teal-700 px-4 py-3 text-center vertical-header bg-teal-900 relative group">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-semibold text-xs">{act.nombre ?? "Sin nombre"}</span>
                          <span className="text-[10px] text-teal-300/70">
                            {new Date(act.fecha).toLocaleDateString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit" })}
                          </span>
                        </div>
                        {/* Botones de edicion y eliminacion */}
                        <div className="absolute inset-x-0 right-15 bottom-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform rotate-180 z-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              _handleEditarActividad(act.id);
                            }}
                            title="Editar"
                            className="p-1.5 rounded-md bg-teal-600 hover:bg-teal-500 text-white shadow-lg transition-all cursor-pointer hover:scale-110"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              _handleEliminar(act.id);
                            }}
                            title="Eliminar"
                            className="p-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-all cursor-pointer hover:scale-110"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                          </button>
                        </div>
                      </th>
                    )) ?? [];

                    return [
                      ...actThs,
                      <th key={`prom-ev-${ev.id}`}
                        className="border border-teal-700 px-4 py-3 text-center bg-teal-600/80 font-black text-xs tracking-widest">
                        Prom
                      </th>,
                    ];
                  }) ?? []
                ) ?? []
              )}
            </tr>
          </thead>

          {/* ── TBODY ── */}
          <tbody>
            {estudiantesFiltrados.map((est, i) => (
              <tr key={est.id}
                className="even:bg-gray-50 dark:even:bg-gray-800/30 hover:bg-teal-50/60 dark:hover:bg-teal-900/10 transition-colors text-gray-800 dark:text-gray-200">

                <td className="border border-gray-200 dark:border-gray-700/60 px-4 py-2 text-center sticky left-0 bg-white dark:bg-[#1e1e1e] z-20 font-bold text-gray-500 dark:text-gray-400">
                  {i + 1}
                </td>
                <td className="border border-gray-200 dark:border-gray-700/60 px-4 py-2 sticky left-[50px] bg-white dark:bg-[#1e1e1e] z-20 font-semibold whitespace-nowrap">
                  {est.nombre}
                </td>

                {competencias.flatMap((comp: Competencia) =>
                  comp.criterioevaluacion?.flatMap((crit) =>
                    crit.evidencia?.flatMap((ev) => {
                      const notasEv = ev.actividad?.map((act) => obtenerNota(est.id, act.id).valor ?? 0) ?? [];
                      const promedioEv = notasEv.reduce((a, b) => a + b, 0) / (notasEv.length || 1);

                      const celdasAct = ev.actividad?.map((act) => {
                        const key = `${est.id}-${act.id}`;
                        const nota = obtenerNota(est.id, act.id);
                        const editable = isEditable(est.id, act.id);
                        const tieneNota = nota.valor !== null;

                        return (
                          <td key={key} className={cellClass(editable, tieneNota)}>
                            {modoGeneral === "simbolo" ? (
                              <div className="relative flex items-center justify-center">
                                <select
                                  value={nota.simbolo || (nota.valor !== null ? obtenerSimbolo(nota.valor) : "")}
                                  onChange={(e) => {
                                    const simbolo = e.target.value;
                                    const valor = valorSimboloMap[simbolo] ?? 0;
                                    setNotasActividad((prev) =>
                                      prev.map((n) =>
                                        n.estudianteId === est.id && n.actividadId === act.id
                                          ? { ...n, simbolo, valor }
                                          : n
                                      )
                                    );
                                    setEstudiantes((prevEst) =>
                                      prevEst.map((e) =>
                                        e.id === est.id
                                          ? { ...e, notas: { ...e.notas, [act.id]: valor } }
                                          : e
                                      )
                                    );
                                    guardarNota(est.id, act.id, valor, simbolo).catch(console.error);
                                  }}
                                  className={selectClass}
                                  disabled={!editable}
                                >
                                  <option value="">-</option>
                                  {Object.keys(valorSimboloMap).map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => toggleEditable(est.id, act.id, true)}
                                  className="ml-1 text-gray-300 hover:text-teal-400 transition-colors"
                                >
                                  <Pencil size={11} />
                                </button>
                              </div>
                            ) : (
                              <div className="relative flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  value={inputNotas[key] ?? ""}
                                  min={0} max={100}
                                  disabled={!editable}
                                  className={inputClass}
                                  onChange={(e) =>
                                    setInputNotas((prev) => ({ ...prev, [key]: e.target.value }))
                                  }
                                  onKeyDown={async (e) => {
                                    if (e.key === "Enter" && editable) {
                                      const value = parseFloat(inputNotas[key]);
                                      if (!isNaN(value)) {
                                        await guardarNota(est.id, act.id, value);
                                        toggleEditable(est.id, act.id, false);
                                      }
                                    }
                                  }}
                                  onBlur={async () => {
                                    if (editable) {
                                      const value = parseFloat(inputNotas[key]);
                                      if (!isNaN(value)) {
                                        await guardarNota(est.id, act.id, value);
                                        toggleEditable(est.id, act.id, false);
                                      }
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => toggleEditable(est.id, act.id, true)}
                                  className="text-gray-300 hover:text-teal-400 transition-colors shrink-0"
                                >
                                  <Pencil size={11} />
                                </button>
                              </div>
                            )}
                          </td>
                        );
                      }) ?? [];

                      return [
                        ...celdasAct,
                        <td key={`prom-ev-${ev.id}`}
                          className="border border-gray-200 dark:border-gray-700/60 px-3 py-2 text-center font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/20">
                          {promedioEv.toFixed(2)}
                        </td>,
                      ];
                    }) ?? []
                  ) ?? []
                )}
              </tr>
            ))}
          </tbody>
        </table>

        <style jsx>{`
          .vertical-header {
            writing-mode: vertical-rl;
            transform: rotate(180deg);
            white-space: normal;
            overflow-wrap: break-word;
            word-break: break-word;
            padding: 8px 4px;
            max-height: 120px;
            width: 45px;
            vertical-align: bottom;
            text-align: center;
            position: relative;
          }
        `}</style>
      </div>
    </div>
  );
};

export default TablaActividades;
