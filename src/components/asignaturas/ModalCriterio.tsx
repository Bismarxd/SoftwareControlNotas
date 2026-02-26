"use client";
import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { X, ClipboardList, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Criterio } from "@/types/semestre";
import { useAlert } from "@/components/ui/Alert";
import axios from "axios";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

type Datos = {
  showModal: boolean;
  idCompetencia: number;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  criterios?: Criterio[];
  setCriterios: React.Dispatch<React.SetStateAction<Criterio[]>>;
  setCriteriosEditar: React.Dispatch<React.SetStateAction<Criterio | null>>;
  criteriosEditar: Criterio | null;
};

const ModalCriterio: React.FC<Datos> = ({
  showModal,
  idCompetencia,
  setShowModal,
  setCriterios,
  setCriteriosEditar,
  criteriosEditar,
}) => {
  const { showAlert } = useAlert();
  const editor = useRef(null);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (criteriosEditar) {
      setNombre(criteriosEditar.nombre);
      setDescripcion(criteriosEditar.descripcion);
    } else {
      setNombre("");
      setDescripcion("");
    }
  }, [criteriosEditar]);

  const handleClose = () => {
    setShowModal(false);
    setCriteriosEditar(null);
  };

  const handleSave = async () => {
    if (!nombre.trim() || !descripcion.trim() || !idCompetencia) {
      showAlert("Completa todos los campos antes de guardar", "error");
      return;
    }

    try {
      setLoading(true);

      if (criteriosEditar) {
        const res = await axios.put(`/api/asignaturas/competencias/criterios`, {
          id: criteriosEditar.id,
          nombre,
          descripcion,
          porcentaje: criteriosEditar.porcentaje,
        });
        if (res.data.status) {
          setCriterios((prev) =>
            prev.map((c) => (c.id === criteriosEditar.id ? res.data.criterio : c))
          );
          showAlert("Criterio editado correctamente", "success");
          handleClose();
        } else {
          showAlert("Error al editar el criterio", "error");
        }
      } else {
        const res = await axios.post("/api/asignaturas/competencias/criterios", {
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          porcentaje: 0,
          competenciaId: Number(idCompetencia),
        });
        if (res.data.status) {
          setCriterios((prev) => [...prev, res.data.criterio]);
          showAlert("Criterio añadido correctamente", "success");
          handleClose();
        } else {
          showAlert(res.data.message || "Error al añadir el criterio", "error");
        }
      }
    } catch (error: any) {
      console.error("Error al guardar criterio:", error);
      showAlert("Error al guardar el criterio", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {showModal && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 w-full md:w-[420px] h-full bg-white dark:bg-[#141414] z-50 shadow-2xl flex flex-col border-l border-gray-100 dark:border-gray-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
                    {criteriosEditar ? "Editar Criterio" : "Nuevo Criterio"}
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {criteriosEditar
                      ? "Modifica los datos del criterio de evaluación"
                      : "Añade un nuevo criterio de evaluación"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-5 flex-grow overflow-y-auto px-6 py-5">

              {/* Nombre */}
              <div>
                <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                  Nombre del criterio
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Aplicación de teorías en análisis clínica..."
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                  Descripción
                </label>
                <JoditEditor
                  ref={editor}
                  value={descripcion}
                  config={{
                    readonly: false,
                    height: 280,
                    toolbarAdaptive: false,
                    toolbarSticky: false,
                    buttons: "bold,italic,underline,ul,ol,link,|,fontsize,brush,paragraph,align",
                    placeholder: "Describe el criterio de evaluación...",
                  }}
                  onBlur={(newContent) => setDescripcion(newContent)}
                  onChange={() => {}}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 shrink-0">
              <button
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-lg shadow-teal-600/20 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  criteriosEditar ? "Guardar cambios" : "Añadir criterio"
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ModalCriterio;
