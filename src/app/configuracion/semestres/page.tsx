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
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Semestres</h1>
          <button
            onClick={handleAdd}
            className="flex hover:cursor-pointer items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg shadow-md transition"
          >
            <PlusCircle size={20} />
            Agregar Semestre
          </button>
        </div>

        {/* Lista los semestre */}
        <div className="relative border-l-4 border-teal-500 ml-4">
          {semestres.map((sem) =>
            sem ? (
              <div key={sem.id} className="mb-8 ml-6 group">
                <span className="absolute -left-3.5 flex items-center justify-center w-7 h-7 bg-teal-500 rounded-full ring-4 ring-white">
                  <span className="w-3 h-3 bg-white rounded-full group-hover:bg-gray-200 transition"></span>
                </span>

                <div
                  className={`transition rounded-xl p-5 border ${
                    sem.seleccionado
                      ? "bg-cyan-50 border-cyan-400 shadow-lg"
                      : "bg-white border-gray-100 shadow-md hover:shadow-lg"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        {sem.nombre}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {new Date(sem.fechaInicio).toLocaleDateString()} -{" "}
                        {new Date(sem.fechaFin).toLocaleDateString()}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                            sem.estado
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {sem.estado ? "Activo" : "Finalizado"}
                        </span>

                        {sem.seleccionado && (
                          <span className="px-2 py-1 text-xs text-white bg-teal-500 rounded">
                            Seleccionado
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {/* Botón Seleccionar */}
                      <button
                        onClick={() => handleSelect(sem.id)}
                        disabled={sem.seleccionado}
                        className={`flex items-center hover:cursor-pointer gap-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                          sem.seleccionado
                            ? "bg-cyan-200 text-neutral-800 cursor-default"
                            : "bg-gray-100 text-gray-600 hover:bg-cyan-100"
                        }`}
                      >
                        <CheckCircle size={16} />
                        {sem.seleccionado ? "Seleccionado" : "Seleccionar"}
                      </button>

                      {/* Editar */}
                      <Tooltip content="Editar">
                        <button
                          onClick={() => handleEdit(sem.id)}
                          className="p-2 hover:cursor-pointer rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                        >
                          <Pencil size={18} />
                        </button>
                      </Tooltip>

                      {/* Eliminar */}
                      {/* <button
                        onClick={() => handleDelete(sem.id)}
                        className="p-2 rounded-lg hover:cursor-pointer bg-red-50 text-red-600 hover:bg-red-100 transition"
                      >
                        <Trash2 size={18} />
                      </button> */}

                      {/* Ver */}
                      <Tooltip content="Ver">
                        <button
                          onClick={() => handleVer(sem.id)}
                          className="p-2 rounded-lg hover:cursor-pointer bg-red-50 text-green-600 hover:bg-green-100 transition"
                        >
                          <Eye size={18} />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            ) : null
          )}
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
      </div>
    </SidebarLayout>
  );
};

export default Semestres;
