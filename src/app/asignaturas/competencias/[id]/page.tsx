"use client";
import SidebarLayout from "@/components/Sidebar/SidebarLayout";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  PlusCircle,
  TrashIcon,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileText,
  Trash2,
} from "lucide-react";
import { Disclosure } from "@headlessui/react";
import { Competencia, Criterio } from "@/types/semestre";
import { useAlert } from "@/components/ui/Alert";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import axios from "axios";
import ModalCriterio from "@/components/asignaturas/ModalCriterio";
import ModalEvidencia from "@/components/asignaturas/ModalEvidencia";
import Tooltip from "@/components/ui/Tooltip";

const CriteriosEvaluacion = () => {
  const router = useRouter();
  const params = useParams();
  const idCom = params.id;

  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [showModal, setShowModal] = useState(false);
  const [showModalEvidencia, setShowModalEvidencia] = useState(false);
  const [criterioSeleccionado, setCriterioSeleccionado] =
    useState<Criterio | null>(null);
  const [competencia, setCompetencia] = useState<Competencia>();
  const [criterios, setCriterios] = useState<Criterio[]>([]);
  const [criteriosEditar, setCriteriosEditar] = useState<Criterio | null>(null);

  const [expandedEvidencias, setExpandedEvidencias] = useState<number[]>([]);

  const toggleEvidencias = (id: number) => {
    setExpandedEvidencias((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Obtener competencia
  useEffect(() => {
    const obtenerCompetencia = async () => {
      try {
        const res = await axios.get(`/api/asignaturas/competencias/${idCom}`);
        const data = res.data;
        if (data.status) {
          setCompetencia(data.competencia);
          setCriterios(data.competencia.criterioevaluacion || []);
        }
      } catch (error) {
        console.error(error);
        showAlert("Error al cargar la competencia", "error");
      }
    };
    obtenerCompetencia();
  }, []);

  const handleEdit = (id: number) => {
    const criterio = criterios.find((s) => s.id === id);
    if (!criterio) return;
    setCriteriosEditar(criterio);
    setShowModal(true);
  };

  const handleDeleteCriterio = (idCriterio: number) => {
    showConfirm("¿Está seguro que desea eliminar el CRITERIO?", async () => {
      try {
        const res = await axios.delete(
          `/api/asignaturas/competencias/criterios/${idCriterio}`
        );
        const data = res.data;
        if (data.status) {
          showAlert("Criterio eliminado correctamente", "success");
          setCriterios((prev) => prev.filter((c) => c.id !== idCriterio));
        }
      } catch (error) {
        console.error(error);
        showAlert("Error al eliminar el criterio", "error");
      }
    });
  };

  const handleAddEvidencia = (criterio: Criterio) => {
    setCriterioSeleccionado(criterio);
    setShowModalEvidencia(true);
  };

  // Función para eliminar competencia
  const handleDeleteCompetencia = () => {
    if (!competencia) return;

    showConfirm(
      `¿Está seguro que desea eliminar la competencia "${competencia.tipo}"?`,
      async () => {
        try {
          const res = await axios.delete(
            `/api/asignaturas/competencias/${competencia.id}`
          );
          if (res.data.status) {
            showAlert("Competencia eliminada correctamente", "success");
            router.back(); // Volvemos a la página anterior
          } else {
            showAlert(
              res.data.message || "Error al eliminar la competencia",
              "error"
            );
          }
        } catch (error) {
          console.error(error);
          showAlert("Error al eliminar la competencia", "error");
        }
      }
    );
  };

  return (
    <SidebarLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-row justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg shadow-sm transition"
          >
            <ArrowLeft size={18} />
            Volver
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 hover:cursor-pointer bg-teal-600 hover:bg-teal-700 text-white px-2 py-2 rounded-lg shadow-md transition"
          >
            <PlusCircle size={20} />
            Añadir Criterio de Evaluación
          </button>
        </div>
        {/* Competencia */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6 transition hover:shadow-2xl hover:scale-[1.02] duration-300">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-bold text-gray-800">
              Competencia: {competencia?.tipo}
            </h2>
            <span className="text-sm font-semibold text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
              {competencia?.porcentaje}% del total
            </span>
          </div>

          <p
            className="text-gray-700 leading-relaxed mb-2"
            dangerouslySetInnerHTML={{ __html: competencia?.descripcion || "" }}
          ></p>

          <div className="mt-4">
            <p className="text-gray-600 font-medium">
              Valoración:{" "}
              <span className="font-bold text-gray-800">
                {competencia?.porcentaje}%
              </span>
            </p>
          </div>
        </div>

        {/* Lista de criterios */}
        {/* Lista de criterios de evaluación tipo ficha */}
        <div className="grid md:grid-cols-1 gap-6">
          <div className="grid md:grid-cols-1 gap-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Criterios de Evaluación
            </h2>

            {criterios.map((c) => (
              <Disclosure key={c.id}>
                {({ open }) => (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 transition hover:shadow-2xl hover:-translate-y-1 duration-300 relative group">
                    {/* Header de la ficha */}
                    <Disclosure.Button className="w-full text-left flex justify-between items-center font-semibold text-gray-800 text-lg">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-blue-500" />
                        <span>{c.nombre}</span>
                      </div>
                      {/* <span
                        className={`px-2 py-1 rounded-full text-sm font-medium ${
                          c.porcentaje >= 80
                            ? "bg-green-100 text-green-700"
                            : c.porcentaje >= 50
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {c.porcentaje}%
                      </span> */}
                    </Disclosure.Button>

                    {/* Barra de porcentaje */}
                    {/* <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500 transition-all duration-700"
                        style={{ width: `${c.porcentaje}%` }}
                      ></div>
                    </div> */}

                    {/* Descripción */}
                    <p
                      className="text-gray-700 text-sm mt-2"
                      dangerouslySetInnerHTML={{ __html: c.descripcion || "" }}
                    ></p>
                    {/* <span className="text-gray-400 text-xs block mt-1">
                      Representa {c.porcentaje}% dentro de esta competencia
                    </span> */}

                    {/* Acordeón de evidencias */}
                    {c.evidencia?.length > 0 && (
                      <div className="mt-3 border-t pt-3">
                        <button
                          onClick={() => toggleEvidencias(c.id)}
                          className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 hover:text-gray-900 transition bg-gray-100 rounded-md px-3 py-2 shadow-sm hover:shadow-md hover:cursor-pointer"
                        >
                          {expandedEvidencias.includes(c.id)
                            ? "Ocultar Evidencias"
                            : "Mostrar Evidencias"}
                          {expandedEvidencias.includes(c.id) ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </button>

                        <div
                          className={`overflow-hidden transition-all duration-500 ${
                            expandedEvidencias.includes(c.id)
                              ? "max-h-96 mt-2"
                              : "max-h-0"
                          }`}
                        >
                          <ul className="text-gray-600 text-sm bg-gray-50 rounded-md shadow-inner p-3 space-y-2">
                            {c.evidencia.map((e) => (
                              <li
                                key={e.id}
                                className="flex justify-between items-center py-1 px-2 rounded-md hover:bg-gray-100 transition"
                              >
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-blue-500" />
                                  <span className="font-medium">
                                    {e.nombre}
                                  </span>{" "}
                                  - <span>{e.tipo}</span>
                                </div>
                                <div className="flex gap-1">
                                  <Tooltip content="Editar">
                                    <button className="p-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition hover:cursor-pointer">
                                      <Pencil size={16} />
                                    </button>
                                  </Tooltip>
                                  <Tooltip content="Eliminar">
                                    <button className="p-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition hover:cursor-pointer">
                                      <Trash2 size={16} />
                                    </button>
                                  </Tooltip>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <div className="grid grid-cols-1 gap-4">
                        <Tooltip content="Añadir Evidencia">
                          <button
                            className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-500 hover:text-white transition flex items-center gap-1 hover:cursor-pointer"
                            onClick={() => handleAddEvidencia(c)}
                          >
                            <PlusCircle size={18} /> Añadir Evidencia
                          </button>
                        </Tooltip>
                        <div>
                          {" "}
                          <Tooltip content="Editar Competencia">
                            <button
                              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition hover:cursor-pointer"
                              onClick={() => handleEdit(c.id)}
                            >
                              <Pencil size={18} />
                            </button>
                          </Tooltip>
                          <Tooltip content="Eliminar Competencia">
                            <button
                              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition hover:cursor-pointer"
                              onClick={() => handleDeleteCriterio(c.id)}
                            >
                              <Trash2 size={18} />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Disclosure>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mb-2 mt-5">
          <button
            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition hover:cursor-pointer"
            onClick={handleDeleteCompetencia}
          >
            <TrashIcon size={18} /> Eliminar Competencia
          </button>
        </div>
      </div>

      {/* Modales */}
      {showModal && (
        <ModalCriterio
          setShowModal={setShowModal}
          showModal={showModal}
          criterios={competencia?.criterioevaluacion || []}
          setCriterios={setCriterios}
          idCompetencia={competencia?.id || Number(idCom)}
          setCriteriosEditar={setCriteriosEditar}
          criteriosEditar={criteriosEditar}
        />
      )}

      {showModalEvidencia && criterioSeleccionado && (
        <ModalEvidencia
          setShowModal={setShowModalEvidencia}
          showModal={showModalEvidencia}
          criterio={criterioSeleccionado}
          setCriterios={setCriterios}
          criterios={criterios}
        />
      )}
    </SidebarLayout>
  );
};

export default CriteriosEvaluacion;
