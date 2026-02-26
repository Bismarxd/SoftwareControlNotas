"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SidebarLayout from "@/components/Sidebar/SidebarLayout";
import {
  Semestre,
  Asignaturas,
  Objetivo,
  Estrategia,
  Recursos,
} from "@/types/semestre";
import axios from "axios";
import { 
  Loader2, 
  Target, 
  Lightbulb, 
  BookOpen, 
  FileText, 
  ChevronDown, 
  Download,
  Calendar,
  Layers,
  Award,
  Hash,
  ArrowRight
} from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Helper para localStorage
const getLocalStorageItem = <T,>(key: string): T | null => {
  if (typeof window === "undefined") return null;
  const item = localStorage.getItem(key);
  if (!item) return null;
  try {
    return JSON.parse(item) as T;
  } catch {
    return null;
  }
};

const InfoGeneral = () => {
  const [asignatura, setAsignatura] = useState<Asignaturas | null>(null);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [estrategias, setEstrategias] = useState<Estrategia[]>([]);
  const [recursos, setRecursos] = useState<Recursos[]>([]);
  const [contenido, setContenido] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const semestreSeleccionado = getLocalStorageItem<Semestre>("semestreSeleccionado");
    const materiaSeleccionada = getLocalStorageItem<number>("materiaSeleccionada");
    
    if (!semestreSeleccionado || !materiaSeleccionada) {
      setLoading(false);
      return;
    }

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
          axios.get(`/api/asignaturas/materiaSeleccionada/${semestreSeleccionado.id}`),
          axios.get(`/api/asignaturas/objetivos?asignaturaId=${materiaSeleccionada}`),
          axios.get(`/api/asignaturas/estrategias?asignaturaId=${materiaSeleccionada}`),
          axios.get(`/api/asignaturas/recursos?asignaturaId=${materiaSeleccionada}`),
          axios.get(`/api/asignaturas/contenido?asignaturaId=${materiaSeleccionada}`),
        ]);

        if (asignaturaRes.data.status) setAsignatura(asignaturaRes.data.asignaturaSeleccionada);
        if (objetivosRes.data.status) setObjetivos(objetivosRes.data.objetivos);
        if (estrategiasRes.data.status) setEstrategias(estrategiasRes.data.estrategias);
        if (recursosRes.data.status) setRecursos(recursosRes.data.recursos);
        if (contenidoRes.data.status) setContenido(contenidoRes.data.contenido || []);
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

  const cleanHTML = (html: string) => {
    if (!html) return "";
    let text = html;
    text = text.replace(/<br\s*\/?>/gi, "\n");
    text = text.replace(/<p[^>]*>/gi, "");
    text = text.replace(/<\/p>/gi, "\n");
    text = text.replace(/<\/?[^>]+(>|$)/g, "");
    text = text.replace(/\n\s*\n/g, "\n").trim();
    return text;
  };

  const exportarPDF = () => {
    if (!asignatura) return;

    const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 40;
    const maxWidth = pageWidth - marginX * 2;
    let y = 40;

    // Cabecera Premium
    doc.setFillColor(13, 148, 136); // Teal-600
    doc.rect(0, 0, pageWidth, 80, "F");
    
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(asignatura.nombre, marginX, 45);
    
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.text(`Sigla: ${asignatura.sigla} | Nivel: ${asignatura.nivel} | Informe Generado: ${new Date().toLocaleDateString()}`, marginX, 65);
    
    y = 110;

    // Detalles principales
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Información de la Asignatura", marginX, y);
    y += 20;

    autoTable(doc, {
      startY: y,
      body: [
        ["Área de Formación:", asignatura.area],
        ["Créditos:", asignatura.creditos.toString()],
        ["Prerequisito:", asignatura.prerequisito || "Ninguno"],
        ["Fecha de Creación:", new Date(asignatura.createdAt).toLocaleDateString()],
      ],
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 120 } },
      margin: { left: marginX }
    });
    
    y = (doc as any).lastAutoTable.finalY + 20;

    // Justificación box
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Justificación Académica", marginX, y);
    y += 10;
    
    const justificacion = cleanHTML(asignatura.justificacion || "N/A");
    const splitJust = doc.splitTextToSize(justificacion, maxWidth);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(splitJust, marginX, y);
    y += splitJust.length * 12 + 30;

    // Horas Table
    autoTable(doc, {
      startY: y,
      head: [["HP", "HC", "HAA", "HE", "HIP", "TOTAL"]],
      body: [[
        asignatura.hp || 0,
        asignatura.hc || 0,
        asignatura.haa || 0,
        asignatura.he || 0,
        asignatura.hip || 0,
        totalHoras
      ]],
      theme: "striped",
      headStyles: { fillColor: [13, 148, 136] },
      margin: { left: marginX }
    });

    y = (doc as any).lastAutoTable.finalY + 30;

    // Secciones Genéricas
    const sections = [
      { title: "Objetivos de Aprendizaje", data: objetivos },
      { title: "Estrategias de Enseñanza", data: estrategias },
      { title: "Recursos Educativos", data: recursos }
    ];

    sections.forEach(section => {
      if (section.data.length > 0) {
        if (y > 700) { doc.addPage(); y = 40; }
        
        doc.setFontSize(14);
        doc.setTextColor(13, 148, 136);
        doc.setFont("helvetica", "bold");
        doc.text(section.title, marginX, y);
        y += 10;

        autoTable(doc, {
          startY: y,
          head: [["Tipo", "Descripción"]],
          body: section.data.map(item => [item.tipo, cleanHTML(item.descripcion)]),
          theme: "grid",
          headStyles: { fillColor: [45, 45, 45] },
          styles: { fontSize: 9, cellPadding: 6 },
          columnStyles: { 0: { fontStyle: "bold", cellWidth: 100 } },
          margin: { left: marginX }
        });
        y = (doc as any).lastAutoTable.finalY + 25;
      }
    });

    doc.save(`Informe_${asignatura.sigla}.pdf`);
  };

  if (loading) return <Loading />;
  if (!asignatura) return <EmptyState />;

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-12 transition-colors duration-300">
        
        {/* Header con Título y Botón Exportar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
              <span className="w-1.5 h-8 bg-teal-600 rounded-full" />
              Información General
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 ml-4">
              Resumen académico y configuraciones de la asignatura seleccionada.
            </p>
          </motion.div>

          <button
            onClick={exportarPDF}
            className="group flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl shadow-lg shadow-teal-600/20 transition-all active:scale-95 font-bold"
          >
            <Download className="w-5 h-5 transition-transform group-hover:translate-y-0.5" />
            Exportar Informe PDF
          </button>
        </div>

        {/* Tarjetas resumen de alta visibilidad */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: "Objetivos", count: objetivos.length, icon: Target, color: "blue" },
            { label: "Estrategias", count: estrategias.length, icon: Lightbulb, color: "amber" },
            { label: "Recursos", count: recursos.length, icon: BookOpen, color: "emerald" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative p-6 rounded-3xl bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all group overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-${item.color}-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150`} />
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-2xl bg-${item.color}-50 dark:bg-${item.color}-900/20 flex items-center justify-center text-${item.color}-600 dark:text-${item.color}-400`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{item.count}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Asignatura Principal Card (Glassmorphism / Premium) */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[2rem] overflow-hidden bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-gray-800 shadow-xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* Left Decorative / Info Panel */}
            <div className="lg:col-span-4 bg-teal-600 p-10 flex flex-col justify-between relative overflow-hidden text-white">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0,0 L100,0 L0,100 Z" fill="currentColor" />
                </svg>
              </div>
              <div className="relative z-10">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 inline-block">
                  Asignatura de Pregrado
                </span>
                <h2 className="text-4xl font-black leading-tight mb-2">{asignatura.nombre}</h2>
                <p className="text-teal-50/80 font-mono text-xl">{asignatura.sigla}</p>
              </div>
              
              <div className="mt-12 space-y-4 relative z-10">
                <div className="flex items-center gap-3 text-teal-100">
                  <Layers className="w-5 h-5 opacity-70" />
                  <span className="font-semibold">{asignatura.nivel}</span>
                </div>
                <div className="flex items-center gap-3 text-teal-100">
                  <Award className="w-5 h-5 opacity-70" />
                  <span className="font-semibold">{asignatura.area}</span>
                </div>
                <div className="flex items-center gap-3 text-teal-100">
                  <Calendar className="w-5 h-5 opacity-70" />
                  <span className="font-semibold">Creado: {new Date(asignatura.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Right Details / Hours Panel */}
            <div className="lg:col-span-8 p-10 space-y-8 bg-white dark:bg-[#1e1e1e]">
              <div>
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Justificación y Propósito</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic border-l-4 border-teal-500 pl-4 py-1" dangerouslySetInnerHTML={{ __html: asignatura.justificacion || "N/A" }} />
              </div>

              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800">
                  <Hash className="w-4 h-4 text-teal-600" />
                  <span className="text-gray-500 dark:text-gray-400">Créditos:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{asignatura.creditos}</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800">
                  <BookOpen className="w-4 h-4 text-teal-600" />
                  <span className="text-gray-500 dark:text-gray-400">Prerequisito:</span>
                  <span className="font-bold text-gray-900 dark:text-white uppercase">{asignatura.prerequisito || "Ninguno"}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Distribución de Carga Horaria</h3>
                  <span className="text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-3 py-1 rounded-full font-bold">Total: {totalHoras} Horas</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {[
                    { label: "HP", val: asignatura.hp, color: "teal" },
                    { label: "HC", val: asignatura.hc, color: "blue" },
                    { label: "HAA", val: asignatura.haa, color: "purple" },
                    { label: "HE", val: asignatura.he, color: "amber" },
                    { label: "HIP", val: asignatura.hip, color: "rose" },
                  ].map((h, i) => (
                    <div key={i} className="text-center group">
                      <div className="flex flex-col items-center">
                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(Number(h.val)/totalHoras)*100}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={`h-full bg-${h.color}-500 shadow-md`}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{h.label}</span>
                        <span className="text-lg font-black text-gray-900 dark:text-white leading-none mt-1">{h.val || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Accordion Sections for Learning */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[
            { title: "Objetivos", icon: Target, data: objetivos, color: "blue" },
            { title: "Estrategias", icon: Lightbulb, data: estrategias, color: "amber" },
          ].map((section, idx) => (
            <div key={idx} className="bg-white dark:bg-[#1e1e1e] rounded-[2rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-2xl bg-${section.color}-50 dark:bg-${section.color}-900/20 flex items-center justify-center text-${section.color}-600`}>
                  <section.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{section.title}</h3>
              </div>
              
              <div className="space-y-3">
                {section.data.length === 0 ? (
                  <p className="text-gray-400 dark:text-gray-600 italic text-sm py-4">No hay registros definidos.</p>
                ) : (
                  section.data.map((item, i) => (
                    <Disclosure key={i}>
                      {({ open }) => (
                        <div className={`rounded-2xl border transition-all ${open ? 'border-teal-500 shadow-md' : 'border-gray-100 dark:border-gray-800'}`}>
                          <Disclosure.Button className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-colors">
                            <span className="font-bold text-gray-700 dark:text-gray-200 text-sm flex items-center gap-2">
                              <ArrowRight className={`w-3.5 h-3.5 text-teal-500 transition-transform ${open ? 'rotate-90' : ''}`} />
                              {item.tipo}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                          </Disclosure.Button>
                          <Transition
                            enter="transition duration-100 ease-out"
                            enterFrom="transform scale-95 opacity-0"
                            enterTo="transform scale-100 opacity-100"
                            leave="transition duration-75 ease-out"
                            leaveFrom="transform scale-100 opacity-100"
                            leaveTo="transform scale-95 opacity-0"
                          >
                            <Disclosure.Panel className="px-4 pb-4 pt-0 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-50 dark:border-gray-800 mt-1">
                              <div className="pt-3" dangerouslySetInnerHTML={{ __html: item.descripcion }} />
                            </Disclosure.Panel>
                          </Transition>
                        </div>
                      )}
                    </Disclosure>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Recursos & Contenido Full Width */}
        <div className="grid grid-cols-1 gap-8">
          {/* Contenido Grid */}
          <div className="bg-white dark:bg-[#1e1e1e] rounded-[2rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Contenido Temático</h3>
                <p className="text-sm text-gray-500 dark:text-gray-500 leading-none mt-1">Plan de avance de la asignatura</p>
              </div>
            </div>

            {contenido.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-600 italic text-center py-12 bg-gray-50/50 dark:bg-gray-800/20 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                Aún no se ha cargado contenido programático.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {contenido.map((item: any, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ y: -5 }}
                    className="group bg-white dark:bg-[#252525] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-teal-100 dark:border-teal-900/30">
                        {item.tipo}
                      </span>
                      {item.recursoUrl && (
                        <a href={item.recursoUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-teal-500 transition-colors">
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-teal-600 transition-colors">{item.titulo}</h4>
                    <div className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3 mb-4" dangerouslySetInnerHTML={{ __html: item.descripcion }} />
                    <div className="pt-4 border-t border-gray-50 dark:border-gray-800 flex justify-end">
                      <button className="text-teal-600 dark:text-teal-400 text-xs font-bold hover:underline flex items-center gap-1.5">
                        Ver Detalles <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Competencias Table (Refined) */}
        <AnimatePresence>
          {asignatura.competencia && asignatura.competencia.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-[#1e1e1e] rounded-[2rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-600/30">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Competencias y Evaluación</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Matriz de competencias y criterios de desempeño</p>
                </div>
              </div>

              <div className="space-y-8">
                {asignatura.competencia.map((comp, ci) => (
                  <div key={ci} className="relative pl-8 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-teal-500 before:rounded-full before:opacity-20 hover:before:opacity-100 transition-all">
                    <h4 className="font-black text-xl mb-4 text-gray-900 dark:text-white">
                      <span className="text-teal-600 dark:text-teal-400 mr-2">{ci + 1}.</span>
                      {comp.tipo}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm" dangerouslySetInnerHTML={{ __html: comp.descripcion }} />

                    {comp.criterioevaluacion && comp.criterioevaluacion.length > 0 ? (
                      <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10">
                        <table className="min-w-full border-collapse text-xs">
                          <thead>
                            <tr className="bg-gray-100 dark:bg-gray-800/50">
                              <th className="px-6 py-4 text-left font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Criterio de Desempeño</th>
                              <th className="px-6 py-4 text-left font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Evidencias Requeridas</th>
                              <th className="px-6 py-4 text-center font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">%</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {comp.criterioevaluacion.map((crit, ci2) => (
                              <tr key={ci2} className="hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">{crit.nombre}</td>
                                <td className="px-6 py-4">
                                  {crit.evidencia && crit.evidencia.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {crit.evidencia.map((ev, ei) => (
                                        <span key={ei} className="px-2 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-md text-[10px]">
                                          • {ev.nombre || ev.tipo}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-600 italic">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="inline-block px-3 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 font-black rounded-lg">
                                    {crit.porcentaje}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-600 italic text-xs">Sin criterios registrados para esta competencia.</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SidebarLayout>
  );
};

export default InfoGeneral;

// COMPONENTES AUXILIARES

const Loading = () => (
  <SidebarLayout>
    <div className="flex flex-col justify-center items-center h-[60vh] text-gray-400 dark:text-gray-500 space-y-4">
      <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
      <span className="font-bold tracking-widest uppercase text-xs">Preparando Experiencia...</span>
    </div>
  </SidebarLayout>
);

const EmptyState = () => (
  <SidebarLayout>
    <div className="flex flex-col justify-center items-center h-[60vh] text-gray-500 dark:text-gray-400 space-y-4">
      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
        <BookOpen className="w-10 h-10 text-gray-300" />
      </div>
      <p className="text-xl font-bold">Sin Asignatura Seleccionada</p>
      <p className="text-sm max-w-xs text-center opacity-70">Por favor, seleccione una asignatura desde el panel principal para ver su información detallada.</p>
    </div>
  </SidebarLayout>
);
