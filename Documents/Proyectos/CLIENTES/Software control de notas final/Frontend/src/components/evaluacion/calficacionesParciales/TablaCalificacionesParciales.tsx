import {
  Asignaturas,
  Competencia,
  Estudiante,
  PromediosPorEstudiante,
} from "@/types/semestre";
import { FileSpreadsheet, FileText } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

interface TablaCalificacionesParcialesProps {
  estudiantes: Estudiante[];
  competencias: Competencia[];
  promedios: PromediosPorEstudiante;
}

const TablaCalificacionesParciales: React.FC<
  TablaCalificacionesParcialesProps
> = ({ estudiantes, competencias, promedios }) => {
  const [materia, setMateria] = useState<Asignaturas | null>(null);
  useEffect(() => {
    const materiaJSON = localStorage.getItem("materia");

    if (materiaJSON) {
      const materia = JSON.parse(materiaJSON);

      setMateria(materia);
    }
  }, []);
  // Ordenamos los estudiantes
  const estudiantesOrdenados = useMemo(
    () =>
      [...estudiantes].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
      ),
    [estudiantes]
  );

  const exportarPDF = () => {
    if (!competencias || !estudiantes || !promedios) return;

    const doc = new jsPDF("l", "pt", "a4");

    // ----------- TITULO -----------
    doc.setFontSize(18);
    doc.setTextColor(5, 0, 77);
    doc.text(materia?.nombre + " - Calificaciones Parciales", 40, 40);

    doc.setFontSize(12);
    doc.text("Reporte de promedios por criterio y competencia", 40, 60);

    // =============================
    //      GENERAR ENCABEZADOS
    // =============================
    const head: any[] = [];

    // -------- Fila 1: #, Nombre y Competencias (colSpan dinámico) -------
    const fila1: any[] = [
      { content: "#", rowSpan: 2 },
      { content: "Nombre", rowSpan: 2 },
    ];

    competencias.forEach((comp) => {
      const numCriterios = comp.criterioevaluacion?.length || 0;
      if (numCriterios > 0) {
        fila1.push({
          content: comp.tipo ?? "Sin nombre",
          colSpan: numCriterios + 1, // +1 por el promedio de competencia
        });
      }
    });

    head.push(fila1);

    // -------- Fila 2: Criterios + Promedio de competencia -------
    const fila2: any[] = [];

    competencias.forEach((comp) => {
      const criterios = comp.criterioevaluacion ?? [];

      criterios.forEach((crit) => {
        fila2.push({
          content: crit.nombre ?? "Sin criterio",
        });
      });

      fila2.push({
        content: "Promedio",
      });
    });

    head.push(fila2);

    // =============================
    //      GENERAR BODY
    // =============================
    const body: any[] = [];

    estudiantesOrdenados.forEach((est, index) => {
      const fila: any[] = [{ content: index + 1 }, { content: est.nombre }];

      competencias.forEach((comp) => {
        const criterios = comp.criterioevaluacion ?? [];

        criterios.forEach((crit) => {
          const promCrit =
            promedios[est.id]?.competencias[comp.id]?.criterios[crit.id]
              ?.promedio ?? 0;

          fila.push({
            content: promCrit.toFixed(2),
          });
        });

        const promComp =
          promedios[est.id]?.competencias[comp.id]?.promedio ?? 0;

        fila.push({
          content: promComp.toFixed(2),
        });
      });

      body.push(fila);
    });

    // =============================
    //        RENDER PDF TABLE
    // =============================
    autoTable(doc, {
      head,
      body,
      startY: 80,
      theme: "grid",
      styles: {
        fontSize: 8,
        halign: "center",
        valign: "middle",
      },
      headStyles: {
        fillColor: [0, 77, 77],
        textColor: 255,
      },
    });

    doc.save("Calificaciones_Parciales.pdf");
  };

  const exportarExcel = async () => {
    if (!competencias || !estudiantesOrdenados || !promedios) return;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(materia?.nombre + "- Calificaciones Parciales");

    // ======= ESTILOS =======
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

    // ======= ENCABEZADO DEL DOCUMENTO =======
    ws.addRow([materia?.nombre + "- Calificaciones Parciales"]);
    ws.addRow(["Reporte generado automáticamente"]);
    ws.addRow([]);

    // ======= FILAS DE ENCABEZADOS =======
    const fila1 = ws.addRow([]);
    const fila2 = ws.addRow([]);

    let col = 1;

    // # y Nombre
    ws.mergeCells(4, col, 5, col);
    fila1.getCell(col).value = "#";
    fila1.getCell(col).style = headerStyle as any;
    col++;

    ws.mergeCells(4, col, 5, col);
    fila1.getCell(col).value = "Nombre";
    fila1.getCell(col).style = headerStyle as any;
    col++;

    // ===== COMPETENCIAS (Fila 1) + Criterios + Promedio (Fila 2) =====
    competencias.forEach((comp) => {
      const criterios = comp.criterioevaluacion ?? [];
      const totalCols = criterios.length + 1; // +1 por PROMEDIO

      if (totalCols > 0) {
        // Competencia en fila 1
        ws.mergeCells(4, col, 4, col + totalCols - 1);
        fila1.getCell(col).value = comp.tipo ?? "Sin nombre";
        fila1.getCell(col).style = headerStyle as any;

        // Criterios
        criterios.forEach((crit, idx) => {
          fila2.getCell(col + idx).value = crit.nombre ?? "Sin criterio";
          fila2.getCell(col + idx).style = headerStyle as any;
        });

        // PROMEDIO COMPETENCIA
        fila2.getCell(col + criterios.length).value = "Promedio";
        fila2.getCell(col + criterios.length).style = headerStyle as any;

        col += totalCols;
      }
    });

    // ========= CUERPO DE LA TABLA =========
    estudiantesOrdenados.forEach((est, index) => {
      const fila: any[] = [index + 1, est.nombre];

      competencias.forEach((comp) => {
        const criterios = comp.criterioevaluacion ?? [];

        criterios.forEach((crit) => {
          const promCrit =
            promedios[est.id]?.competencias[comp.id]?.criterios[crit.id]
              ?.promedio ?? 0;

          fila.push(Number(promCrit.toFixed(2)));
        });

        const promComp =
          promedios[est.id]?.competencias[comp.id]?.promedio ?? 0;

        fila.push(Number(promComp.toFixed(2)));
      });

      const row = ws.addRow(fila);
      row.eachCell((cell: any) => (cell.style = normalStyle));
    });

    // ========= AUTO AJUSTE DE COLUMNAS =========
    ws.columns.forEach((col: any) => {
      let maxLength = 10;
      col.eachCell({ includeEmpty: true }, (cell: any) => {
        const len = cell.value ? cell.value.toString().length : 0;
        if (len > maxLength) maxLength = len;
      });
      col.width = maxLength + 2;
    });

    // ========= DESCARGA =========
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `Calificaciones_Parciales.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="overflow-hidden">
      <div className="flex gap-3 mb-4 p-4 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={exportarPDF}
          className="flex items-center gap-2 px-4 py-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-xl hover:bg-rose-200 dark:hover:bg-rose-900/50 transition font-bold text-sm hover:cursor-pointer"
        >
          <FileText size={18} /> Exportar PDF
        </button>
        <button
          onClick={exportarExcel}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition font-bold text-sm hover:cursor-pointer"
        >
          <FileSpreadsheet size={18} /> Exportar Excel
        </button>
      </div>

      <div className="overflow-auto max-h-[70vh] black:max-h-[75vh]">
        <table className="min-w-max w-full border-separate border-spacing-0 text-sm relative">
          <thead className="sticky top-0 z-30 shadow-sm transition-colors">
            {/* Fila de competencias */}
            <tr>
              <th className="border-b border-r border-gray-200 dark:border-gray-700 black:border-zinc-800 p-4 sticky left-0 top-0 bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 z-50 text-gray-700 dark:text-gray-200 font-bold">
                #
              </th>
              <th className="border-b border-r border-gray-200 dark:border-gray-700 black:border-zinc-800 p-4 sticky left-[50px] top-0 bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 z-50 text-gray-700 dark:text-gray-200 font-bold">
                Nombre
              </th>
              {competencias.map((comp) => {
                const numCriterios = comp.criterioevaluacion?.length || 1;
                return (
                  <th
                    key={comp.id}
                    className="border-b border-r border-gray-200 dark:border-gray-700 black:border-zinc-800 p-2 text-center bg-teal-600 dark:bg-teal-800 black:bg-teal-900 text-white font-bold"
                    colSpan={numCriterios + 1}
                  >
                    {comp.tipo ?? "Sin nombre"}
                  </th>
                );
              })}
            </tr>

            {/* Fila de criterios + columna de promedio */}
            <tr>
              <th className="sticky left-0 bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border-b border-r border-gray-200 dark:border-gray-700 black:border-zinc-800 z-50"></th>
              <th className="sticky left-[50px] bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border-b border-r border-gray-200 dark:border-gray-700 black:border-zinc-800 z-50"></th>

              {competencias.flatMap((comp) => {
                const criterios = comp.criterioevaluacion ?? [];
                if (criterios.length === 0) return [];

                const criteriosThs = criterios.map((crit) => (
                  <th
                    key={crit.id}
                    className="border-b border-r border-gray-200 dark:border-gray-700 black:border-zinc-800 p-2 text-center bg-teal-500/10 dark:bg-teal-500/5 black:bg-teal-900/20 text-teal-800 dark:text-teal-300 vertical-header relative group font-semibold"
                  >
                    {crit.nombre ?? "Sin nombre"}
                  </th>
                ));

                const promedioTh = (
                  <th
                    key={`prom-${comp.id}`}
                    className="border-b border-r border-gray-200 dark:border-gray-700 black:border-zinc-800 p-2 text-center bg-teal-50 dark:bg-teal-950/40 black:bg-teal-950 text-teal-900 dark:text-teal-400 font-extrabold vertical-header"
                  >
                    Promedio
                  </th>
                );

                return [...criteriosThs, promedioTh];
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {estudiantesOrdenados.map((est, i) => (
              <tr
                key={est.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/20 group transition-colors"
              >
                <td className="p-4 text-center sticky left-0 bg-white dark:bg-gray-900 black:bg-black z-20 border-r border-gray-100 dark:border-gray-800 flex items-center justify-center font-medium text-gray-500 dark:text-gray-400">
                  {i + 1}
                </td>
                <td className="p-4 sticky left-[50px] bg-white dark:bg-gray-900 black:bg-black z-20 border-r border-gray-100 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-200">
                  {est.nombre}
                </td>

                {competencias.flatMap((comp) => {
                  const criterios = comp.criterioevaluacion ?? [];
                  const promComp =
                    promedios[est.id]?.competencias[comp.id]?.promedio ?? 0;

                  const tds = criterios.map((crit) => {
                    const promCrit =
                      promedios[est.id]?.competencias[comp.id]?.criterios[crit.id]
                        ?.promedio ?? 0;
                    return (
                      <td
                        key={`est-${est.id}-crit-${crit.id}`}
                        className="px-4 py-3 text-center border-r border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400"
                      >
                        {promCrit}
                      </td>
                    );
                  });

                  // Columna de promedio de competencia
                  tds.push(
                    <td
                      key={`prom-est-${est.id}-comp-${comp.id}`}
                      className="px-4 py-3 text-center font-bold bg-teal-50/30 dark:bg-teal-900/10 black:bg-teal-900/20 text-teal-700 dark:text-teal-400 border-r border-gray-100 dark:border-gray-800"
                    >
                      {promComp}
                    </td>
                  );

                  return tds;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .vertical-header {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          white-space: nowrap;
          padding: 8px 4px;
          min-height: 120px;
          width: 45px;
          vertical-align: bottom;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default TablaCalificacionesParciales;
