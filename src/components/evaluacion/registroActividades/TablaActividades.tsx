"use client";

import React, { act, useEffect, useState } from "react";
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

const TablaActividades: React.FC<TablaActividadesProps> = ({
  estudiantesFiltrados,
  setEstudiantes,
  actividades,
  competencias,
  modoGeneral,
  handleEditarActividad,
  handleEliminar,
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
  const [editableCells, setEditableCells] = useState<Record<string, boolean>>(
    {}
  );
  const [inputNotas, setInputNotas] = useState<Record<string, string>>({});
  const [materia, setMateria] = useState<Asignaturas | null>(null);

  //Para obtener la materia
  useEffect(() => {
    const materiaJSON = localStorage.getItem("materia");

    if (materiaJSON) {
      const materia = JSON.parse(materiaJSON);

      setMateria(materia);
    }
  }, []);

  // Inicializar notas desde estudiantes
  useEffect(() => {
    const inicialNotas: NotaActividad[] = [];
    const inicialInputs: Record<string, string> = {};

    setEditableCells((prevEditableCells) => {
      const nuevosEditables: Record<string, boolean> = {};

      estudiantesFiltrados.forEach((est) => {
        actividades
          .filter(
            (act: any): act is { id: number } =>
              act !== undefined && act.id !== undefined
          )
          .forEach((act) => {
            const valor = est.notas?.[act.id] ?? null;
            const key = `${est.id}-${act.id}`;

            inicialNotas.push({
              estudianteId: est.id,
              actividadId: act.id,
              valor,
            });

            inicialInputs[key] = valor !== null ? String(valor) : "";

            const previa = prevEditableCells?.[key];
            nuevosEditables[key] =
              previa !== undefined ? previa : valor === null;
          });
      });

      return nuevosEditables;
    });

    setNotasActividad(inicialNotas);
    setInputNotas(inicialInputs);
  }, [estudiantesFiltrados, actividades]);

  const toggleEditable = (
    estudianteId: number,
    actividadId: number,
    valor?: boolean
  ) => {
    const key = `${estudianteId}-${actividadId}`;
    setEditableCells((prev) => ({
      ...prev,
      [key]: valor !== undefined ? valor : !prev[key],
    }));
  };

  const isEditable = (estudianteId: number, actividadId: number) => {
    const key = `${estudianteId}-${actividadId}`;
    return editableCells[key] ?? false;
  };

  const obtenerNota = (estudianteId: number, actividadId: number) =>
    notasActividad.find(
      (n) => n.estudianteId === estudianteId && n.actividadId === actividadId
    ) || { valor: null, simbolo: "" };

  const obtenerSimbolo = (valor: number) => {
    if (valor >= 10) return "⭐";
    if (valor >= 9) return "▲+";
    if (valor >= 8) return "▲";
    if (valor >= 7) return "▲-";
    if (valor >= 6) return "⚪+";
    if (valor >= 5) return "⚪";
    if (valor >= 4) return "⚪-";
    if (valor >= 3) return "🟩+";
    if (valor >= 2) return "🟩";
    if (valor >= 1) return "🟩-";
    return "";
  };

  const guardarPromedio = async (
    estudianteId: number,
    competencias: Competencia[],
    notasActividad: NotaActividad[]
  ) => {
    let sumaCompetenciaFinal = 0;
    for (const comp of competencias) {
      let sumaCriterios = 0;
      let cantidadCriterios = 0;

      for (const crit of comp.criterioevaluacion || []) {
        let sumaEvidencias = 0;
        let cantidadEvidencias = 0;

        // Primero guardamos promedios de cada evidencia
        for (const ev of crit.evidencia || []) {
          let suma = 0;
          let count = 0;

          for (const act of ev.actividad || []) {
            const nota =
              notasActividad.find(
                (n) =>
                  n.estudianteId === estudianteId && n.actividadId === act.id
              )?.valor ?? 0;

            suma += nota;
            count++;
          }

          if (count > 0) {
            const promedioEv = suma / count;

            // Guardar promedio de la evidencia
            try {
              await axios.post("/api/evaluacion/promedioParcial", {
                estudianteId,
                asignaturaId: comp.asignaturaId,
                tipo: "evidencia",
                promedio: promedioEv,
                competenciaId: comp.id,
                criterioId: crit.id,
                evidenciaId: ev.id,
              });
            } catch (error) {
              console.error("Error guardando promedio de evidencia:", error);
            }

            // Acumulamos para el promedio del criterio
            sumaEvidencias += promedioEv;
            cantidadEvidencias++;
          }
        }

        // Guardamos promedio del criterio
        if (cantidadEvidencias > 0) {
          const promedioCrit = sumaEvidencias / cantidadEvidencias;

          try {
            await axios.post("/api/evaluacion/promedioParcial", {
              estudianteId,
              asignaturaId: comp.asignaturaId,
              tipo: "criterio",
              promedio: promedioCrit,
              competenciaId: comp.id,
              criterioId: crit.id,
              evidenciaId: null,
            });
          } catch (error) {
            console.error("Error guardando promedio de criterio:", error);
          }

          // Acumulamos para el promedio de la competencia
          sumaCriterios += promedioCrit;
          cantidadCriterios++;
        }
      }

      // Guardamos promedio de la competencia (suma de criterios)
      if (cantidadCriterios > 0) {
        const promedioComp = sumaCriterios / cantidadCriterios;
        sumaCompetenciaFinal += promedioComp;
        try {
          await axios.post("/api/evaluacion/promedioParcial", {
            estudianteId,
            asignaturaId: comp.asignaturaId,
            tipo: "competencia",
            promedio: promedioComp,
            competenciaId: comp.id,
            criterioId: null,
            evidenciaId: null, // porque es promedio de la competencia
          });
        } catch (error) {
          console.error("Error guardando promedio de competencia:", error);
        }
      }
    }

    //Para guardar el promedio Final
    try {
      await axios.post("/api/evaluacion/promedioParcial", {
        estudianteId,
        asignaturaId: competencias[0]?.asignaturaId ?? 0,
        tipo: "final",
        promedio: sumaCompetenciaFinal,
        competenciaId: null,
        criterioId: null,
        evidenciaId: null,
      });
    } catch (error) {
      console.log(" error  guardando el promediofinal", error);
    }
  };

  const guardarNota = async (
    estudianteId: number,
    actividadId: number,
    valor: number | null,
    simbolo?: string
  ) => {
    // Crear la lista actualizada
    const nuevasNotasActividad = notasActividad.map((n) =>
      n.estudianteId === estudianteId && n.actividadId === actividadId
        ? { ...n, valor, simbolo }
        : n
    );

    // Actualizar el estado
    setNotasActividad(nuevasNotasActividad);

    try {
      if (valor !== null) {
        // Guardamos la nota en la DB
        await axios.post("/api/evaluacion/registroNotas", {
          estudianteId,
          actividadId,
          puntaje: valor,
        });

        // Actualizamos estudiantes
        setEstudiantes((prev) =>
          prev.map((e) =>
            e.id === estudianteId
              ? { ...e, notas: { ...e.notas, [actividadId]: valor } }
              : e
          )
        );

        // Guardamos el promedio usando la lista ya actualizada
        await guardarPromedio(estudianteId, competencias, nuevasNotasActividad);
      }
    } catch (error) {
      console.error("Error al guardar la nota en la DB:", error);
    }
  };

  const exportarPDF = () => {
    if (!materia) return;

    const doc = new jsPDF("l", "pt", "a4"); // 'l' para landscape si hay muchas columnas
    doc.setFontSize(18);
    doc.setTextColor(5, 0, 77);
    doc.text(`${materia.nombre}`, 40, 40);
    doc.setFontSize(12);
    doc.text(`${materia.sigla}`, 40, 60);

    // Generar encabezados
    const head: any[] = [];

    // FILA 1: #
    const fila1 = [
      { content: "#", rowSpan: 4 },
      { content: "Nombre", rowSpan: 4 },
    ];

    competencias.forEach((comp: Competencia) => {
      const totalActividades: any =
        comp.criterioevaluacion?.reduce((totalCrit: any, crit: any) => {
          return (
            totalCrit +
            (crit.evidencia?.reduce((totalEv: any, ev: any) => {
              return totalEv + (ev.actividad?.length ?? 0) + 1; // +1 por Prom Ev
            }, 0) ?? 0)
          );
        }, 0) ?? 0;

      if (totalActividades > 0) {
        fila1.push({ content: comp.tipo, colSpan: totalActividades } as any);
      }
    });
    head.push(fila1);

    // FILA 2: criterios
    const fila2: any[] = [];
    competencias.forEach((comp: any) => {
      comp.criterioevaluacion?.forEach((crit: any) => {
        const totalActividades =
          crit.evidencia?.reduce((totalEv: any, ev: any) => {
            return totalEv + (ev.actividad?.length ?? 0) + 1;
          }, 0) ?? 0;

        if (totalActividades > 0) {
          fila2.push({
            content: crit.nombre ?? "Sin criterio",
            colSpan: totalActividades,
          });
        }
      });
    });
    head.push(fila2);

    // FILA 3: evidencias
    const fila3: any[] = [];
    competencias.forEach((comp: any) => {
      comp.criterioevaluacion?.forEach((crit: any) => {
        crit.evidencia?.forEach((ev: any) => {
          fila3.push({
            content: ev.nombre ?? "Sin evidencia",
            colSpan: (ev.actividad?.length ?? 0) + 1,
          });
        });
      });
    });
    head.push(fila3);

    // FILA 4: actividades + Prom Ev
    const fila4: any[] = [];
    competencias.forEach((comp: any) => {
      comp.criterioevaluacion?.forEach((crit: any) => {
        crit.evidencia?.forEach((ev: any) => {
          ev.actividad?.forEach((act: any) => {
            fila4.push({
              content: act.nombre ?? "Sin nombre",
            });
          });
          fila4.push({ content: "Prom Ev" });
        });
      });
    });
    head.push(fila4);

    // Generar datos de los estudiantes
    const body: any[] = [];
    estudiantesFiltrados.forEach((est, index) => {
      const fila: any[] = [{ content: index + 1 }, { content: est.nombre }];

      competencias.forEach((comp: any) => {
        comp.criterioevaluacion?.forEach((crit: any) => {
          crit.evidencia?.forEach((ev: any) => {
            const notasEv =
              ev.actividad?.map(
                (act: any) =>
                  notasActividad.find(
                    (n) => n.estudianteId === est.id && n.actividadId === act.id
                  )?.valor ?? 0
              ) ?? [];

            // celdas de actividades
            ev.actividad?.forEach((act: any) => {
              const nota =
                notasActividad.find(
                  (n) => n.estudianteId === est.id && n.actividadId === act.id
                )?.valor ?? 0;
              fila.push({ content: nota });
            });

            // promedio de la evidencia
            const promedioEv =
              notasEv.reduce((a: number, b: number) => a + b, 0) /
              (notasEv.length || 1);
            fila.push({ content: promedioEv.toFixed(2) });
          });
        });
      });

      body.push(fila);
    });

    autoTable(doc, {
      head: head,
      body: body,
      startY: 80,
      theme: "grid",
      styles: { fontSize: 8, halign: "center", valign: "middle" },
      headStyles: { fillColor: [0, 77, 77], textColor: 255 },
    });

    doc.save(`${materia.nombre}.pdf`);
  };

  const exportarExcel = async () => {
    if (!materia) return;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(materia.nombre);

    // FORMATO GENERAL
    const headerStyle = {
      font: { bold: true, color: { argb: "FFFFFFFF" } },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF004D4D" },
      },
      alignment: { vertical: "middle", horizontal: "center" },
      border: {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      },
    };

    const normalStyle = {
      alignment: { vertical: "middle", horizontal: "center" },
      border: {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      },
    };

    // NOMBRE DE LA MATERIA Y SIGLA
    ws.addRow([`Materia: ${materia.nombre}`]);
    ws.addRow([`Sigla: ${materia.sigla}`]);
    ws.addRow([]);

    // FILAS DE ENCABEZADOS JERÁRQUICOS
    const headRows: ExcelJS.Row[] = [];
    for (let i = 0; i < 4; i++) headRows.push(ws.addRow([]));

    // FILA 1: # y Nombre + Competencias
    let col = 1;
    ws.mergeCells(4, col, 7, col);
    headRows[0].getCell(col).value = "#";
    headRows[0].getCell(col).style = headerStyle as any;
    col++;

    ws.mergeCells(4, col, 7, col);
    headRows[0].getCell(col).value = "Nombre";
    headRows[0].getCell(col).style = headerStyle as any;
    col++;

    competencias.forEach((comp) => {
      const totalActividades =
        comp.criterioevaluacion?.reduce((totalCrit: any, crit: any) => {
          return (
            totalCrit +
            (crit.evidencia?.reduce((totalEv: any, ev: any) => {
              return totalEv + (ev.actividad?.length ?? 0) + 1;
            }, 0) ?? 0)
          );
        }, 0) ?? 0;

      if (totalActividades > 0) {
        ws.mergeCells(4, col, 4, col + totalActividades - 1);
        headRows[0].getCell(col).value = comp.tipo;
        headRows[0].getCell(col).style = headerStyle as any;
        col += totalActividades;
      }
    });

    // FILA 2: Criterios
    col = 3;
    competencias.forEach((comp) => {
      comp.criterioevaluacion?.forEach((crit: any) => {
        const totalActividades =
          crit.evidencia?.reduce((totalEv: any, ev: any) => {
            return totalEv + (ev.actividad?.length ?? 0) + 1;
          }, 0) ?? 0;

        if (totalActividades > 0) {
          ws.mergeCells(5, col, 5, col + totalActividades - 1);
          headRows[1].getCell(col).value = crit.nombre ?? "Sin criterio";
          headRows[1].getCell(col).style = headerStyle as any;
          col += totalActividades;
        }
      });
    });

    // FILA 3: Evidencias
    col = 3;
    competencias.forEach((comp) => {
      comp.criterioevaluacion?.forEach((crit: any) => {
        crit.evidencia?.forEach((ev: any) => {
          const totalCols = (ev.actividad?.length ?? 0) + 1;
          if (totalCols > 0) {
            ws.mergeCells(6, col, 6, col + totalCols - 1);
            headRows[2].getCell(col).value = ev.nombre ?? "Sin evidencia";
            headRows[2].getCell(col).style = headerStyle as any;
            col += totalCols;
          }
        });
      });
    });

    // FILA 4: Actividades + Prom Ev
    col = 3;
    competencias.forEach((comp) => {
      comp.criterioevaluacion?.forEach((crit: any) => {
        crit.evidencia?.forEach((ev: any) => {
          ev.actividad?.forEach((act: any) => {
            headRows[3].getCell(col).value = act.nombre ?? "Sin nombre";
            headRows[3].getCell(col).style = headerStyle as any;
            col++;
          });
          headRows[3].getCell(col).value = "Prom Ev";
          headRows[3].getCell(col).style = headerStyle as any;
          col++;
        });
      });
    });

    // ---------- DATOS DE ESTUDIANTES ----------
    estudiantesFiltrados.forEach((est, index) => {
      const fila: any[] = [index + 1, est.nombre];

      competencias.forEach((comp) => {
        comp.criterioevaluacion?.forEach((crit: any) => {
          crit.evidencia?.forEach((ev: any) => {
            const notasEv =
              ev.actividad?.map(
                (act: any) =>
                  notasActividad.find(
                    (n) => n.estudianteId === est.id && n.actividadId === act.id
                  )?.valor ?? 0
              ) ?? [];

            ev.actividad?.forEach((act: any) => {
              const nota =
                notasActividad.find(
                  (n) => n.estudianteId === est.id && n.actividadId === act.id
                )?.valor ?? 0;
              fila.push(nota);
            });

            // Promedio de la evidencia
            const promedioEv =
              notasEv.reduce((a: any, b: any) => a + b, 0) /
              (notasEv.length || 1);
            fila.push(Number(promedioEv.toFixed(2)));
          });
        });
      });

      const row = ws.addRow(fila);
      row.eachCell((cell: any) => (cell.style = normalStyle));
    });

    // Ajustar ancho de columnas
    ws.columns.forEach((col: any) => {
      let maxLength = 10;
      col.eachCell({ includeEmpty: true }, (cell: any) => {
        const len = cell.value ? cell.value.toString().length : 0;
        if (len > maxLength) maxLength = len;
      });
      col.width = maxLength + 2;
    });

    // Guardar archivo
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${materia.nombre}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <button
          onClick={exportarPDF}
          className="flex items-center gap-1 px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 hover:cursor-pointer"
        >
          <FileText size={16} /> PDF
        </button>
        <button
          onClick={exportarExcel}
          className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 hover:cursor-pointer"
        >
          <FileSpreadsheet size={16} /> Excel
        </button>
      </div>

      <div className="border rounded-lg shadow-sm overflow-auto max-h-[600px]">
        <table className="min-w-max w-full border-collapse text-sm relative">
          <thead className="bg-teal-600 text-white sticky top-0 z-30">
            {/* FILA 1: #, Nombre, tipos de competencia */}
            <tr>
              <th
                className="border px-4 py-2 text-left sticky left-0 bg-teal-600 z-40"
                style={{ minWidth: "50px" }}
                rowSpan={4}
              >
                #
              </th>
              <th
                className="border px-4 py-2 text-left sticky left-[50px] bg-teal-600 z-40"
                style={{ minWidth: "200px" }}
                rowSpan={4}
              >
                Nombre
              </th>

              {competencias.map((comp: Competencia) => {
                const totalActividades =
                  comp.criterioevaluacion?.reduce(
                    (totalCrit: number, crit: Criterio) => {
                      return (
                        totalCrit +
                        (crit.evidencia?.reduce((totalEv, ev) => {
                          return totalEv + (ev.actividad?.length ?? 0) + 1; // +1 por Prom Ev
                        }, 0) ?? 0)
                      );
                    },
                    0
                  ) ?? 0;

                if (totalActividades === 0) return null;

                return (
                  <th
                    key={comp.id}
                    colSpan={totalActividades}
                    className="bg-teal-900 border text-center p-3"
                  >
                    {comp.tipo} : {comp.porcentaje} Puntos
                  </th>
                );
              })}
            </tr>

            {/* FILA 2: criterios de evaluación */}
            <tr>
              {competencias.flatMap(
                (comp) =>
                  comp.criterioevaluacion?.map((crit: Criterio) => {
                    const totalActividades =
                      crit.evidencia?.reduce((totalEv, ev) => {
                        return totalEv + (ev.actividad?.length ?? 0) + 1; // +1 por Prom Ev
                      }, 0) ?? 0;

                    if (totalActividades === 0) return null;

                    return (
                      <th
                        key={crit.id}
                        colSpan={totalActividades}
                        className="bg-teal-700 border text-center p-2"
                      >
                        {crit.nombre ?? "Sin criterio"}
                      </th>
                    );
                  }) ?? []
              )}
            </tr>

            {/* FILA 3: evidencias */}
            <tr>
              {competencias.flatMap(
                (comp) =>
                  comp.criterioevaluacion?.flatMap(
                    (crit: Criterio) =>
                      crit.evidencia?.map((ev: Evidencia) => {
                        const totalActividades = ev.actividad?.length ?? 0;
                        if (totalActividades === 0) return null;

                        return (
                          <th
                            key={ev.id}
                            colSpan={(ev.actividad?.length ?? 0) + 1}
                            className="bg-teal-600 border text-center p-2 text-xs"
                          >
                            {ev.nombre ?? "Sin evidencia"}
                          </th>
                        );
                      }) ?? []
                  ) ?? []
              )}
            </tr>

            {/* FILA 4: actividades + columna de promedio de cada evidencia */}
            <tr>
              {competencias.flatMap(
                (comp) =>
                  comp.criterioevaluacion?.flatMap(
                    (crit: Criterio) =>
                      crit.evidencia?.flatMap((ev: Evidencia) => {
                        const actividadThs =
                          ev.actividad?.map((act) => (
                            <th
                              key={act.id}
                              className="border p-5 text-center vertical-header relative group bg-teal-900"
                            >
                              <div className="flex flex-col items-center justify-center gap-1">
                                <span className="font-semibold">
                                  {act.nombre ?? "Sin nombre"}
                                </span>
                                <span className="text-xs text-gray-200">
                                  {new Date(act.fecha).toLocaleDateString(
                                    "es-ES",
                                    {
                                      year: "numeric",
                                      month: "2-digit",
                                      day: "2-digit",
                                    }
                                  )}
                                </span>
                              </div>
                            </th>
                          )) ?? [];

                        return [
                          ...actividadThs,
                          <th
                            key={`prom-ev-${ev.id}`}
                            className="border p-5 text-center bg-cyan-800 font-bold"
                          >
                            Prom Ev
                          </th>,
                        ];
                      }) ?? []
                  ) ?? []
              )}
            </tr>
          </thead>

          <tbody>
            {estudiantesFiltrados.map((est, i) => (
              <tr
                key={est.id}
                className="even:bg-gray-50 hover:bg-gray-100 transition"
              >
                <td className="border px-4 py-2 text-center sticky left-0 bg-white z-20">
                  {i + 1}
                </td>
                <td className="border px-4 py-2 sticky left-[50px] bg-white z-20">
                  {est.nombre}
                </td>

                {competencias.flatMap(
                  (comp: Competencia) =>
                    comp.criterioevaluacion?.flatMap(
                      (crit) =>
                        crit.evidencia?.flatMap((ev) => {
                          const notasEv =
                            ev.actividad?.map(
                              (act) => obtenerNota(est.id, act.id).valor ?? 0
                            ) ?? [];
                          const promedioEv =
                            notasEv.reduce((a, b) => a + b, 0) /
                            (notasEv.length || 1);

                          // Mapear actividades de la evidencia
                          const celdasAct =
                            ev.actividad?.map((act) => {
                              const key = `${est.id}-${act.id}`;
                              const nota = obtenerNota(est.id, act.id);
                              const editable = isEditable(est.id, act.id);
                              const tieneNota = nota.valor !== null;

                              return (
                                <td
                                  key={key}
                                  className={`border px-2 py-2 text-center relative ${
                                    editable
                                      ? "bg-white"
                                      : tieneNota
                                      ? "bg-green-200"
                                      : ""
                                  }`}
                                >
                                  {modoGeneral === "simbolo" ? (
                                    <div className="relative">
                                      <select
                                        value={
                                          nota.simbolo ||
                                          (nota.valor !== null
                                            ? obtenerSimbolo(nota.valor)
                                            : "")
                                        }
                                        onChange={(e) => {
                                          const simbolo = e.target.value;
                                          const valor =
                                            valorSimboloMap[simbolo] ?? 0;

                                          // Actualizamos localmente
                                          setNotasActividad((prev) =>
                                            prev.map((n) =>
                                              n.estudianteId === est.id &&
                                              n.actividadId === act.id
                                                ? { ...n, simbolo, valor }
                                                : n
                                            )
                                          );

                                          setEstudiantes((prevEst) =>
                                            prevEst.map((estudiante) =>
                                              estudiante.id === est.id
                                                ? {
                                                    ...estudiante,
                                                    notas: {
                                                      ...estudiante.notas,
                                                      [act.id]: valor,
                                                    },
                                                  }
                                                : estudiante
                                            )
                                          );

                                          // Guardar inmediatamente en DB al cambiar (opcional)
                                          guardarNota(
                                            est.id,
                                            act.id,
                                            valor,
                                            simbolo
                                          ).catch((err) =>
                                            console.error(
                                              "Error guardando nota al cambiar select:",
                                              err
                                            )
                                          );
                                        }}
                                        className="border rounded-md px-1 py-0.5 text-center w-16"
                                        disabled={!editable}
                                      >
                                        <option value="">-</option>
                                        {Object.keys(valorSimboloMap).map(
                                          (s) => (
                                            <option key={s} value={s}>
                                              {s}
                                            </option>
                                          )
                                        )}
                                      </select>

                                      <button
                                        onClick={() =>
                                          toggleEditable(est.id, act.id, true)
                                        }
                                        className="absolute top-1 right-1 text-gray-400 hover:text-blue-500"
                                      >
                                        <Pencil size={12} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="relative">
                                      <input
                                        type="number"
                                        value={inputNotas[key] ?? ""}
                                        min={0}
                                        max={100}
                                        disabled={!editable}
                                        className="w-14 text-center border border-gray-300 rounded-md p-1 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        onChange={(e) =>
                                          setInputNotas((prev) => ({
                                            ...prev,
                                            [key]: e.target.value,
                                          }))
                                        }
                                        onKeyDown={async (e) => {
                                          if (e.key === "Enter" && editable) {
                                            const value = parseFloat(
                                              inputNotas[key]
                                            );
                                            if (!isNaN(value)) {
                                              await guardarNota(
                                                est.id,
                                                act.id,
                                                value
                                              );
                                              toggleEditable(
                                                est.id,
                                                act.id,
                                                false
                                              );
                                            }
                                          }
                                        }}
                                        onBlur={async () => {
                                          if (editable) {
                                            const value = parseFloat(
                                              inputNotas[key]
                                            );
                                            if (!isNaN(value)) {
                                              await guardarNota(
                                                est.id,
                                                act.id,
                                                value
                                              );
                                              toggleEditable(
                                                est.id,
                                                act.id,
                                                false
                                              );
                                            }
                                          }
                                        }}
                                      />
                                      <button
                                        onClick={() =>
                                          toggleEditable(est.id, act.id, true)
                                        }
                                        className="absolute top-1 right-1 text-gray-400 hover:text-blue-500"
                                      >
                                        <Pencil size={12} />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              );
                            }) ?? [];

                          // Columna del promedio de la evidencia
                          return [
                            ...celdasAct,
                            <td
                              key={`prom-ev-${ev.id}`}
                              className="border px-2 py-2 text-center bg-cyan-400 font-bold"
                            >
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
            width: 30px;
            vertical-align: bottom;
            text-align: center;
            font-weight: 600;
          }
        `}</style>
      </div>
    </div>
  );
};

export default TablaActividades;
