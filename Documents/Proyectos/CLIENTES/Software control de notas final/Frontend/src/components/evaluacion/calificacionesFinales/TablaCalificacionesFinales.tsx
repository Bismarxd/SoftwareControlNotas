"use client";

import { Asignaturas, Competencia, Estudiante } from "@/types/semestre";
import { FileSpreadsheet, FileText, Pencil } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useAlert } from "@/components/ui/Alert";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

interface PromediosFinales {
  [estId: number]: {
    nombre: string;
    competencias: { [compId: number]: number };
    promedioFinal: number;
    notaSegundoTurno: number;
  };
}

interface Props {
  estudiantes: Estudiante[];
  competencias: Competencia[];
  promedios: PromediosFinales;
  setPromedios: React.Dispatch<React.SetStateAction<PromediosFinales>>;
}

const TablaCalificacionesFinales: React.FC<Props> = ({
  estudiantes,
  competencias,
  promedios,
  setPromedios,
}) => {
  console.log(promedios);
  /* const [editableFinal, setEditableFinal] = useState<Record<number, boolean>>(
    {}
  ); */
  const [editableSegundo, setEditableSegundo] = useState<
    Record<number, boolean>
  >({});

  const { showAlert } = useAlert();
  const [editableCells, setEditableCells] = useState<Record<string, boolean>>(
    {}
  );

  const [busqueda, setBusqueda] = useState("");
  const [inputPorcentajeFinal, setInputPorcentajeFinal] = useState<
    Record<number, number>
  >({});
  const [inputPorcentajeSegundoTurno, setInputPorcentajeSegundoTurno] =
    useState<Record<number, number>>({});

  //Para obtener las materias
  const [materia, setMateria] = useState<Asignaturas | null>(null);
  useEffect(() => {
    const materiaJSON = localStorage.getItem("materia");

    if (materiaJSON) {
      const materia = JSON.parse(materiaJSON);

      setMateria(materia);
    }
  }, []);

  const estudiantesFiltrados = useMemo(() => {
    return estudiantes
      .filter((est) =>
        est.nombre.toLowerCase().includes(busqueda.toLowerCase())
      )
      .sort((a, b) =>
        a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
      );
  }, [estudiantes, busqueda]);

  //Para editar las celdas
  const toggleEditable = (estudianteId: number) => {
    setEditableCells((prev) => ({
      ...prev,
      [estudianteId]: !prev[estudianteId],
    }));
  };

  const isEditable = (estudianteId: number) => {
    return editableCells[estudianteId] ?? false;
  };

  //Para guardar la nota final
  const guardarNota = async () => {
    try {
      const updates = Object.keys(editableCells)
        .filter((estId) => editableCells[Number(estId)])
        .map(Number);

      for (const estId of updates) {
        const notaFinal =
          inputPorcentajeFinal[estId] ?? promedios[estId]?.promedioFinal ?? 0;
        // Llamada a tu API
        await axios.post("/api/evaluacion/promedioParcial", {
          estudianteId: estId,
          asignaturaId: competencias[0]?.asignaturaId ?? 0,
          tipo: "final",
          promedio: notaFinal,
          competenciaId: null,
          criterioId: null,
          evidenciaId: null,
        });

        // Actualizar el estado local
        setPromedios((prev) => ({
          ...prev,
          [estId]: {
            ...prev[estId],
            promedioFinal: Number(notaFinal),
          },
        }));

        // Desactivar edición
        setEditableCells((prev) => ({
          ...prev,
          [estId]: false,
        }));
      }

      showAlert("Nota final guardada correctamente!", "success");
    } catch (error) {
      console.error("Error guardando notas finales:", error);
      alert("Ocurrió un error al guardar las notas.");
    }
  };

  //Para guardar la nota del segundo turno
  const guardarSegundoTurno = async () => {
    try {
      const updates = Object.keys(editableSegundo)
        .filter((id) => editableSegundo[Number(id)])
        .map(Number);

      for (const estId of updates) {
        const notaSegundoTurno =
          inputPorcentajeSegundoTurno[estId] ??
          promedios[estId]?.notaSegundoTurno ??
          0;

        await axios.post("/api/evaluacion/promedioParcial", {
          estudianteId: estId,
          asignaturaId: competencias[0]?.asignaturaId ?? 0,
          tipo: "segundoTurno",
          promedio: notaSegundoTurno,
        });

        const nuevoFinal = promedios[estId].promedioFinal + notaSegundoTurno;

        await axios.post("/api/evaluacion/promedioParcial", {
          estudianteId: estId,
          asignaturaId: competencias[0]?.asignaturaId ?? 0,
          tipo: "final",
          promedio: nuevoFinal,
        });

        // Actualizar estado correctamente
        setPromedios((prev) => ({
          ...prev,
          [estId]: {
            ...prev[estId],
            notaSegundoTurno,
            promedioFinal: nuevoFinal,
          },
        }));

        // Desactivar SOLO este input
        setEditableSegundo((prev) => ({
          ...prev,
          [estId]: false,
        }));
      }

      showAlert("Nota de Segundo Turno guardada!", "success");
    } catch (error) {
      console.error("Error guardando segundo turno:", error);
      alert("Ocurrió un error al guardar la nota de segundo turno.");
    }
  };
  const exportarPDF = () => {
    const doc = new jsPDF("l", "pt", "a4");

    // TÍTULO
    doc.setFontSize(18);
    doc.setTextColor(5, 0, 77);
    doc.text(materia?.nombre + "- Calificaciones Finales", 40, 40);

    doc.setFontSize(12);
    doc.text("Reporte de las Calificacione Finales", 40, 60);

    // -----------------------------
    // ENCABEZADOS
    // -----------------------------
    const head = [
      [
        { content: "#", rowSpan: 1 },
        { content: "Nombre", rowSpan: 1 },
        ...competencias.map((comp) => ({
          content: comp.tipo,
        })),
        { content: "Asistencia %" },
        { content: "Nota Final" },
        { content: "Estado" },
        { content: "Segundo Turno" },
      ],
    ];

    // -----------------------------
    // CUERPO
    // -----------------------------
    const body = estudiantesFiltrados.map((est, index) => {
      const fila = [];

      // #
      fila.push(index + 1);

      // Nombre
      fila.push(est.nombre);

      // Competencias
      competencias.forEach((comp) => {
        const nota =
          promedios[est.id]?.competencias?.[comp.id] !== undefined
            ? promedios[est.id].competencias[comp.id]
            : 0;

        fila.push(nota);
      });

      // Asistencia
      const asistencia = est.porcentajeAsistencia
        ? Number(est.porcentajeAsistencia).toFixed(2)
        : "0.00";

      fila.push(asistencia + "%");

      // Nota Final
      fila.push(promedios[est.id]?.promedioFinal ?? 0);

      // Estado
      const estado =
        promedios[est.id]?.promedioFinal >= 51
          ? "Aprobado"
          : promedios[est.id]?.promedioFinal >= 40
          ? "Segundo Turno"
          : "Reprobado";

      fila.push(estado);

      // Nota Segundo Turno
      fila.push(promedios[est.id]?.notaSegundoTurno ?? "");

      return fila;
    });

    // -----------------------------
    // GENERAR LA TABLA
    // -----------------------------
    autoTable(doc, {
      head: head,
      body: body,
      startY: 80,
      theme: "grid",
      styles: { fontSize: 8, halign: "center", valign: "middle" },
      headStyles: { fillColor: [0, 77, 77], textColor: 255 },
      margin: { left: 20, right: 20 },
    });

    // -----------------------------
    // GUARDAR
    // -----------------------------
    doc.save(`Calificaciones_Finales.pdf`);
  };

  const exportarExcel = async () => {
    if (!competencias || !estudiantesFiltrados || !promedios) return;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(materia?.nombre + "- Calificaciones Finales");

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
    ws.addRow([materia?.nombre + "- Calificaciones Finales"]);
    ws.addRow(["Reporte generado automáticamente"]);
    ws.addRow([]);

    // ======= FILA DE ENCABEZADOS =======
    const fila = ws.addRow([]);
    let col = 1;

    // #
    ws.mergeCells(4, col, 5, col);
    fila.getCell(col).value = "#";
    fila.getCell(col).style = headerStyle as any as any;
    col++;

    // Nombre
    ws.mergeCells(4, col, 5, col);
    fila.getCell(col).value = "Nombre";
    fila.getCell(col).style = headerStyle as any;
    col++;

    // Competencias
    competencias.forEach((comp) => {
      ws.getRow(4).getCell(col).value = comp.tipo;
      ws.getRow(4).getCell(col).style = headerStyle as any;

      // No hay subcriterios en tu tabla actual, así que solo una columna por competencia
      ws.getRow(5).getCell(col).value = "Nota";
      ws.getRow(5).getCell(col).style = headerStyle as any;

      col++;
    });

    // Asistencia %
    ws.mergeCells(4, col, 5, col);
    ws.getRow(4).getCell(col).value = "Asistencia %";
    ws.getRow(4).getCell(col).style = headerStyle as any;
    col++;

    // Nota Final
    ws.mergeCells(4, col, 5, col);
    ws.getRow(4).getCell(col).value = "Nota Final";
    ws.getRow(4).getCell(col).style = headerStyle as any;
    col++;

    // Estado
    ws.mergeCells(4, col, 5, col);
    ws.getRow(4).getCell(col).value = "Estado";
    ws.getRow(4).getCell(col).style = headerStyle as any;
    col++;

    // Segundo Turno
    ws.mergeCells(4, col, 5, col);
    ws.getRow(4).getCell(col).value = "Segundo Turno";
    ws.getRow(4).getCell(col).style = headerStyle as any;
    col++;

    // ========= CUERPO DE LA TABLA =========
    estudiantesFiltrados.forEach((est, index) => {
      const filaDatos: any[] = [index + 1, est.nombre];

      // Competencias
      competencias.forEach((comp) => {
        filaDatos.push(promedios[est.id]?.competencias?.[comp.id] ?? 0);
      });

      // Asistencia %
      filaDatos.push(
        est.porcentajeAsistencia
          ? Number(est.porcentajeAsistencia).toFixed(2) + "%"
          : "0.00%"
      );

      // Nota Final
      filaDatos.push(promedios[est.id]?.promedioFinal ?? 0);

      // Estado
      const estado =
        promedios[est.id]?.promedioFinal >= 51
          ? "Aprobado"
          : promedios[est.id]?.promedioFinal >= 40
          ? "Segundo Turno"
          : "Reprobado";
      filaDatos.push(estado);

      // Segundo Turno
      filaDatos.push(promedios[est.id]?.notaSegundoTurno ?? "");

      const row = ws.addRow(filaDatos);
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
    link.download = `Calificaciones_Finales.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="overflow-hidden">
      <div className="flex flex-wrap gap-3 mb-4 p-4 border-b border-gray-100 dark:border-gray-800">
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
        
        <div className="flex-grow">
          <input
            type="text"
            placeholder="Buscar estudiante..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full max-w-xs bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all dark:text-gray-200"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 black:bg-zinc-900/50 border-b border-gray-200 dark:border-gray-700">
              <th className="px-4 py-4 text-center font-bold text-gray-700 dark:text-gray-200">#</th>
              <th className="px-4 py-4 text-left font-bold text-gray-700 dark:text-gray-200">Estudiante</th>
              {competencias.map((comp) => (
                <th key={comp.id} className="px-4 py-4 text-center font-bold text-gray-700 dark:text-gray-200">
                  {comp.tipo}
                </th>
              ))}
              <th className="px-4 py-4 text-center font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">Asistencia %</th>
              <th className="px-4 py-4 text-center font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">Nota Final</th>
              <th className="px-4 py-4 text-center font-bold text-gray-700 dark:text-gray-200">Estado</th>
              <th className="px-4 py-4 text-center font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">Segundo Turno</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {estudiantesFiltrados.map((est, i) => {
              const promComp = promedios[est.id]?.competencias || {};
              const promFinal = promedios[est.id]?.promedioFinal ?? 0;
              const asis = est.porcentajeAsistencia ? Number(est.porcentajeAsistencia) : 0;
              const notaST = promedios[est.id]?.notaSegundoTurno ?? 0;
              
              const aprobado = promFinal >= 51;
              const enSegundoTurno = promFinal < 51 && promFinal >= 40;

              return (
                <tr key={est.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-4 text-center text-gray-500 dark:text-gray-400 font-medium">{i + 1}</td>
                  <td className="px-4 py-4 text-gray-800 dark:text-gray-200 font-semibold">{est.nombre}</td>
                  
                  {competencias.map((comp) => (
                    <td key={comp.id} className="px-4 py-4 text-center text-gray-600 dark:text-gray-400">
                      {promComp[comp.id] ?? 0}
                    </td>
                  ))}

                  <td className="px-4 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      asis >= 75 
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" 
                      : "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300"
                    }`}>
                      {asis.toFixed(2)}%
                    </span>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {isEditable(est.id) ? (
                        <input
                          type="number"
                          autoFocus
                          className="w-16 bg-white dark:bg-gray-800 border border-teal-500 rounded px-2 py-1 text-center outline-none dark:text-white"
                          value={inputPorcentajeFinal[est.id] ?? promFinal}
                          onChange={(e) => setInputPorcentajeFinal(prev => ({ ...prev, [est.id]: Number(e.target.value) }))}
                          onKeyDown={(e) => e.key === "Enter" && guardarNota()}
                        />
                      ) : (
                        <span className={`text-lg font-black ${aprobado ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                          {promFinal}
                        </span>
                      )}
                      <button 
                        onClick={() => toggleEditable(est.id)}
                        className="p-1 text-gray-400 hover:text-teal-500 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-sm font-black uppercase tracking-wider ${
                      aprobado 
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" 
                      : enSegundoTurno
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                      : "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300"
                    }`}>
                      {aprobado ? "Aprobado" : enSegundoTurno ? "2do Turno" : "Reprobado"}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {(enSegundoTurno || notaST > 0) && (
                        <>
                          {editableSegundo[est.id] ? (
                            <input
                              type="number"
                              autoFocus
                              className="w-16 bg-white dark:bg-gray-800 border border-teal-500 rounded px-2 py-1 text-center outline-none dark:text-white"
                              value={inputPorcentajeSegundoTurno[est.id] ?? notaST}
                              onChange={(e) => setInputPorcentajeSegundoTurno(prev => ({ ...prev, [est.id]: Number(e.target.value) }))}
                              onKeyDown={(e) => e.key === "Enter" && guardarSegundoTurno()}
                            />
                          ) : (
                            <span className="font-bold text-gray-700 dark:text-gray-300">
                              {notaST || "-"}
                            </span>
                          )}
                          <button 
                            onClick={() => setEditableSegundo(prev => ({ ...prev, [est.id]: !prev[est.id] }))}
                            className="p-1 text-gray-400 hover:text-teal-500 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablaCalificacionesFinales;
