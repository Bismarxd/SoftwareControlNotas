"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import SidebarLayout from "@/components/Sidebar/SidebarLayout";
import { Eye, Pencil, PlusCircle, TrashIcon, Info } from "lucide-react";
import ModalCompetencias from "@/components/asignaturas/ModalCompetencia";
import { Competencia } from "@/types/semestre";
import Tooltip from "@/components/ui/Tooltip";

const Competencias = () => {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [competenciasEditar, setCompetenciasEditar] =
    useState<Competencia | null>(null);
  const [expandedDesc, setExpandedDesc] = useState<{ [id: number]: boolean }>(
    {}
  );

  // Traer competencias
  useEffect(() => {
    const materiaIdString = localStorage.getItem("materiaSeleccionada");
    if (!materiaIdString) return;

    const materiaId = JSON.parse(materiaIdString);

    const fetchCompetencias = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `/api/asignaturas/competencias?asignaturaId=${materiaId}`
        );
        const data = res.data;

        if (data.status) {
          setCompetencias(data.competencias);
        } else {
          console.error(data.message, data.error);
        }
      } catch (error) {
        console.error("Error al obtener las competencias:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetencias();
  }, []);

  // Total porcentaje
  const totalPorcentaje = useMemo(
    () => (competencias || []).reduce((acc, c) => acc + (c.porcentaje || 0), 0),
    [competencias]
  );

  const handleEdit = (id: number) => {
    const competencia = competencias.find((s) => s.id === id);
    if (!competencia) return;
    setCompetenciasEditar(competencia);
    setShowModal(true);
  };

  const handleView = (id: number) => {
    router.push(`/asignaturas/competencias/${id}`);
  };

  const toggleDesc = (id: number) => {
    setExpandedDesc((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <SidebarLayout>
      <div className="p-6">
        {/* Encabezado y botón añadir */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Competencias
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 hover:cursor-pointer bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg shadow-md transition"
          >
            <PlusCircle size={20} />
            Añadir Competencia
          </button>
        </div>

        {/* Resumen / dashboard */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-gradient-to-br from-emerald-100 to-emerald-500 rounded-3xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-1 text-center">
            <p className="text-gray-700 text-sm uppercase tracking-wide">
              Total Competencias
            </p>
            <p className="text-2xl font-extrabold text-emerald-900 mt-2">
              {competencias.length}
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-yellow-100 to-yellow-500 rounded-3xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-1 text-center">
            <p className="text-gray-600 text-sm uppercase tracking-wide">
              Porcentaje Total
            </p>
            <p
              className={`text-2xl font-extrabold mt-2 ${
                totalPorcentaje === 100
                  ? "text-green-600"
                  : totalPorcentaje > 100
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              {totalPorcentaje}%
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-blue-100 to-blue-500 rounded-3xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-1 text-center">
            <p className="text-gray-600 text-sm uppercase tracking-wide">
              Competencia Mayor %
            </p>
            <p className="text-2xl font-extrabold text-blue-700 mt-2">
              {competencias.length
                ? `${Math.max(...competencias.map((c) => c.porcentaje || 0))}%`
                : "0%"}
            </p>
          </div>
        </div>

        {/* Barra de porcentaje total */}
        <div className="mb-6">
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${
                totalPorcentaje === 100
                  ? "bg-green-500"
                  : totalPorcentaje > 100
                  ? "bg-red-500"
                  : "bg-yellow-500"
              }`}
              style={{ width: `${Math.min(totalPorcentaje, 100)}%` }}
            ></div>
          </div>
          {totalPorcentaje !== 100 && (
            <p className="text-sm mt-1 text-gray-500 flex items-center gap-1">
              <Info size={16} /> La suma de los porcentajes debe ser 100%.
            </p>
          )}
        </div>

        {/* Lista de competencias */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-gray-200 h-40 rounded-xl"
              ></div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competencias.map((c) => {
              const isExpanded = expandedDesc[c.id] || false;
              return (
                <div
                  key={c.id}
                  className="relative border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-lg transition transform hover:-translate-y-1 group bg-white"
                >
                  {/* Header tarjeta */}
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-800">
                      {c.tipo}
                    </span>
                    <span className="text-gray-600 text-sm">
                      {c.porcentaje}%
                    </span>
                  </div>

                  {/* Barra interna */}
                  <div className="w-full h-2 bg-gray-200 rounded-full mb-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                      style={{ width: `${c.porcentaje}%` }}
                    ></div>
                  </div>

                  {/* Descripción con acordeón */}
                  <p className="text-gray-700 text-sm md:text-base">
                    {isExpanded ? (
                      <span
                        dangerouslySetInnerHTML={{ __html: c.descripcion }}
                      />
                    ) : (
                      c.descripcion.replace(/<[^>]+>/g, "").slice(0, 100) +
                      "..."
                    )}
                  </p>

                  {c.descripcion.length > 100 && (
                    <button
                      onClick={() => toggleDesc(c.id)}
                      className="text-blue-600 text-xs mt-1 hover:underline"
                    >
                      {isExpanded ? "Ver menos" : "Ver más"}
                    </button>
                  )}

                  <p className="text-gray-400 text-xs mt-2">
                    Creado: {new Date(c.createdAt).toLocaleDateString()}
                  </p>

                  {/* Botones de acción */}
                  <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <div className="relative group">
                      <Tooltip content="Editar">
                        <button
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition hover:cursor-pointer"
                          onClick={() => handleEdit(c.id)}
                        >
                          <Pencil size={18} />
                        </button>
                      </Tooltip>
                    </div>
                    <div className="relative group">
                      <Tooltip content="Ver">
                        <button
                          className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition hover:cursor-pointer"
                          onClick={() => handleView(c.id)}
                        >
                          <Eye size={18} />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal lateral de competencias */}
        {showModal && (
          <ModalCompetencias
            showModal={showModal}
            setShowModal={setShowModal}
            competencias={competencias}
            setCompetencias={setCompetencias}
            setCompetenciasEditar={setCompetenciasEditar}
            competenciasEditar={competenciasEditar}
          />
        )}
      </div>
    </SidebarLayout>
  );
};

export default Competencias;
