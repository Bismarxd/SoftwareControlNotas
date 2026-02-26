import React, { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";

import { Asignaturas, Clase, Estudiante } from "@/types/semestre";
import { FileSpreadsheet, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Props {
  estudiantes: Estudiante[];
  clases: Clase[];
  toggleAsistencia: (idEst: number, idClase: number, presente: boolean) => void;
}

const TablaAsistencia = ({ estudiantes, clases, toggleAsistencia }: Props) => {
  const [materia, setMateria] = useState<Asignaturas | null>(null);
  useEffect(() => {
    const materiaJSON = localStorage.getItem("materia");

    if (materiaJSON) {
      const materia = JSON.parse(materiaJSON);

      setMateria(materia);
    }
  }, []);

  const columns = useMemo<ColumnDef<Estudiante>[]>(() => {
    const base: ColumnDef<Estudiante>[] = [
      {
        header: "Estudiante",
        accessorKey: "nombre",
        cell: (info) => info.getValue(),
      },
    ];

    const colsClases = clases.map((c) => ({
      id: c.id.toString(),
      header: new Date(c.fecha).toLocaleDateString("es-BO", {
        day: "2-digit",
        month: "2-digit",
      }),
      cell: ({ row }: any) => (
        <input
          type="checkbox"
          checked={row.original.asistencias?.[c.id] || false}
          onChange={(e) =>
            toggleAsistencia(row.original.id, c.id, e.target.checked)
          }
          className="w-5 h-5 mx-auto cursor-pointer"
        />
      ),
    }));

    const colPorcentaje: ColumnDef<Estudiante> = {
      id: "porcentaje",
      header: "% Asistencia",
      cell: ({ row }: any) =>
        `${(row.original.porcentajeAsistencia ?? 0).toFixed(0)}%`,
    };

    return [...base, ...colsClases, colPorcentaje];
  }, [clases, toggleAsistencia]);

  const table = useReactTable({
    data: estudiantes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  //Para exportar en pdf
  const exportarPDF = () => {
    if (!clases || !estudiantes) return;

    const doc = new jsPDF("l", "pt", "a4");

    // ------- TÍTULO -------
    doc.setFontSize(18);
    doc.setTextColor(5, 0, 77);
    doc.text(materia?.nombre || "", 40, 40);

    doc.setFontSize(12);
    doc.text("Reporte de Asistencia", 40, 60);

    // ------- ENCABEZADOS -------
    const head = [
      [
        "#",
        "Estudiante",
        ...clases.map((c) =>
          new Date(c.fecha).toLocaleDateString("es-BO", {
            day: "2-digit",
            month: "2-digit",
          })
        ),
        "% Asistencia",
      ],
    ];

    // ------- FILAS DE ESTUDIANTES -------
    const body: any[] = [];

    estudiantes.forEach((est, index) => {
      const fila: any[] = [];

      fila.push(index + 1);
      fila.push(est.nombre);

      // asistencias por clase
      clases.forEach((cl) => {
        fila.push(est.asistencias?.[cl.id] ? "X" : "");
      });

      // porcentaje
      fila.push(`${(est.porcentajeAsistencia ?? 0).toFixed(0)}%`);

      body.push(fila);
    });

    // ------- GENERAR TABLA -------
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

    doc.save("Asistencia.pdf");
  };

  return (
    <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 black:border-zinc-900 rounded-2xl shadow-sm bg-white dark:bg-gray-900 black:bg-black">
      <div className="flex gap-3 mb-4 p-4 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={exportarPDF}
          className="flex items-center gap-2 px-4 py-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-xl hover:bg-rose-200 dark:hover:bg-rose-900/50 transition font-bold text-sm hover:cursor-pointer"
        >
          <FileText size={18} /> Exportar PDF
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition font-bold text-sm hover:cursor-pointer"
        >
          <FileSpreadsheet size={18} /> Exportar Excel
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-gray-50 dark:bg-gray-800/50 black:bg-zinc-900/50">
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="border-b border-gray-200 dark:border-gray-800 px-4 py-4 text-center font-bold text-gray-700 dark:text-gray-200"
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-3 text-center text-gray-600 dark:text-gray-400"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablaAsistencia;
