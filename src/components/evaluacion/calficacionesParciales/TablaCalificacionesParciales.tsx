import { Asignaturas, Competencia, Estudiante } from "@/types/semestre";
import { FileSpreadsheet, FileText } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

interface PromedioEvidencia {
  nombre: string;
  promedio: number;
}

interface PromedioCriterio {
  nombre: string;
  promedio: number;
  evidencias: { [evId: number]: PromedioEvidencia };
}

interface PromedioCompetencia {
  nombre: string;
  promedio: number;
  criterios: { [critId: number]: PromedioCriterio };
}

interface PromediosPorEstudiante {
  [estId: number]: {
    nombre: string;
    competencias: { [compId: number]: PromedioCompetencia };
  };
}

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
    <div className="border rounded-lg shadow-sm overflow-auto max-h-[600px]">
      <div className="flex gap-2 mb-2 p-3">
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
      <table className="min-w-max w-full border-collapse text-sm relative">
        <thead className="bg-teal-600 text-white sticky top-0 z-30">
          {/* Fila de competencias */}
          <tr>
            <th className="border px-4 py-2 sticky left-0 bg-teal-600 z-40">
              #
            </th>
            <th className="border px-4 py-2 sticky left-[50px] bg-teal-600 z-40">
              Nombre
            </th>
            {competencias.map((comp) => {
              const numCriterios = comp.criterioevaluacion?.length || 1;
              return (
                <th
                  key={comp.id}
                  className="border px-2 py-2 text-center"
                  colSpan={numCriterios + 1} // +1 para la columna de promedio
                >
                  {comp.tipo ?? "Sin nombre"}
                </th>
              );
            })}
          </tr>

          {/* Fila de criterios + columna de promedio */}
          <tr>
            <th className="border px-4 py-2 sticky left-0 bg-teal-600 z-40"></th>
            <th className="border px-4 py-2 sticky left-[50px] bg-teal-600 z-40"></th>

            {competencias.flatMap((comp) => {
              const criterios = comp.criterioevaluacion ?? [];
              if (criterios.length === 0) return [];

              const criteriosThs = criterios.map((crit) => (
                <th
                  key={crit.id}
                  className="border px-2 py-2 text-center bg-teal-800 vertical-header relative group"
                >
                  {crit.nombre ?? "Sin nombre"}
                </th>
              ));

              const promedioTh = (
                <th
                  key={`prom-${comp.id}`}
                  className="border px-2 py-2 text-center bg-cyan-700 font-bold vertical-header"
                >
                  Promedio
                </th>
              );

              return [...criteriosThs, promedioTh];
            })}
          </tr>
        </thead>

        <tbody>
          {estudiantesOrdenados.map((est, i) => (
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
                      className="border px-2 py-2 text-center"
                    >
                      {promCrit}
                    </td>
                  );
                });

                // Columna de promedio de competencia
                tds.push(
                  <td
                    key={`prom-est-${est.id}-comp-${comp.id}`}
                    className="border px-2 py-2 text-center font-bold bg-gray-100"
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

      <style jsx>{`
        .vertical-header {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          white-space: nowrap;
          padding: 4px;
          min-height: 100px;
          width: auto;
          vertical-align: bottom;
          text-align: center;
          font-weight: 600;
        }
        table th,
        table td {
          border: 1px solid #d1d5db;
        }
      `}</style>
    </div>
  );
};

export default TablaCalificacionesParciales;
