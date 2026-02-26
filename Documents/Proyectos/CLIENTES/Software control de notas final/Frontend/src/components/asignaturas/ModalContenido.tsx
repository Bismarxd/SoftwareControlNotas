"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { X, FileText, Globe, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAlert } from "@/components/ui/Alert";
import { useTheme } from "@/context/ThemeContext";
import { Contenido } from "@/types/semestre";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

interface Props {
  setShowModal: (value: boolean) => void;
  setContenido: React.Dispatch<React.SetStateAction<Contenido[]>>;
  contenidoEditar: Contenido | null;
  setContenidoEditar: (value: Contenido | null) => void;
}

const ModalContenido = ({
  setShowModal,
  setContenido,
  contenidoEditar,
  setContenidoEditar,
}: Props) => {
  const editor = useRef(null);
  const { showAlert } = useAlert();
  const { theme } = useTheme();

  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [recursoUrl, setRecursoUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contenidoEditar) {
      setTitulo(contenidoEditar.titulo);
      setTipo(contenidoEditar.tipo);
      setDescripcion(contenidoEditar.descripcion);
      setRecursoUrl(contenidoEditar.recursoUrl || "");
    }
  }, [contenidoEditar]);

  const handleClose = () => {
    setShowModal(false);
    setContenidoEditar(null);
    setTitulo("");
    setTipo("");
    setDescripcion("");
    setRecursoUrl("");
  };

  const handleSave = async () => {
    const stored = localStorage.getItem("materiaSeleccionada");
    const materiaId = stored ? JSON.parse(stored) : null;

    if (!materiaId) {
      showAlert("No hay una asignatura seleccionada.", "error");
      return;
    }

    if (!titulo || !tipo || !descripcion) {
      showAlert("Por favor, completa todos los campos requeridos.", "error");
      return;
    }

    setLoading(true);

    try {
      let res;
      if (contenidoEditar) {
        res = await axios.put(`/api/asignaturas/contenido`, {
          id: contenidoEditar.id,
          titulo,
          tipo,
          descripcion,
          recurso: recursoUrl || null,
        });
      } else {
        res = await axios.post(`/api/asignaturas/contenido`, {
          asignaturaId: materiaId,
          titulo,
          tipo,
          descripcion,
          recurso: recursoUrl || null,
        });
      }

      if (res.data.status) {
        setContenido((prev) =>
          contenidoEditar
            ? prev.map((c) => (c.id === contenidoEditar.id ? res.data.contenido : c))
            : [...prev, res.data.contenido]
        );
        showAlert(contenidoEditar ? "Actualizado correctamente" : "Agregado correctamente", "success");
        handleClose();
      } else {
        showAlert(res.data.message || "Error al guardar", "error");
      }
    } catch (error) {
      console.error(error);
      showAlert("Error al procesar la solicitud", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={handleClose}
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white dark:bg-[#1a1a1a] rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              {contenidoEditar ? "Editar Contenido" : "Nuevo Contenido Temático"}
            </h2>
          </div>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-1">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Título de la Unidad / Tema</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 outline-none transition-all placeholder:text-gray-400"
                placeholder="Ej: Unidad 1 - Historia de la Psicología"
              />
            </div>
            <div className="col-span-1 md:col-span-1">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Clasificación</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">Selecciona tipo</option>
                <option value="unidad">Unidad Temática</option>
                <option value="tema">Tema Específico</option>
                <option value="modulo">Módulo</option>
                <option value="clase">Clase</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Desarrollo del Contenido</label>
            <div className="dark:text-gray-100 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <JoditEditor
                ref={editor}
                value={descripcion}
                config={{
                  readonly: false, height: 250, toolbarAdaptive: false,
                  theme: theme === "dark" ? "dark" : "default",
                  buttons: "bold,italic,underline,ul,ol,link,|,fontsize,brush,paragraph,align",
                  placeholder: "Describe los puntos clave que se abordarán...",
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

          <div>
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-2">
              URL de Recurso Externo <span className="lowercase font-normal opacity-50 text-[9px]">(opcional)</span>
            </label>
            <div className="relative group">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
              <input
                type="url"
                value={recursoUrl}
                onChange={(e) => setRecursoUrl(e.target.value)}
                placeholder="https://ejemplo.com/material"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 outline-none transition-all placeholder:text-gray-400 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
          <button onClick={handleClose} className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-sm" disabled={loading}>
            Cancelar
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-8 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-lg shadow-teal-600/20 transition-all active:scale-95 font-bold text-sm" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{contenidoEditar ? "Actualizar" : "Guardar Contenido"}</span>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ModalContenido;
