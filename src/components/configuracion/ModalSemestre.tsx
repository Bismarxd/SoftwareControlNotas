import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Calendar, Edit3, CheckCircle2, Info } from "lucide-react";
import { Semestre } from "@/types/semestre";
import { useAlert } from "@/components/ui/Alert";
import { motion } from "framer-motion";

type Datos = {
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  setSemestre: React.Dispatch<React.SetStateAction<Semestre[]>>;
  semestreEditar?: Semestre | null;
  onUpdate?: (data: Partial<Semestre>) => Promise<void>;
};

const ModalSemestre: React.FC<Datos> = ({
  setShowModal,
  setSemestre,
  semestreEditar,
  onUpdate,
}) => {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [nuevoSemestre, setNuevoSemestre] = useState<Semestre>({
    id: 0,
    usuarioId: 1,
    nombre: "",
    fechaInicio: "",
    fechaFin: "",
    estado: "Finalizado",
    seleccionado: false,
  });

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");
    if (usuario) {
      const usuarioObj = JSON.parse(usuario);
      setNuevoSemestre((prev) => ({
        ...prev,
        usuarioId: usuarioObj.id,
      }));
    }
  }, []);

  useEffect(() => {
    if (semestreEditar) {
      setNuevoSemestre({
        ...semestreEditar,
        fechaInicio: semestreEditar.fechaInicio.split("T")[0],
        fechaFin: semestreEditar.fechaFin.split("T")[0],
      });
    }
  }, [semestreEditar]);

  const handleSave = async () => {
    try {
      if (
        !nuevoSemestre.nombre ||
        !nuevoSemestre.fechaInicio ||
        !nuevoSemestre.fechaFin
      ) {
        showAlert("Por favor, completa todos los campos", "error");
        return;
      }

      if (nuevoSemestre.estado === "Activo") {
        const confirmado = window.confirm(
          "Al activar este semestre, se desactivarán los semestres anteriores. ¿Deseas continuar?"
        );
        if (!confirmado) return;
      }

      setLoading(true);

      if (semestreEditar && onUpdate) {
        await onUpdate(nuevoSemestre);
        setShowModal(false);
        return;
      }

      const res = await axios.post("/api/semestres", nuevoSemestre);
      const data = res.data;

      if (data.status) {
        setSemestre((prev) => [...prev, { ...data.nuevoSemestre }]);
        showAlert("Semestre creado exitosamente", "success");
        setShowModal(false);
      } else {
        showAlert("Error al crear el semestre", "error");
      }
    } catch (error) {
      console.error("Error al guardar semestre:", error);
      showAlert("Error al guardar semestre", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      {/* Overlay con Backdrop Blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowModal(false)}
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-white dark:bg-gray-900 black:bg-zinc-950 rounded-[2.5rem] border border-gray-200 dark:border-gray-800 black:border-zinc-900 shadow-2xl overflow-hidden my-auto"
      >
        {/* Header Decorativo */}
        <div className="h-2 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500" />
        
        <div className="p-8 space-y-8">
          {/* Header Texto */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {semestreEditar ? "Editar Ciclo" : "Nuevo Ciclo"}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
                Configura los detalles del periodo académico
              </p>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Input Nombre */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 ml-1">
                Nombre del Semestre
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-teal-500 transition-colors">
                  <Edit3 size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Ej: Semestre 2024-1"
                  className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-200 dark:border-gray-700 black:border-zinc-800 rounded-2xl pl-11 pr-4 py-4 focus:ring-2 focus:ring-teal-500 outline-none transition-all dark:text-white"
                  value={nuevoSemestre.nombre}
                  onChange={(e) =>
                    setNuevoSemestre({ ...nuevoSemestre, nombre: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Fechas en Grilla */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">
                  Fecha Inicio
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Calendar size={18} />
                  </div>
                  <input
                    type="date"
                    className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-200 dark:border-gray-700 black:border-zinc-800 rounded-2xl pl-11 pr-4 py-4 focus:ring-2 focus:ring-teal-500 outline-none transition-all dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                    value={nuevoSemestre.fechaInicio}
                    onChange={(e) =>
                      setNuevoSemestre({
                        ...nuevoSemestre,
                        fechaInicio: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">
                  Fecha Fin
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Calendar size={18} />
                  </div>
                  <input
                    type="date"
                    className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-200 dark:border-gray-700 black:border-zinc-800 rounded-2xl pl-11 pr-4 py-4 focus:ring-2 focus:ring-teal-500 outline-none transition-all dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                    value={nuevoSemestre.fechaFin}
                    onChange={(e) =>
                      setNuevoSemestre({
                        ...nuevoSemestre,
                        fechaFin: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Selector de Estado */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 ml-1">
                Estado del Periodo
              </label>
              <div className="relative flex gap-4 p-1 bg-gray-100 dark:bg-gray-800 black:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-gray-700 black:border-zinc-800">
                {["Activo", "Finalizado"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setNuevoSemestre({ ...nuevoSemestre, estado: status as any })}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                      nuevoSemestre.estado === status
                        ? "bg-white dark:bg-gray-700 black:bg-zinc-800 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5"
                        : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="flex gap-3 p-4 bg-teal-50 dark:bg-teal-500/5 rounded-2xl border border-teal-100 dark:border-teal-500/20 text-teal-700 dark:text-teal-400 text-xs font-medium">
              <Info size={16} className="shrink-0" />
              <p>Al marcar como &quot;Activo&quot;, este semestre será el predeterminado para nuevas registros y evaluaciones.</p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-[2] bg-gray-900 dark:bg-teal-700 black:bg-white black:text-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-gray-200 dark:shadow-none flex items-center justify-center gap-3 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  {semestreEditar ? "Actualizar" : "Crear Ciclo"}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ModalSemestre;
