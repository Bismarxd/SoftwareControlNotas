"use client";

import React, { useEffect, useState, useMemo } from "react";
import SidebarLayout from "@/components/Sidebar/SidebarLayout";
import {
  Semestre,
  Asignaturas,
  Objetivo,
  Estrategia,
  Recursos,
  Competencia,
} from "@/types/semestre";
import axios from "axios";
import { Loader2, Target, Lightbulb, BookOpen, FileText } from "lucide-react";
import { Disclosure } from "@headlessui/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Helper para localStorage
const getLocalStorageItem = <T,>(key: string): T | null => {
  const item = localStorage.getItem(key);
  if (!item) return null;
  try {
    return JSON.parse(item) as T;
  } catch {
    return null;
  }
};

// Componente principal

const InfoGeneral = () => {
  const [asignatura, setAsignatura] = useState<Asignaturas | null>(null);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [estrategias, setEstrategias] = useState<Estrategia[]>([]);
  const [recursos, setRecursos] = useState<Recursos[]>([]);
  const [contenido, setContenido] = useState<[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const semestreSeleccionado = getLocalStorageItem<Semestre>(
      "semestreSeleccionado"
    );
    const materiaSeleccionada = getLocalStorageItem<number>(
      "materiaSeleccionada"
    );
    if (!semestreSeleccionado || !materiaSeleccionada) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          asignaturaRes,
          objetivosRes,
          estrategiasRes,
          recursosRes,
          contenidoRes,
        ] = await Promise.all([
          axios.get(
            `/api/asignaturas/materiaSeleccionada/${semestreSeleccionado.id}`
          ),
          axios.get(
            `/api/asignaturas/objetivos?asignaturaId=${materiaSeleccionada}`
          ),
          axios.get(
            `/api/asignaturas/estrategias?asignaturaId=${materiaSeleccionada}`
          ),
          axios.get(
            `/api/asignaturas/recursos?asignaturaId=${materiaSeleccionada}`
          ),
          axios.get(
            `/api/asignaturas/contenido?asignaturaId=${materiaSeleccionada}`
          ),
        ]);

        if (asignaturaRes.data.status)
          setAsignatura(asignaturaRes.data.asignaturaSeleccionada);
        if (objetivosRes.data.status) setObjetivos(objetivosRes.data.objetivos);
        if (estrategiasRes.data.status)
          setEstrategias(estrategiasRes.data.estrategias);
        if (recursosRes.data.status) setRecursos(recursosRes.data.recursos);
        if (contenidoRes.data.status)
          setContenido(contenidoRes.data.contenido || []);
      } catch (error) {
        console.error("Error al obtener datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalHoras = useMemo(() => {
    if (!asignatura) return 0;
    return (
      Number(asignatura.hp || 0) +
      Number(asignatura.hc || 0) +
      Number(asignatura.haa || 0) +
      Number(asignatura.he || 0) +
      Number(asignatura.hip || 0)
    );
  }, [asignatura]);

  if (loading) return <Loading />;
  if (!asignatura) return <EmptyState />;

  //Para exportar en pdf
  const cleanHTML = (html: string) => {
    if (!html) return "";
    let text = html;
    // reemplaza <br> por salto de línea
    text = text.replace(/<br\s*\/?>/gi, "\n");
    // reemplaza <p> y </p> por salto de línea
    text = text.replace(/<p[^>]*>/gi, "");
    text = text.replace(/<\/p>/gi, "\n");
    // elimina cualquier otra etiqueta
    text = text.replace(/<\/?[^>]+(>|$)/g, "");
    // normaliza saltos de línea
    text = text.replace(/\n\s*\n/g, "\n").trim();
    return text;
  };

  const exportarPDF = () => {
    if (!asignatura) return;

    const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 40;
    const maxWidth = pageWidth - marginX * 2; // ancho máximo de contenido
    let y = 40;

    // --------- Cabecera  ---------
    doc.setFillColor(0, 90, 160);
    doc.rect(marginX - 10, y - 10, maxWidth, 30, "F");
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`Asignatura: ${asignatura.nombre}`, marginX, y + 10);
    y += 40;

    // Información secundaria
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");

    const info = [
      ["Sigla:", asignatura.sigla],
      ["Nivel:", asignatura.nivel],
      ["Créditos:", asignatura.creditos.toString()],
      ["Área:", asignatura.area],
      ["Prerequisito:", asignatura.prerequisito || "Ninguno"],
    ];

    info.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, marginX, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, marginX + 100, y, { maxWidth: maxWidth - 100 });
      y += 15;
    });

    // Justificación
    const justificacion = cleanHTML(asignatura.justificacion || "N/A");
    const splitJust = doc.splitTextToSize(justificacion, maxWidth);
    doc.setFont("helvetica", "bold");
    doc.text("Justificación:", marginX, y);
    y += 15;
    doc.setFont("helvetica", "normal");
    doc.rect(marginX - 5, y - 5, maxWidth, splitJust.length * 12 + 10, "S");
    doc.text(splitJust, marginX, y);
    y += splitJust.length * 12 + 15;

    // --------- Tabla Horas ---------
    autoTable(doc, {
      startY: y,
      head: [["Tipo de Hora", "Cantidad"]],
      body: [
        ["HP", asignatura.hp || 0],
        ["HC", asignatura.hc || 0],
        ["HAA", asignatura.haa || 0],
        ["HE", asignatura.he || 0],
        ["HIP", asignatura.hip || 0],
      ],
      theme: "grid",
      headStyles: { fillColor: [0, 90, 160], textColor: 255 },
      styles: { fontSize: 11, cellWidth: "wrap" },
      margin: { left: marginX, right: marginX },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: maxWidth - 100 },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 15;

    // --------- Función de sección ---------
    const addSectionTable = (
      title: string,
      data: { tipo: string; descripcion: string }[]
    ) => {
      if (!data.length) return;

      doc.setFontSize(14);
      doc.setTextColor(0, 90, 160);
      doc.text(title, marginX, y);
      y += 10;

      autoTable(doc, {
        startY: y,
        head: [["Tipo", "Descripción"]],
        body: data.map((item) => [item.tipo, cleanHTML(item.descripcion)]),
        theme: "grid",
        headStyles: {
          fillColor: [0, 90, 160],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: { fontSize: 11, cellPadding: 3, overflow: "linebreak" },
        margin: { left: marginX, right: marginX },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: maxWidth - 100 },
        },
        didDrawPage: (dataArg) => {
          if (dataArg.cursor) y = dataArg.cursor.y + 10;
        },
      });
      y += 10;
    };

    addSectionTable("Objetivos", objetivos);
    addSectionTable("Estrategias", estrategias);
    addSectionTable("Recursos", recursos);
    addSectionTable("Contenido", contenido);

    // --------- Competencias ---------
    if (asignatura.competencia?.length) {
      doc.setFontSize(16);
      doc.setTextColor(0, 90, 160);
      doc.setFont("helvetica", "bold");
      doc.text("Competencias", marginX, y);
      y += 15;

      asignatura.competencia.forEach((comp, ci) => {
        const compText = cleanHTML(
          `${ci + 1}. ${comp.tipo} - ${comp.descripcion}`
        );
        const splitCompText = doc.splitTextToSize(compText, maxWidth);
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text(splitCompText, marginX + 5, y);
        y += splitCompText.length * 14;

        if (comp.criterioevaluacion?.length) {
          const cuerpo: string[][] = [];
          comp.criterioevaluacion.forEach((crit) => {
            const critDesc = cleanHTML(crit.nombre);
            const critPorc = crit.porcentaje + "%";
            if (crit.evidencia?.length) {
              crit.evidencia.forEach((ev) => {
                cuerpo.push([
                  critDesc,
                  `• ${cleanHTML(ev.nombre || ev.tipo)} (${critPorc})`,
                ]);
              });
            } else {
              cuerpo.push([critDesc, critPorc]);
            }
          });

          autoTable(doc, {
            startY: y,
            head: [["Criterio", "Evidencia"]],
            body: cuerpo,
            theme: "grid",
            headStyles: {
              fillColor: [0, 120, 200],
              textColor: 255,
              fontStyle: "bold",
            },
            styles: {
              fontSize: 10,
              cellPadding: 4,
              textColor: [30, 30, 30],
              overflow: "linebreak",
            },
            margin: { left: marginX, right: marginX },
            columnStyles: {
              0: { cellWidth: 150 },
              1: { cellWidth: maxWidth - 150 },
            },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            didDrawPage: (dataArg) => {
              if (dataArg.cursor) y = dataArg.cursor.y + 10;
            },
          });
          y += 10;
        }

        if (y > 750) {
          doc.addPage();
          y = 40;
        }
      });
    }

    doc.save(`${asignatura.nombre}_informe.pdf`);
  };

  return (
    <SidebarLayout>
      <div className="p-6 md:p-10 space-y-12">
        {/* Botón para exportar PDF */}
        <div className="flex justify-end mb-4">
          <button
            onClick={exportarPDF}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition hover:cursor-pointer"
          >
            <FileText className="w-5 h-5" />
            Exportar PDF
          </button>
        </div>
        {/* Tarjetas resumen */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          <ResumenCard
            label="Objetivos"
            value={objetivos.length}
            color="blue"
            icon={<Target className="w-5 h-5 text-blue-600" />}
          />
          <ResumenCard
            label="Estrategias"
            value={estrategias.length}
            color="yellow"
            icon={<Lightbulb className="w-5 h-5 text-amber-600" />}
          />
          <ResumenCard
            label="Recursos"
            value={recursos.length}
            color="green"
            icon={<BookOpen className="w-5 h-5 text-green-600" />}
          />
        </div>

        {/* Asignatura principal */}
        <AsignaturaCard asignatura={asignatura} totalHoras={totalHoras} />

        {/* Secciones con acordeón */}
        <SectionCard
          title="Objetivos"
          icon={<Target className="w-6 h-6 text-blue-600 " />}
          data={objetivos}
        />
        <SectionCard
          title="Estrategias"
          icon={<Lightbulb className="w-6 h-6 text-amber-600" />}
          data={estrategias}
        />
        <SectionCard
          title="Recursos"
          icon={<BookOpen className="w-6 h-6 text-green-600" />}
          data={recursos}
        />
        {/* Contenido */}
        {contenido && contenido.length > 0 && (
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-4 border-b pb-2">
              <FileText className="w-6 h-6 text-teal-600" />
              <h3 className="text-2xl font-semibold text-gray-800">
                Contenido
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contenido.map((item: any, index) => (
                <div
                  key={index}
                  className="bg-gray-50/80 p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                >
                  <h4 className="font-semibold text-lg text-gray-800 mb-2">
                    {item.tipo}: {item.titulo}
                  </h4>
                  <p
                    className="text-gray-600 text-sm"
                    dangerouslySetInnerHTML={{ __html: item.descripcion }}
                  />
                  {item.recursoUrl && (
                    <a
                      href={item.recursoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-teal-600 hover:underline text-sm"
                    >
                      Ver recurso
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {asignatura.competencia && asignatura.competencia.length > 0 && (
        <div className="max-w-6xl mx-auto bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-gray-200">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3">
            <h3 className="text-2xl font-bold text-teal-700">Competencias</h3>
          </div>

          {asignatura.competencia.map((comp, ci) => (
            <div
              key={ci}
              className="mb-6 p-4 rounded-2xl bg-gray-50/80 border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              <h4
                className="font-semibold text-lg mb-3 text-gray-800"
                dangerouslySetInnerHTML={{
                  __html: `${ci + 1}. ${comp.tipo} - ${comp.descripcion}`,
                }}
              ></h4>

              {comp.criterioevaluacion && comp.criterioevaluacion.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="bg-teal-100">
                      <tr>
                        <th className="border-b px-4 py-2 text-left font-medium text-gray-700">
                          Criterio
                        </th>
                        <th className="border-b px-4 py-2 text-left font-medium text-gray-700">
                          Evidencias
                        </th>
                        <th className="border-b px-4 py-2 text-center font-medium text-gray-700">
                          Porcentaje
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {comp.criterioevaluacion.map((crit, ci2) => (
                        <tr
                          key={ci2}
                          className="even:bg-gray-100 hover:bg-teal-50 transition-colors"
                        >
                          <td className="border px-4 py-2">{crit.nombre}</td>
                          <td className="border px-4 py-2">
                            {crit.evidencia && crit.evidencia.length > 0 ? (
                              <ul className="list-disc pl-5 space-y-1">
                                {crit.evidencia.map((ev, ei) => (
                                  <li key={ei}>{ev.nombre || ev.tipo}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-gray-400 italic">-</span>
                            )}
                          </td>
                          <td className="border px-4 py-2 text-center font-semibold text-gray-700">
                            {crit.porcentaje}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 italic mt-2">
                  No hay criterios registrados.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </SidebarLayout>
  );
};

export default InfoGeneral;

// COMPONENTES AUXILIARES

const Loading = () => (
  <div className="flex justify-center items-center h-96 text-gray-600">
    <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando información...
  </div>
);

const EmptyState = () => (
  <p className="text-gray-500 text-center text-lg">
    No se encontró información de la asignatura.
  </p>
);

const ResumenCard = ({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) => (
  <div
    className={`flex items-center justify-between p-4 bg-${color}-100 rounded-xl shadow hover:shadow-lg transition`}
  >
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-gray-700 font-semibold">{label}</span>
    </div>
    <span className={`text-${color}-700 font-bold text-xl`}>{value}</span>
  </div>
);

const HourCard = ({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) => {
  const widthPercent = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="text-sm font-semibold text-gray-700 text-center">
        {label}
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full">
        <div
          className={`h-3 rounded-full bg-${color}-500 transition-all duration-500`}
          style={{ width: `${widthPercent}%` }}
        ></div>
      </div>
      <div className="text-center text-xs text-gray-600">{value}</div>
    </div>
  );
};

const AsignaturaCard = ({
  asignatura,
  totalHoras,
}: {
  asignatura: Asignaturas;
  totalHoras: number;
}) => (
  <div className="relative max-w-5xl mx-auto bg-gradient-to-r from-blue-100 to-indigo-100 rounded-3xl shadow-xl overflow-hidden">
    <div className="grid md:grid-cols-2">
      <div className="p-8 md:p-10 bg-cyan-700">
        <h2 className="text-3xl font-bold text-gray-100">
          {asignatura.nombre}
        </h2>
        <p className="text-gray-200 mt-2 text-lg">{asignatura.sigla}</p>
        <p className="text-gray-300 mt-1 text-md">{asignatura.nivel}</p>
      </div>

      <div className="p-8 md:p-10 bg-white">
        <h3 className="font-semibold text-gray-800 mb-3 text-lg">Detalles:</h3>
        <ul className="text-gray-700 text-base space-y-1">
          <li>
            <strong>Área:</strong> {asignatura.area}
          </li>
          <li>
            <strong>Créditos:</strong> {asignatura.creditos}
          </li>
          <li>
            <strong>Prerequisito:</strong>{" "}
            {asignatura.prerequisito || "Ninguno"}
          </li>
          <li>
            <strong>Justificación:</strong> {asignatura.justificacion || "N/A"}
          </li>
          <li>
            <strong>Creado:</strong>{" "}
            {new Date(asignatura.createdAt).toLocaleDateString()}
          </li>
        </ul>

        <h3 className="font-semibold text-gray-800 mt-5 mb-3 text-lg">
          Horas:
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <HourCard
            label="HP"
            value={Number(asignatura.hp)}
            total={totalHoras}
            color="green"
          />
          <HourCard
            label="HC"
            value={Number(asignatura.hc)}
            total={totalHoras}
            color="blue"
          />
          <HourCard
            label="HAA"
            value={Number(asignatura.haa)}
            total={totalHoras}
            color="purple"
          />
          <HourCard
            label="HE"
            value={Number(asignatura.he)}
            total={totalHoras}
            color="yellow"
          />
          <HourCard
            label="HIP"
            value={Number(asignatura.hip)}
            total={totalHoras}
            color="pink"
          />
        </div>
      </div>
    </div>
  </div>
);

const SectionCard = ({
  title,
  icon,
  data,
}: {
  title: string;
  icon: React.ReactNode;
  data: { tipo: string; descripcion: string }[];
}) => (
  <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
    <div className="flex items-center gap-2 mb-4 border-b pb-2">
      {icon}
      <h3 className="text-2xl font-semibold text-gray-800">{title}</h3>
    </div>

    {data.length === 0 ? (
      <p className="text-gray-500 italic text-center">
        No hay {title.toLowerCase()} registrados.
      </p>
    ) : (
      <div className="space-y-3">
        {data.map((item, index) => (
          <Disclosure key={index}>
            {({ open }) => (
              <>
                <Disclosure.Button className="w-full text-left p-3 bg-gray-50 rounded-lg flex justify-between items-center hover:bg-gray-100 transition hover:cursor-pointer">
                  <span className="font-semibold">{item.tipo}</span>
                  <span>{open ? "-" : "+"}</span>
                </Disclosure.Button>
                <Disclosure.Panel
                  className="p-3 text-gray-600 border-l-2 border-gray-200 rounded-b-lg"
                  dangerouslySetInnerHTML={{ __html: item.descripcion }}
                />
              </>
            )}
          </Disclosure>
        ))}
      </div>
    )}
  </div>
);
