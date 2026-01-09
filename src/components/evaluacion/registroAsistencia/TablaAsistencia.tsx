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
    <div className="overflow-x-auto border rounded-lg shadow-sm">
      <div className="flex gap-2 mb-2">
        <button
          onClick={exportarPDF}
          className="flex items-center gap-1 px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 hover:cursor-pointer"
        >
          <FileText size={16} /> PDF
        </button>
        <button
          // onClick={exportarExcel}
          className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 hover:cursor-pointer"
        >
          <FileSpreadsheet size={16} /> Excel
        </button>
      </div>
      <table className="min-w-max border-collapse text-sm">
        <thead className="bg-teal-600 text-white">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className="border px-2 py-2 text-center">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="even:bg-gray-50 hover:bg-gray-100">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border px-2 py-1 text-center">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TablaAsistencia;
