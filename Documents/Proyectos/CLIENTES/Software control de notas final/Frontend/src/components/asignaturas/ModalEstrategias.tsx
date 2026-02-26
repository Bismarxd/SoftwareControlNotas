"use client";

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { X, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAlert } from "@/components/ui/Alert";
import { useTheme } from "@/context/ThemeContext";
import dynamic from "next/dynamic";
import { Objetivo } from "@/types/semestre";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

interface ModalProps {
  setShowModal: (show: boolean) => void;
  setEstrategias: React.Dispatch<React.SetStateAction<Objetivo[]>>;
  estrategiasEditar?: Objetivo | null;
  setEstrategiasEditar: (obj: Objetivo | null) => void;
}

const ModalEstrategias: React.FC<ModalProps> = ({
  setShowModal,
  setEstrategias,
  estrategiasEditar,
  setEstrategiasEditar,
}) => {
  const { showAlert } = useAlert();
  const { theme } = useTheme();
  const editor = useRef(null);
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState("");
  const [descripcion, setDescripcion] = useState("");

  useEffect(() => {
    if (estrategiasEditar) {
      setTipo(estrategiasEditar.tipo || "");
      setDescripcion(estrategiasEditar.descripcion || "");
    }
  }, [estrategiasEditar]);

  const handleClose = () => {
    setShowModal(false);
    setEstrategiasEditar(null);
  };

  const handleSave = async () => {
    try {
      const stored = localStorage.getItem("materiaSeleccionada");
      const materiaId = stored ? JSON.parse(stored) : null;

      if (!materiaId) {
        showAlert("No hay una asignatura seleccionada.", "error");
        return;
      }

      if (!tipo || !descripcion || descripcion === "<p><br></p>") {
        showAlert("Por favor, completa todos los campos correctamente.", "error");
        return;
      }

      setLoading(true);

      if (estrategiasEditar?.id) {
        const res = await axios.put("/api/asignaturas/estrategias", {
          id: estrategiasEditar.id,
          tipo,
          descripcion,
        });
        if (res.data.status) {
          setEstrategias((prev) => prev.map((e) => (e.id === estrategiasEditar.id ? res.data.estrategia : e)));
          showAlert("Estrategia actualizada correctamente", "success");
          handleClose();
        } else {
          showAlert(res.data.message || "Error al actualizar", "error");
        }
      } else {
        const res = await axios.post("/api/asignaturas/estrategias", { tipo, descripcion, asignaturaId: materiaId });
        if (res.data.status) {
          setEstrategias((prev) => [...prev, res.data.estrategia]);
          showAlert("Estrategia añadida correctamente", "success");
          handleClose();
        } else {
          showAlert(res.data.message || "Error al guardar", "error");
        }
      }
    } catch (error) {
      console.error("Error saving strategy:", error);
      showAlert("Error al procesar la solicitud", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white dark:bg-[#1a1a1a] rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden my-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              {estrategiasEditar ? "Editar Estrategia" : "Nueva Estrategia"}
            </h2>
          </div>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                Tipo de Estrategia
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">Selecciona una metodología</option>
                <option value="colaborativa">Colaborativa / Grupal</option>
                <option value="indagativa">Indagativa / Investigación</option>
                <option value="expositiva">Expositiva / Magistral</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-2">
                Descripción Metodológica
                <AlertCircle className="w-3 h-3 text-gray-400" />
              </label>
              <div className="dark:text-gray-100 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <JoditEditor
                  ref={editor}
                  value={descripcion}
                  config={{
                    readonly: false, height: 250, toolbarAdaptive: false,
                    theme: theme === "dark" ? "dark" : "default",
                    buttons: "bold,italic,underline,ul,ol,link,|,fontsize,brush,paragraph,align",
                    placeholder: "Detalla la implementación de esta estrategia...",
                    colors: {
                      greyscale: theme === "dark" ? ['#ffffff', '#f0f0f0', '#d0d0d0', '#909090', '#606060', '#303030', '#101010', '#000000'] : undefined
                    },
                    style: {
                      background: theme === "dark" ? "#1a1a1a" : "#fff",
                      color: theme === "dark" ? "#fff" : "#000",
                    }
                  }}
                  onBlur={(newContent) => setDescripcion(newContent)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
          <button onClick={handleClose} className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-sm" disabled={loading}>
            Cancelar
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-8 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-600/20 transition-all active:scale-95 font-bold text-sm" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{estrategiasEditar ? "Actualizar" : "Guardar"}</span>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ModalEstrategias;
