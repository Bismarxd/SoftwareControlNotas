"use client";
import React, { useState } from "react";
import { X, FileText, Loader2, Package, Activity, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Criterio } from "@/types/semestre";
import { useAlert } from "../ui/Alert";

interface ModalEvidenciaProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  criterio: Criterio;
  setCriterios: React.Dispatch<React.SetStateAction<Criterio[]>>;
}

const TIPOS = [
  { value: "producto", label: "Producto", icon: Package, color: "teal" },
  { value: "desempeno", label: "Desempeño", icon: Activity, color: "blue" },
  { value: "conocimiento", label: "Conocimiento", icon: BookOpen, color: "amber" },
] as const;

type TipoEvidencia = "producto" | "desempeno" | "conocimiento";

const ModalEvidencia: React.FC<ModalEvidenciaProps> = ({
  showModal,
  setShowModal,
  criterio,
  setCriterios,
}) => {
  const { showAlert } = useAlert();
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoEvidencia>("producto");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setShowModal(false);
    setNombre("");
    setTipo("producto");
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      showAlert("El nombre de la evidencia es obligatorio", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("/api/asignaturas/competencias/criterios/evidencias", {
        nombre: nombre.trim(),
        tipo,
        criterioId: criterio.id,
      });
      const data = res.data;
      if (data.status) {
        showAlert("Evidencia creada correctamente", "success");
        setCriterios((prev) =>
          prev.map((c) =>
            c.id === criterio.id
              ? {
                  ...c,
                  evidencia: [
                    ...(c.evidencia || []),
                    { id: data.evidencia.id, nombre: data.evidencia.nombre, tipo: data.evidencia.tipo },
                  ],
                }
              : c
          )
        );
        handleClose();
      } else {
        showAlert("Error al crear la evidencia", "error");
      }
    } catch (error) {
      console.error(error);
      showAlert("Error al crear la evidencia", "error");
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal centrado */}
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pointer-events-none overflow-y-auto">
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="w-full max-w-md bg-white dark:bg-[#141414] rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 pointer-events-auto overflow-hidden my-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
                      Añadir Evidencia
                    </h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[200px]">
                      Criterio: {criterio.nombre}
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

              {/* Body */}
              <div className="px-6 py-5 flex flex-col gap-5">

                {/* Nombre */}
                <div>
                  <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                    Nombre de la evidencia
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Informe de Estudio de Caso, Test de Personalidad..."
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all"
                  />
                </div>

                {/* Tipo: botones de selección */}
                <div>
                  <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                    Tipo de evidencia
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIPOS.map(({ value, label, icon: Icon }) => {
                      const selected = tipo === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setTipo(value)}
                          className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            selected
                              ? "bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300"
                              : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${selected ? "text-teal-600 dark:text-teal-400" : ""}`} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-lg shadow-teal-600/20 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Añadir evidencia"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ModalEvidencia;
