"use client";
import React, { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { X, Award, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Competencia } from "@/types/semestre";
import { useAlert } from "@/components/ui/Alert";
import axios from "axios";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

type Datos = {
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  competencias: Competencia[];
  setCompetencias: React.Dispatch<React.SetStateAction<Competencia[]>>;
  competenciasEditar: Competencia | null;
  setCompetenciasEditar: React.Dispatch<React.SetStateAction<Competencia | null>>;
};

const ModalCompetencias: React.FC<Datos> = ({
  showModal,
  setShowModal,
  competencias,
  setCompetencias,
  competenciasEditar,
  setCompetenciasEditar,
}) => {
  const { showAlert } = useAlert();
  const editor = useRef(null);
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [porcentaje, setPorcentaje] = useState<number | "">("");

  useEffect(() => {
    if (competenciasEditar) {
      setTipo(competenciasEditar.tipo);
      setDescripcion(competenciasEditar.descripcion);
      setPorcentaje(competenciasEditar.porcentaje);
    } else {
      setTipo("");
      setDescripcion("");
      setPorcentaje("");
    }
  }, [competenciasEditar]);

  const totalAsignado = competencias
    .filter((c) => c.id !== competenciasEditar?.id)
    .reduce((acc, c) => acc + c.porcentaje, 0);
  const restante = Math.max(0, 100 - totalAsignado);

  const porcentajeNum = porcentaje === "" ? 0 : Number(porcentaje);
  const barColor =
    porcentajeNum <= 50
      ? "from-teal-400 to-teal-600"
      : porcentajeNum <= 80
      ? "from-amber-400 to-amber-500"
      : "from-rose-400 to-rose-600";

  const handleClose = () => {
    setShowModal(false);
    setCompetenciasEditar(null);
  };

  const handleSave = async () => {
    if (!tipo || !descripcion) {
      showAlert("Por favor completa todos los campos", "error");
      return;
    }
    if (porcentaje === "" || porcentajeNum < 0 || porcentajeNum > restante) {
      showAlert(`El porcentaje debe estar entre 0 y ${restante}`, "error");
      return;
    }

    try {
      setLoading(true);
      const materiaIdString = localStorage.getItem("materiaSeleccionada");
      const materiaId = materiaIdString ? JSON.parse(materiaIdString) : null;

      if (competenciasEditar) {
        const res = await axios.put(`/api/asignaturas/competencias/`, {
          id: competenciasEditar.id,
          tipo,
          descripcion,
          porcentaje,
        });
        if (res.data.status) {
          setCompetencias((prev) =>
            prev.map((c) => (c.id === competenciasEditar.id ? res.data.competencia : c))
          );
          showAlert("Competencia editada correctamente", "success");
          handleClose();
        } else {
          showAlert("Error al editar la competencia", "error");
        }
      } else {
        const res = await axios.post("/api/asignaturas/competencias", {
          tipo,
          descripcion,
          porcentaje,
          asignaturaId: materiaId,
        });
        if (res.data.status) {
          setCompetencias((prev) => [...prev, res.data.competencia]);
          showAlert("Competencia añadida correctamente", "success");
          handleClose();
        } else {
          showAlert("Error al añadir la competencia", "error");
        }
      }
    } catch (error) {
      console.error(error);
      showAlert("Error al guardar la competencia", "error");
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
                  <Award className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
                    {competenciasEditar ? "Editar Competencia" : "Nueva Competencia"}
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {competenciasEditar ? "Modifica los datos de la competencia" : "Completa los datos para añadir"}
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

              {/* Tipo */}
              <div>
                <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                  Tipo de competencia
                </label>
                <input
                  list="tiposCompetencia"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  placeholder="Ej: Evaluación Psicológica, Intervención Clínica..."
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all"
                />
                <datalist id="tiposCompetencia">
                  <option value="Cognitiva" />
                  <option value="Procedimental" />
                  <option value="Actitudinal" />
                </datalist>
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
                    height: 220,
                    toolbarAdaptive: false,
                    toolbarSticky: false,
                    buttons: "bold,italic,underline,ul,ol,link,|,fontsize,brush,paragraph,align",
                    placeholder: "Escribe la descripción aquí...",
                  }}
                  onBlur={(newContent) => setDescripcion(newContent)}
                  onChange={() => {}}
                />
              </div>

              {/* Porcentaje */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Porcentaje
                  </label>
                  <span
                    className={`text-xs font-extrabold ${
                      restante > 0 ? "text-teal-600 dark:text-teal-400" : "text-rose-500"
                    }`}
                  >
                    Disponible: {restante}%
                  </span>
                </div>

                {/* Mini progress bar */}
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full mb-3 overflow-hidden">
                  <motion.div
                    className={`h-2 rounded-full bg-gradient-to-r ${barColor}`}
                    animate={{ width: `${Math.min(porcentajeNum, restante)}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                <input
                  type="number"
                  value={porcentaje === "" ? "" : porcentaje}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") { setPorcentaje(""); return; }
                    let value = Number(raw);
                    if (isNaN(value)) value = 0;
                    if (value < 0) value = 0;
                    if (value > restante) value = restante;
                    setPorcentaje(value);
                  }}
                  min={0}
                  max={restante}
                  placeholder="0"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all"
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
                  competenciasEditar ? "Guardar cambios" : "Añadir competencia"
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ModalCompetencias;
