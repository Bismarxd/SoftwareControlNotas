import React, { useEffect, useState } from "react";
import { X, BookOpen, Layers, Hash, GraduationCap, AlignLeft, CheckCircle2, Info } from "lucide-react";
import { Asignaturas } from "@/types/semestre";
import { useParams } from "next/navigation";
import axios from "axios";
import { useAlert } from "@/components/ui/Alert";
import { motion } from "framer-motion";

type Props = {
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  setAsignaturas: React.Dispatch<React.SetStateAction<Asignaturas[]>>;
  onSave?: (nuevaAsignatura: Asignaturas) => void;
  asignaturaEditar?: Asignaturas | null;
};

const ModalAsignatura: React.FC<Props> = ({
  setShowModal,
  setAsignaturas,
  asignaturaEditar,
}) => {
  const { showAlert } = useAlert();
  const params = useParams();

  const semestreId = Number(params.id);
  const [loading, setLoading] = useState(false);
  const [nuevaAsignatura, setNuevaAsignatura] = useState<Partial<Asignaturas>>({
    nombre: "",
    sigla: "",
    nivel: "",
    prerequisito: "",
    area: "",
    hp: 0,
    hc: 0,
    haa: 0,
    hip: 0,
    he: 0,
    creditos: 0,
    justificacion: "",
    seleccionado: false,
  });

  useEffect(() => {
    if (asignaturaEditar) {
      setNuevaAsignatura({
        ...asignaturaEditar,
      });
    }
  }, [asignaturaEditar]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNuevaAsignatura((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (
      !nuevaAsignatura.nombre ||
      !nuevaAsignatura.sigla ||
      !nuevaAsignatura.nivel ||
      !nuevaAsignatura.prerequisito ||
      !nuevaAsignatura.area
    ) {
      showAlert("Por favor, completa todos los campos obligatorios.", "error");
      return;
    }

    const asignaturaFinal: Asignaturas = {
      ...nuevaAsignatura,
      hp: Number(nuevaAsignatura.hp) || 0,
      hc: Number(nuevaAsignatura.hc) || 0,
      haa: Number(nuevaAsignatura.haa) || 0,
      hip: Number(nuevaAsignatura.hip) || 0,
      he: Number(nuevaAsignatura.he) || 0,
      creditos: Number(nuevaAsignatura.creditos) || 0,
      semestreId: semestreId,
    } as Asignaturas;

    try {
      setLoading(true);

      if (asignaturaEditar && asignaturaEditar.id) {
        const res = await axios.put(
          `/api/asignaturas/${asignaturaEditar.id}`,
          asignaturaFinal
        );
        const data = res.data;

        if (data.status) {
          setAsignaturas((prev) =>
            prev.map((a) =>
              a.id === asignaturaEditar.id ? data.asignaturaActualizada : a
            )
          );
          showAlert("Asignatura actualizada", "success");
          setShowModal(false);
        } else {
          showAlert("Error al actualizar la asignatura", "error");
        }
        return;
      }

      const res = await axios.post("/api/asignaturas", asignaturaFinal);
      const data = res.data;

      if (data.status) {
        setAsignaturas((prev) => [...prev, { ...data.nuevaAsignatura }]);
        showAlert("Asignatura creada", "success");
        setShowModal(false);
      } else {
        showAlert("Error al crear la asignatura", "error");
      }
    } catch (error) {
      console.error("Error al guardar asignatura:", error);
      showAlert("Error al guardar la asignatura", "error");
    } finally {
      setLoading(false);
    }
  };

  const inputFields = [
    { label: "Nombre Asignatura", name: "nombre", icon: <BookOpen size={18} />, placeholder: "Ej: Psicología General", required: true },
    { label: "Sigla", name: "sigla", icon: <Hash size={18} />, placeholder: "Ej: PSI-101", required: true },
    { label: "Nivel / Semestre", name: "nivel", icon: <Layers size={18} />, placeholder: "Ej: Primer Semestre", required: true },
    { label: "Área de Conocimiento", name: "area", icon: <GraduationCap size={18} />, placeholder: "Ej: Ciencias de la Salud", required: true },
    { label: "Prerrequisitos", name: "prerequisito", icon: <AlignLeft size={18} />, placeholder: "Ej: Introducción a la Biología", required: true },
  ];

  const numericFields = [
    { label: "Créditos", name: "creditos" },
    { label: "HP", name: "hp" },
    { label: "HC", name: "hc" },
    { label: "HAA", name: "haa" },
    { label: "HIP", name: "hip" },
    { label: "HE", name: "he" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 overflow-y-auto">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowModal(false)}
        className="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-sm transition-all duration-500"
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="relative w-full max-w-4xl bg-white dark:bg-gray-900 black:bg-zinc-950 rounded-[3rem] border border-gray-100 dark:border-gray-800 black:border-zinc-900 shadow-2xl overflow-hidden my-auto"
      >
        {/* Decorative Header */}
        <div className="h-2 bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-500" />

        <div className="p-8 md:p-12 space-y-10 max-h-[90vh] overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                {asignaturaEditar ? "Actualizar Materia" : "Nueva Asignatura"}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                <Info size={14} className="text-teal-500" />
                Los campos con asterisco son requeridos
              </p>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all hover:rotate-90 duration-300"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {inputFields.map((field) => (
              <div key={field.name} className="space-y-2 group">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400 ml-1">
                  {field.label} {field.required && "*"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-teal-500 transition-colors">
                    {field.icon}
                  </div>
                  <input
                    type="text"
                    name={field.name}
                    value={(nuevaAsignatura as any)[field.name] || ""}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl pl-11 pr-4 py-4 focus:ring-2 focus:ring-teal-500 outline-none transition-all dark:text-white font-medium"
                  />
                </div>
              </div>
            ))}

            {/* Numeric Fields in a grid portion */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {numericFields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 ml-1">
                      {field.label}
                    </label>
                    <input
                      type="number"
                      name={field.name}
                      value={(nuevaAsignatura as any)[field.name] !== 0 ? (nuevaAsignatura as any)[field.name] : ""}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-teal-500 outline-none transition-all dark:text-white text-center font-black"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Justification Area */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 ml-1">
                Descripción / Justificación
              </label>
              <textarea
                name="justificacion"
                value={nuevaAsignatura.justificacion || ""}
                onChange={handleChange}
                rows={4}
                placeholder="Detalla el propósito de esta asignatura..."
                className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl px-6 py-5 focus:ring-2 focus:ring-teal-500 outline-none transition-all dark:text-white font-medium"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 py-5 text-xs font-black uppercase tracking-[0.3em] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all"
              disabled={loading}
            >
              Cancelar Registro
            </button>
            <button
              onClick={handleSave}
              className="flex-[2] bg-gray-900 dark:bg-teal-700 black:bg-white black:text-black text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-gray-200 dark:shadow-none flex items-center justify-center gap-3 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  {asignaturaEditar ? "Confirmar Cambios" : "Guardar Asignatura"}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ModalAsignatura;
