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
  const [editableFinal, setEditableFinal] = useState<Record<number, boolean>>(
    {}
  );
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
    <div className="border rounded-lg shadow-sm overflow-auto max-h-[600px]">
      {/* Buscador */}
      <div className="p-2">
        <input
          type="text"
          placeholder="Buscar estudiante..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
      {/* Exportar */}
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
          <tr>
            <th className="border px-4 py-2 sticky left-0 bg-teal-600 z-40">
              #
            </th>
            <th className="border px-4 py-2 sticky left-[50px] bg-teal-600 z-40">
              Nombre
            </th>

            {competencias.map((comp) => (
              <th key={comp.id} className="border px-4 py-2 text-center">
                {comp.tipo}
              </th>
            ))}

            <th className="border px-4 py-2 text-center bg-teal-500 font-semibold">
              Asistencia %
            </th>
            <th className="border px-4 py-2 text-center bg-teal-500 font-bold">
              Nota Final
            </th>
            <th className="border px-4 py-2 text-center bg-teal-500 font-bold">
              Estado
            </th>
            <th className="border px-4 py-2 text-center bg-teal-500 font-bold">
              Nota Segundo Turno
            </th>
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
              {/* Nombre */}
              <td className="border px-4 py-2 sticky left-[50px] bg-white z-20">
                {est.nombre}
              </td>
              {/* Calificaciones Comptencias */}
              {competencias.map((comp) => (
                <td key={comp.id} className="border px-4 py-2 text-center">
                  {promedios[est.id]?.competencias?.[comp.id] ?? 0}
                </td>
              ))}
              {/* Asistencia */}
              <td className="border px-4 py-2 text-center font-semibold text-blue-600 bg-blue-50">
                {est.porcentajeAsistencia
                  ? Number(est.porcentajeAsistencia).toFixed(2)
                  : "0.00"}
                %
              </td>
              {/* Calificacion Final */}
              <td
                className={`border px-4 py-2 text-center relative ${(() => {
                  const promedio = promedios[est.id]?.promedioFinal;
                  const notaSegundoTurno = promedios[est.id]?.notaSegundoTurno;

                  const tieneSegundoTurno =
                    notaSegundoTurno !== null && notaSegundoTurno !== 0;

                  if (promedio >= 51) {
                    return "bg-green-300";
                  }

                  // if (promedio >= 40 && promedio <= 49 && !tieneSegundoTurno) {
                  //   return "bg-yellow-300";
                  // }

                  return "bg-red-300";
                })()}`}
              >
                {" "}
                <input
                  type="number"
                  value={
                    isEditable(est.id)
                      ? inputPorcentajeFinal[est.id] ?? ""
                      : promedios[est.id]?.promedioFinal ?? ""
                  }
                  min={0}
                  max={100}
                  disabled={!isEditable(est.id)}
                  className="w-14 text-center border border-gray-500 rounded-md p-1 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  onChange={(e) =>
                    setInputPorcentajeFinal((prev) => ({
                      ...prev,
                      [est.id]: Number(e.target.value),
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      guardarNota();
                      toggleEditable(est.id);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    setEditableFinal((prev) => ({
                      ...prev,
                      [est.id]: !prev[est.id],
                    })),
                      toggleEditable(est.id);
                  }}
                >
                  <Pencil
                    size={12}
                    className="hover:text-blue-600 hover:cursor-pointer"
                  />
                </button>
              </td>
              {/* Estado */}
              <td
                className={`border px-4 py-2 text-center relative ${(() => {
                  const promedio = promedios[est.id]?.promedioFinal;
                  const notaSegundoTurno = promedios[est.id]?.notaSegundoTurno;

                  const tieneSegundoTurno =
                    notaSegundoTurno !== null && notaSegundoTurno !== 0;

                  if (promedio >= 51) {
                    return "bg-green-300";
                  }

                  // if (promedio >= 40 && promedio <= 49 && !tieneSegundoTurno) {
                  //   return "bg-yellow-300";
                  // }

                  return "bg-red-300";
                })()}`}
              >
                <h3 className="font-semibold">
                  {(() => {
                    const promedio = promedios[est.id]?.promedioFinal;
                    const notaSegundoTurno =
                      promedios[est.id]?.notaSegundoTurno;

                    const tieneSegundoTurno =
                      notaSegundoTurno !== null && notaSegundoTurno !== 0;

                    if (promedio >= 51) {
                      return "Aprobado";
                    }

                    if (
                      promedio >= 40 &&
                      promedio <= 49 &&
                      !tieneSegundoTurno
                    ) {
                      return "Segundo Turno";
                    }

                    return "Reprobado";
                  })()}
                </h3>
              </td>

              {/* Nota final Segundo turno */}
              <td className="border px-4 py-2 text-center relative">
                {(() => {
                  const promedio = promedios[est.id]?.promedioFinal;
                  const notaSegundoTurno = promedios[est.id]?.notaSegundoTurno;

                  const estaEnSegundoTurno = promedio <= 50;

                  if (!estaEnSegundoTurno && !notaSegundoTurno) return null;

                  return (
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="number"
                        value={
                          isEditable(est.id)
                            ? inputPorcentajeSegundoTurno[est.id] ?? ""
                            : notaSegundoTurno ?? ""
                        }
                        disabled={!isEditable(est.id)}
                        className="w-14 text-center border border-gray-500 rounded-md p-1 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        min={0}
                        max={100}
                        onChange={(e) =>
                          setInputPorcentajeSegundoTurno((prev) => ({
                            ...prev,
                            [est.id]: Number(e.target.value),
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            guardarSegundoTurno();
                            toggleEditable(est.id);
                          }
                        }}
                      />

                      <button
                        onClick={() => {
                          setEditableSegundo((prev) => ({
                            ...prev,
                            [est.id]: !prev[est.id],
                          }));
                          toggleEditable(est.id);
                        }}
                      >
                        <Pencil
                          size={12}
                          className="hover:text-blue-600 hover:cursor-pointer"
                        />
                      </button>
                    </div>
                  );
                })()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TablaCalificacionesFinales;
