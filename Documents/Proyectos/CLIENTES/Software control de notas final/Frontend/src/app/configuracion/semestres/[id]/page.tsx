"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import SidebarLayout from "@/components/Sidebar/SidebarLayout";
import { 
  PencilIcon, 
  TrashIcon, 
  BookOpenIcon, 
  PlusCircle, 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  Clock,
  LayoutGrid
} from "lucide-react";
import ModalAsignatura from "@/components/configuracion/ModalAsignatura";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { Asignaturas } from "@/types/semestre";
import { Semestre } from "@/types/semestre";
import { useAlert } from "@/components/ui/Alert";
import { motion, AnimatePresence } from "framer-motion";

export default function DetalleSemestre() {
  const router = useRouter();
  const { id } = useParams();
  const { showConfirm } = useConfirm();
  const { showAlert } = useAlert();

  const [semestre, setSemestre] = useState<Semestre>();
  const [asignaturas, setAsignaturas] = useState<Asignaturas[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [asignaturaEditar, setAsignaturaEditar] = useState<Asignaturas | null>(null);

  useEffect(() => {
    if (id) {
      axios
        .get(`/api/semestres/${id}`)
        .then((res) => setSemestre(res.data.semestre || res.data))
        .catch((err) => console.error("Error al cargar semestre:", err));
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchMaterias = async () => {
      try {
        const res = await axios.get(`/api/asignaturas/${id}`);
        if (res.data.status) {
          setAsignaturas(res.data.asignaturas);
        }
      } catch (error) {
        console.error("Error al cargar asignaturas:", error);
      }
    };
    fetchMaterias();
  }, [id]);

  if (!semestre) {
    return (
      <SidebarLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] animate-pulse">
          <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Cargando ciclo...</p>
        </div>
      </SidebarLayout>
    );
  }

  const handleEdit = (id: number) => {
    const asignatura = asignaturas.find((s) => s.id === id);
    if (!asignatura) return;
    setAsignaturaEditar(asignatura);
    setShowModal(true);
  };

  const handleDeleteAsignatura = async (id: number) => {
    showConfirm("¿Está seguro que desea eliminar esta asignatura?", async () => {
      try {
        const res = await axios.delete(`/api/asignaturas/${id}`);
        if (res.data.status) {
          showAlert("Asignatura eliminada", "success");
          setAsignaturas((prev) => prev.filter((s) => s.id !== id));
        } else {
          showAlert(res.data.error, "error");
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleDeleteSemestre = async () => {
    showConfirm("¿Está seguro que desea eliminar este ciclo completo?", async () => {
      try {
        const res = await axios.delete(`/api/semestres/${id}`);
        if (res.data.status) {
          showAlert("Ciclo eliminado correctamente", "success");
          router.push("/configuracion/semestres");
        } else {
          showAlert(res.data.error, "error");
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  return (
    <SidebarLayout>
      <div className="p-8 space-y-8 min-h-screen bg-gray-50 dark:bg-gray-900 black:bg-black transition-colors duration-300">
        {/* Navigation & Actions Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 max-w-7xl mx-auto w-full">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-800 black:bg-zinc-900 text-gray-700 dark:text-gray-200 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 black:border-zinc-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition font-bold"
          >
            <ArrowLeft size={18} />
            Volver
          </button>

          <button
            onClick={() => {
              setAsignaturaEditar(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-8 py-3 bg-teal-600 dark:bg-teal-700 text-white rounded-2xl shadow-lg shadow-teal-500/20 hover:bg-teal-700 dark:hover:bg-teal-600 transition font-black uppercase tracking-widest text-xs"
          >
            <PlusCircle size={20} />
            Agregar Asignatura
          </button>
        </div>

        {/* Hero Section - Semester Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto w-full"
        >
          <div className="bg-white dark:bg-gray-900 black:bg-black border border-gray-200 dark:border-gray-800 black:border-zinc-900 rounded-[2.5rem] p-8 md:p-12 shadow-xl relative overflow-hidden group">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <Calendar size={240} />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    semestre.estado 
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {semestre.estado ? "Periodo Habilitado" : "Finalizado"}
                  </span>
                  {semestre.seleccionado && (
                    <span className="px-4 py-1 bg-teal-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-teal-500/20">
                      Actual
                    </span>
                  )}
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter">
                  {semestre.nombre}
                </h1>
                
                <div className="flex flex-wrap items-center gap-6 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-teal-500" />
                    <span>Inicio: {new Date(semestre.fechaInicio).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-rose-500" />
                    <span>Fin: {new Date(semestre.fechaFin).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total Asignaturas</p>
                  <p className="text-4xl font-black text-teal-600 dark:text-teal-400">{asignaturas.length}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Subjects Grid Section */}
        <div className="max-w-7xl mx-auto w-full space-y-8">
          <div className="flex items-center gap-3 ml-4">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
              <BookOpenIcon size={20} />
            </div>
            <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">
              Asignaturas Registradas
            </h2>
          </div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {asignaturas.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-20 text-center space-y-4 bg-white/50 dark:bg-gray-800/20 black:bg-zinc-900/20 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800 black:border-zinc-800"
                >
                  <BookOpenIcon size={48} className="mx-auto text-gray-300 dark:text-gray-700" />
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs italic">
                    No hay asignaturas registradas para este periodo.
                  </p>
                </motion.div>
              ) : (
                asignaturas.map((asignatura, idx) => (
                  <motion.div
                    key={asignatura.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-white dark:bg-gray-900 black:bg-black rounded-[2rem] border border-gray-100 dark:border-gray-800 black:border-zinc-900 shadow-sm hover:shadow-2xl hover:border-teal-500/30 transition-all duration-500 p-8 space-y-6 relative overflow-hidden"
                  >
                    {/* Card Accent */}
                    <div className="absolute top-0 left-0 w-2 h-full bg-teal-500/0 group-hover:bg-teal-500 transition-all duration-500" />

                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full">
                          {asignatura.sigla}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(asignatura.id!)}
                            className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all duration-300"
                          >
                            <PencilIcon size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteAsignatura(asignatura.id!)}
                            className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all duration-300"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-2xl font-black text-gray-800 dark:text-white leading-tight pr-12 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {asignatura.nombre}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 black:bg-zinc-900/50 border border-gray-100 dark:border-gray-800 black:border-zinc-800">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nivel</p>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{asignatura.nivel || "---"}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 black:bg-zinc-900/50 border border-gray-100 dark:border-gray-800 black:border-zinc-800">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Área</p>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 pr-2 truncate">{asignatura.area || "---"}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                       <div className="flex -space-x-2">
                         {[1,2,3].map(i => (
                           <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-black bg-gray-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                             <div className="w-full h-full bg-gradient-to-br from-teal-400 to-emerald-500 opacity-20" />
                           </div>
                         ))}
                       </div>
                       <div className="flex items-center gap-2 text-gray-400">
                         <LayoutGrid size={14} />
                         <span className="text-[10px] font-black uppercase tracking-widest">{asignatura.creditos} Créditos</span>
                       </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          <div className="pt-12 flex justify-center">
            <button
              onClick={handleDeleteSemestre}
              className="group flex items-center gap-3 px-10 py-4 bg-white dark:bg-gray-800 black:bg-zinc-900 text-rose-500 border border-rose-100 dark:border-rose-900/30 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-rose-500 hover:text-white hover:shadow-2xl hover:shadow-rose-500/20 transition-all duration-500"
            >
              <TrashIcon size={18} className="group-hover:rotate-12 transition-transform" />
              Eliminar Ciclo Académico
            </button>
          </div>
        </div>

        {/* Modal Logic */}
        <AnimatePresence>
          {showModal && (
            <ModalAsignatura
              setShowModal={setShowModal}
              setAsignaturas={setAsignaturas}
              asignaturaEditar={asignaturaEditar}
            />
          )}
        </AnimatePresence>
      </div>
    </SidebarLayout>
  );
}
