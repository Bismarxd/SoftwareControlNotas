"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import SidebarLayout from "@/components/Sidebar/SidebarLayout";
import {
  Eye,
  Pencil,
  PlusCircle,
  Info,
  Award,
  Search,
  TrendingUp,
  BarChart2,
  AlertCircle,
  Loader2,
  Calendar,
} from "lucide-react";
import ModalCompetencias from "@/components/asignaturas/ModalCompetencia";
import { Competencia } from "@/types/semestre";
import Tooltip from "@/components/ui/Tooltip";

const Competencias = () => {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [materiaId, setMateriaId] = useState<number | null>(null);

  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [competenciasEditar, setCompetenciasEditar] =
    useState<Competencia | null>(null);
  const [expandedDesc, setExpandedDesc] = useState<{ [id: number]: boolean }>(
    {}
  );

  useEffect(() => {
    const stored = localStorage.getItem("materiaSeleccionada");
    if (stored) {
      try {
        setMateriaId(JSON.parse(stored));
      } catch (e) {
        console.error("Error parsing materiaId", e);
      }
    }
  }, []);

  useEffect(() => {
    if (!materiaId) {
      setLoading(false);
      return;
    }

    const fetchCompetencias = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `/api/asignaturas/competencias?asignaturaId=${materiaId}`
        );
        const data = res.data;
        if (data.status) {
          setCompetencias(data.competencias);
        } else {
          console.error(data.message, data.error);
        }
      } catch (error) {
        console.error("Error al obtener las competencias:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetencias();
  }, [materiaId]);

  // Total porcentaje
  const totalPorcentaje = useMemo(
    () => (competencias || []).reduce((acc, c) => acc + (c.porcentaje || 0), 0),
    [competencias]
  );

  const maxPorcentaje = useMemo(
    () =>
      competencias.length
        ? Math.max(...competencias.map((c) => c.porcentaje || 0))
        : 0,
    [competencias]
  );

  const filteredCompetencias = useMemo(() => {
    if (!searchTerm) return competencias;
    return competencias.filter(
      (c) =>
        c.tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [competencias, searchTerm]);

  const handleEdit = (id: number) => {
    const competencia = competencias.find((s) => s.id === id);
    if (!competencia) return;
    setCompetenciasEditar(competencia);
    setShowModal(true);
  };

  const handleView = (id: number) => {
    router.push(`/asignaturas/competencias/${id}`);
  };

  const toggleDesc = (id: number) => {
    setExpandedDesc((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const porcentajeColor =
    totalPorcentaje === 100
      ? "text-emerald-600 dark:text-emerald-400"
      : totalPorcentaje > 100
      ? "text-rose-600 dark:text-rose-400"
      : "text-amber-600 dark:text-amber-400";

  const barColor =
    totalPorcentaje === 100
      ? "from-emerald-400 to-emerald-600"
      : totalPorcentaje > 100
      ? "from-rose-400 to-rose-600"
      : "from-amber-400 to-amber-500";

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-12 transition-colors duration-300">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 dark:border-gray-800 pb-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
              <span className="w-1.5 h-8 bg-teal-600 rounded-full transition-colors" />
              Competencias
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 ml-4">
              Gestiona las competencias de tu asignatura y su distribución porcentual.
            </p>
          </motion.div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
              <input
                type="text"
                placeholder="Buscar competencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none w-full md:w-64 transition-all"
              />
            </div>
            <button
              onClick={() => {
                setCompetenciasEditar(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-lg shadow-teal-600/20 transition-all active:scale-95 font-bold whitespace-nowrap"
            >
              <PlusCircle className="w-5 h-5" />
              Nueva Competencia
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {/* Total Competencias */}
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Total
              </p>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {competencias.length}
              </p>
            </div>
          </div>

          {/* Porcentaje total */}
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-amber-500 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Porcentaje Total
              </p>
              <p className={`text-2xl font-extrabold ${porcentajeColor}`}>
                {totalPorcentaje}%
              </p>
            </div>
          </div>

          {/* Mayor porcentaje */}
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
              <BarChart2 className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Mayor %
              </p>
              <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                {maxPorcentaje}%
              </p>
            </div>
          </div>
        </motion.div>

        {/* Progress bar global */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Distribución porcentual
            </span>
            <span className={`text-sm font-extrabold ${porcentajeColor}`}>
              {totalPorcentaje} / 100%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className={`h-3 rounded-full bg-gradient-to-r ${barColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(totalPorcentaje, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          {totalPorcentaje !== 100 && (
            <p className="text-xs mt-2 text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <Info size={13} />
              La suma de los porcentajes debe ser exactamente 100%.
            </p>
          )}
        </motion.div>

        {/* Alerta sin materia seleccionada */}
        {!materiaId && !loading && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 font-bold mb-2">
              <AlertCircle className="w-5 h-5" />
              Atención
            </div>
            <p className="text-amber-700 dark:text-amber-300 text-sm">
              Debes seleccionar una asignatura en el Dashboard para gestionar sus competencias.
            </p>
          </div>
        )}

        {/* Grid de competencias */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-[40vh] text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest">
              Cargando competencias...
            </p>
          </div>
        ) : filteredCompetencias.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col justify-center items-center h-[40vh] bg-gray-50/50 dark:bg-gray-800/10 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600"
          >
            <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <Award className="w-8 h-8 opacity-50" />
            </div>
            <p className="font-bold">No se encontraron competencias</p>
            <p className="text-sm opacity-70 mt-1">Empieza agregando una nueva arriba.</p>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredCompetencias.map((c) => {
                const isExpanded = expandedDesc[c.id] || false;
                return (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -4 }}
                    className="group relative bg-white dark:bg-[#1e1e1e] rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm hover:shadow-xl transition-all"
                  >
                    {/* Header tarjeta */}
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-teal-100 dark:border-teal-900/30">
                        {c.tipo || "General"}
                      </span>
                      {/* Botones hover */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip content="Editar">
                          <button
                            onClick={() => handleEdit(c.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </Tooltip>
                        <Tooltip content="Ver detalle">
                          <button
                            onClick={() => handleView(c.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Barra de porcentaje */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                          Porcentaje
                        </span>
                        <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400">
                          {c.porcentaje}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-2 rounded-full bg-gradient-to-r from-teal-400 to-teal-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${c.porcentaje}%` }}
                          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                        />
                      </div>
                    </div>

                    {/* Descripción acordeón */}
                    <div className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                      {isExpanded ? (
                        <span dangerouslySetInnerHTML={{ __html: c.descripcion }} />
                      ) : (
                        <span>
                          {c.descripcion.replace(/<[^>]+>/g, "").slice(0, 100)}
                          {c.descripcion.length > 100 ? "..." : ""}
                        </span>
                      )}
                    </div>

                    {c.descripcion.length > 100 && (
                      <button
                        onClick={() => toggleDesc(c.id)}
                        className="text-teal-600 dark:text-teal-400 text-xs font-bold mt-2 hover:underline"
                      >
                        {isExpanded ? "Ver menos" : "Ver más"}
                      </button>
                    )}

                    {/* Footer */}
                    <div className="mt-5 pt-4 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleView(c.id)}
                        className="text-teal-600 dark:text-teal-400 text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        Ver detalle →
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <ModalCompetencias
              showModal={showModal}
              setShowModal={setShowModal}
              competencias={competencias}
              setCompetencias={setCompetencias}
              setCompetenciasEditar={setCompetenciasEditar}
              competenciasEditar={competenciasEditar}
            />
          )}
        </AnimatePresence>
      </div>
    </SidebarLayout>
  );
};

export default Competencias;
