"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Pencil, PlusCircle, CheckCircle, Eye } from "lucide-react";
import ModalSemestre from "@/components/configuracion/ModalSemestre";
import SidebarLayout from "@/components/Sidebar/SidebarLayout";
import Tooltip from "@/components/ui/Tooltip";

import { useAlert } from "@/components/ui/Alert";
import { useConfirm } from "@/components/ui/ConfirmDialog";

import { Semestre } from "@/types/semestre";

const Semestres = () => {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [semestres, setSemestres] = useState<Semestre[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [semestreEditar, setSemestreEditar] = useState<Semestre | null>(null);

  // Cargar los semestres
  useEffect(() => {
    const fetchSemestres = async () => {
      try {
        await axios.get("/api/semestres").then((res) => {
          const data = res.data;
          console.log(data);
          if (data.status) {
            setSemestres(data.semestres);
          } else {
            console.error("Error al cargar semestres:", data.message);
            setError("No se pudieron cargar los semestres.");
          }
        });
      } catch (error) {
        console.error("Error al cargar semestres:", error);
        setError("No se pudieron cargar los semestres.");
      } finally {
        setLoading(false);
      }
    };

    fetchSemestres();
  }, []);

  // Loading
  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex justify-center items-center h-full">
          <p className="text-gray-600">Cargando semestres...</p>
        </div>
      </SidebarLayout>
    );
  }

  // Error
  if (error) {
    return (
      <SidebarLayout>
        <div className="flex justify-center items-center h-full">
          <p className="text-red-500">{error}</p>
        </div>
      </SidebarLayout>
    );
  }

  //Abre el modal
  const handleAdd = () => {
    setShowModal(true);
    setSemestreEditar(null);
  };

  // Para editar
  const handleEdit = (id: number) => {
    const semestre = semestres.find((s) => s.id === id);
    if (!semestre) return;

    setSemestreEditar(semestre);
    setShowModal(true);
  };

  // Guardar cambios del semestre editado
  const handleUpdate = async (datosActualizados: Partial<Semestre>) => {
    try {
      const res = await axios.put(
        `/api/semestres/${semestreEditar?.id}`,
        datosActualizados
      );
      const data = res.data;

      if (data.status) {
        const actualizado = data.semestreActualizado;

        setSemestres((prev) =>
          prev.map((s) => (s.id === actualizado.id ? actualizado : s))
        );

        showAlert("Semestre actualizado correctamente", "success");
        setShowModal(false);
        setSemestreEditar(null);
      } else {
        console.error(data.error);
        showAlert(data.error, "error");
      }
    } catch (error) {
      console.error("Error al actualizar semestre:", error);
      showAlert("Error al actualizar semestre", "error");
    }
  };

  // const handleDelete = (id: number) => {
  //   if (confirm("¿Seguro que deseas eliminar este semestre?")) {
  //     setSemestres((prev) => prev.filter((s) => s.id !== id));
  //   }
  // };

  const handleVer = (id: number) => {
    router.push(`/configuracion/semestres/${id}`);
  };

  // Seleccionar semestre
  const handleSelect = async (id: number) => {
    showConfirm(
      "¿Deseas seleccionar este semestre como el actual?",
      async () => {
        try {
          const res = await axios.patch("/api/semestres/seleccionar", { id });
          const actualizado = res.data;

          // Guarda el semestre seleccionado
          localStorage.setItem(
            "semestreSeleccionado",
            JSON.stringify(actualizado)
          );

          showAlert(
            `Semestre "${actualizado.nombre}" fue seleccionado.`,
            "success"
          );

          window.location.reload(); // 🔄 Recarga todo
        } catch (err) {
          console.error("Error al seleccionar semestre:", err);
          showAlert("Error al seleccionar semestre", "error");
        }
      }
    );
  };

  return (
    <SidebarLayout>
      <div className="p-8 space-y-8 min-h-screen bg-gray-50 dark:bg-gray-900 black:bg-black transition-colors duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">
              Gestión de Semestres
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Administra los ciclos académicos del sistema</p>
          </div>
          
          <button
            onClick={handleAdd}
            className="flex items-center justify-center gap-2 bg-teal-600 dark:bg-teal-700 text-white px-8 py-3 rounded-2xl shadow-lg shadow-teal-500/20 hover:bg-teal-700 dark:hover:bg-teal-600 transition font-black uppercase tracking-widest text-sm"
          >
            <PlusCircle size={20} />
            Agregar Semestre
          </button>
        </div>

        {/* Timeline Estilizado */}
        <div className="max-w-4xl mx-auto py-10 px-4">
          <div className="relative border-l-2 border-dashed border-gray-200 dark:border-gray-800 black:border-zinc-800 ml-4 space-y-12">
            {semestres.map((sem) =>
              sem ? (
                <div key={sem.id} className="relative pl-10 group">
                  {/* Punto del Timeline */}
                  <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-white dark:border-gray-900 black:border-black transition-all duration-300 ${
                    sem.seleccionado ? 'bg-teal-500 scale-125 shadow-[0_0_15px_rgba(20,184,166,0.5)]' : 'bg-gray-200 dark:bg-gray-700 black:bg-zinc-800 group-hover:bg-teal-400'
                  }`} />

                  {/* Tarjeta de Semestre */}
                  <div
                    className={`p-8 rounded-3xl border transition-all duration-500 relative overflow-hidden group/card ${
                      sem.seleccionado
                        ? "bg-white dark:bg-gray-800 black:bg-zinc-900 border-teal-500 shadow-2xl shadow-teal-500/10"
                        : "bg-white dark:bg-gray-900 black:bg-black border-gray-100 dark:border-gray-800 black:border-zinc-900 shadow-sm hover:shadow-xl hover:border-teal-500/30"
                    }`}
                  >
                    {sem.seleccionado && (
                      <div className="absolute top-0 right-0 py-1.5 px-4 bg-teal-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-bl-xl shadow-lg">
                        Activo Actual
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                      <div className="space-y-4 flex-1">
                        <div>
                          <h2 className="text-2xl font-black text-gray-900 dark:text-white group-hover/card:text-teal-600 dark:group-hover/card:text-teal-400 transition-colors">
                            {sem.nombre}
                          </h2>
                          <p className="text-gray-400 dark:text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">
                            {new Date(sem.fechaInicio).toLocaleDateString("es-ES", { month: 'long', year: 'numeric' })} - {new Date(sem.fechaFin).toLocaleDateString("es-ES", { month: 'long', year: 'numeric' })}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm ring-1 ring-inset ${
                              sem.estado
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20"
                                : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 ring-gray-200 dark:ring-gray-700"
                            }`}
                          >
                            {sem.estado ? "Periodo Habilitado" : "Finalizado"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <button
                          onClick={() => handleSelect(sem.id)}
                          disabled={sem.seleccionado}
                          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                            sem.seleccionado
                              ? "bg-teal-500/10 text-teal-600 cursor-default ring-1 ring-teal-500/20"
                              : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-teal-600 hover:text-white shadow-sm"
                          }`}
                        >
                          <CheckCircle size={18} />
                          <span className="uppercase tracking-widest text-xs">{sem.seleccionado ? "Seleccionado" : "Seleccionar"}</span>
                        </button>

                        <div className="flex gap-2 w-full sm:w-auto">
                          <Tooltip content="Editar detalles">
                            <button
                              onClick={() => handleEdit(sem.id)}
                              className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition shadow-sm"
                            >
                              <Pencil size={18} />
                            </button>
                          </Tooltip>

                          <Tooltip content="Ver asignaturas">
                            <button
                              onClick={() => handleVer(sem.id)}
                              className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition shadow-sm"
                            >
                              <Eye size={18} />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null
            )}
          </div>
        </div>
      </div>
    {/* MODAL */}
    {showModal && (
      <ModalSemestre
        setShowModal={setShowModal}
        setSemestre={setSemestres}
        semestreEditar={semestreEditar}
        onUpdate={handleUpdate}
      />
    )}
  </SidebarLayout>
);
};

export default Semestres;
