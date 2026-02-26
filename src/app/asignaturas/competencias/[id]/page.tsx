"use client";
import SidebarLayout from "@/components/Sidebar/SidebarLayout";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  PlusCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileText,
  Award,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Competencia, Criterio } from "@/types/semestre";
import { useAlert } from "@/components/ui/Alert";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import axios from "axios";
import ModalCriterio from "@/components/asignaturas/ModalCriterio";
import ModalEvidencia from "@/components/asignaturas/ModalEvidencia";
import Tooltip from "@/components/ui/Tooltip";

const CriteriosEvaluacion = () => {
  const router = useRouter();
  const params = useParams();
  const idCom = params.id;

  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showModalEvidencia, setShowModalEvidencia] = useState(false);
  const [criterioSeleccionado, setCriterioSeleccionado] = useState<Criterio | null>(null);
  const [competencia, setCompetencia] = useState<Competencia>();
  const [criterios, setCriterios] = useState<Criterio[]>([]);
  const [criteriosEditar, setCriteriosEditar] = useState<Criterio | null>(null);
  const [expandedEvidencias, setExpandedEvidencias] = useState<number[]>([]);

  const toggleEvidencias = (id: number) => {
    setExpandedEvidencias((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    const obtenerCompetencia = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/asignaturas/competencias/${idCom}`);
        const data = res.data;
        if (data.status) {
          setCompetencia(data.competencia);
          setCriterios(data.competencia.criterioevaluacion || []);
        }
      } catch (error) {
        console.error(error);
        showAlert("Error al cargar la competencia", "error");
      } finally {
        setLoading(false);
      }
    };
    obtenerCompetencia();
  }, [idCom, showAlert]);

  const handleEdit = (id: number) => {
    const criterio = criterios.find((s) => s.id === id);
    if (!criterio) return;
    setCriteriosEditar(criterio);
    setShowModal(true);
  };

  const handleDeleteCriterio = (idCriterio: number) => {
    showConfirm("¿Está seguro que desea eliminar este criterio?", async () => {
      try {
        const res = await axios.delete(`/api/asignaturas/competencias/criterios/${idCriterio}`);
        if (res.data.status) {
          showAlert("Criterio eliminado correctamente", "success");
          setCriterios((prev) => prev.filter((c) => c.id !== idCriterio));
        }
      } catch (error) {
        console.error(error);
        showAlert("Error al eliminar el criterio", "error");
      }
    });
  };

  const handleAddEvidencia = (criterio: Criterio) => {
    setCriterioSeleccionado(criterio);
    setShowModalEvidencia(true);
  };

  const handleDeleteCompetencia = () => {
    if (!competencia) return;
    showConfirm(
      `¿Está seguro que desea eliminar la competencia "${competencia.tipo}"?`,
      async () => {
        try {
          const res = await axios.delete(`/api/asignaturas/competencias/${competencia.id}`);
          if (res.data.status) {
            showAlert("Competencia eliminada correctamente", "success");
            router.back();
          } else {
            showAlert(res.data.message || "Error al eliminar la competencia", "error");
          }
        } catch (error) {
          console.error(error);
          showAlert("Error al eliminar la competencia", "error");
        }
      }
    );
  };

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-12 transition-colors duration-300">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-7 bg-teal-600 rounded-full" />
                Detalle de Competencia
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 ml-4">
                Criterios de evaluación y evidencias asociadas
              </p>
            </div>
          </motion.div>

          <button
            onClick={() => {
              setCriteriosEditar(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-lg shadow-teal-600/20 transition-all active:scale-95 font-bold whitespace-nowrap cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" />
            Añadir Criterio
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-[40vh] text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest">Cargando competencia...</p>
          </div>
        ) : (
          <>
            {/* Competencia Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#1e1e1e] rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">
                      Competencia
                    </p>
                    <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                      {competencia?.tipo}
                    </h2>
                  </div>
                </div>
                <span className="px-4 py-1.5 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 rounded-full text-sm font-black border border-teal-100 dark:border-teal-900/30 whitespace-nowrap">
                  {competencia?.porcentaje}% del total
                </span>
              </div>

              <div
                className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm border-t border-gray-50 dark:border-gray-800 pt-4"
                dangerouslySetInnerHTML={{ __html: competencia?.descripcion || "" }}
              />

              {/* Barra porcentaje */}
              <div className="mt-5">
                <div className="flex justify-between text-xs font-bold text-gray-400 dark:text-gray-500 mb-1.5">
                  <span>Valoración</span>
                  <span>{competencia?.porcentaje}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-2 rounded-full bg-gradient-to-r from-teal-400 to-teal-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${competencia?.porcentaje ?? 0}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Criterios de Evaluación */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <ClipboardList className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
                  Criterios de Evaluación
                </h2>
                <span className="ml-auto px-2.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-black rounded-full">
                  {criterios.length}
                </span>
              </div>

              {criterios.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 bg-gray-50/50 dark:bg-gray-800/10 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600"
                >
                  <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                    <ClipboardList className="w-7 h-7 opacity-50" />
                  </div>
                  <p className="font-bold">Sin criterios de evaluación</p>
                  <p className="text-sm opacity-70 mt-1">Agrega el primero con el botón de arriba.</p>
                </motion.div>
              ) : (
                <motion.div layout className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {criterios.map((c, idx) => {
                      const isExpanded = expandedEvidencias.includes(c.id);
                      return (
                        <motion.div
                          key={c.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                        >
                          {/* Criterio header */}
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2.5">
                                <span className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center shrink-0">
                                  <ClipboardList className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                </span>
                                <h3 className="font-bold text-gray-800 dark:text-white text-base">
                                  {c.nombre}
                                </h3>
                              </div>

                              {/* Action buttons */}
                              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Tooltip content="Añadir evidencia">
                                  <button
                                    onClick={() => handleAddEvidencia(c)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"
                                  >
                                    <PlusCircle className="w-4 h-4" />
                                  </button>
                                </Tooltip>
                                <Tooltip content="Editar criterio">
                                  <button
                                    onClick={() => handleEdit(c.id)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors cursor-pointer"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                </Tooltip>
                                <Tooltip content="Eliminar criterio">
                                  <button
                                    onClick={() => handleDeleteCriterio(c.id)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </Tooltip>
                              </div>
                            </div>

                            <div
                              className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: c.descripcion || "" }}
                            />
                          </div>

                          {/* Evidencias accordion */}
                          {c.evidencia?.length > 0 && (
                            <div className="border-t border-gray-50 dark:border-gray-800">
                              <button
                                onClick={() => toggleEvidencias(c.id)}
                                className="w-full flex items-center justify-between px-5 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                              >
                                <span className="flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  {c.evidencia.length} evidencia{c.evidencia.length !== 1 ? "s" : ""}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>

                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="overflow-hidden"
                                  >
                                    <ul className="px-5 pb-4 space-y-2">
                                      {c.evidencia.map((e) => (
                                        <li
                                          key={e.id}
                                          className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 group/ev"
                                        >
                                          <div className="flex items-center gap-2.5 text-sm">
                                            <FileText className="w-4 h-4 text-teal-500 shrink-0" />
                                            <span className="font-semibold text-gray-700 dark:text-gray-200">
                                              {e.nombre}
                                            </span>
                                            <span className="text-gray-400 dark:text-gray-500">
                                              · {e.tipo}
                                            </span>
                                          </div>
                                          <div className="flex gap-1 opacity-0 group-hover/ev:opacity-100 transition-opacity">
                                            <Tooltip content="Editar">
                                              <button className="p-1 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors cursor-pointer">
                                                <Pencil className="w-3.5 h-3.5" />
                                              </button>
                                            </Tooltip>
                                            <Tooltip content="Eliminar">
                                              <button className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer">
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </Tooltip>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>

            {/* Zona peligrosa */}
            <div className="border border-rose-100 dark:border-rose-900/30 rounded-2xl p-5 bg-rose-50/50 dark:bg-rose-900/5">
              <div className="flex items-center gap-2 mb-2 text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-black uppercase tracking-widest">Zona de peligro</span>
              </div>
              <p className="text-rose-600/70 dark:text-rose-400/70 text-sm mb-4">
                Esta acción es irreversible. Se eliminará la competencia y todos sus criterios y evidencias asociadas.
              </p>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-transparent border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white rounded-xl text-sm font-bold transition-all cursor-pointer"
                onClick={handleDeleteCompetencia}
              >
                <Trash2 className="w-4 h-4" />
                Eliminar Competencia
              </button>
            </div>
          </>
        )}

        {/* Modales */}
        <AnimatePresence>
          {showModal && (
            <ModalCriterio
              setShowModal={setShowModal}
              showModal={showModal}
              criterios={competencia?.criterioevaluacion || []}
              setCriterios={setCriterios}
              idCompetencia={competencia?.id || Number(idCom)}
              setCriteriosEditar={setCriteriosEditar}
              criteriosEditar={criteriosEditar}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showModalEvidencia && criterioSeleccionado && (
            <ModalEvidencia
              setShowModal={setShowModalEvidencia}
              showModal={showModalEvidencia}
              criterio={criterioSeleccionado}
              setCriterios={setCriterios}
            />
          )}
        </AnimatePresence>
      </div>
    </SidebarLayout>
  );
};

export default CriteriosEvaluacion;
