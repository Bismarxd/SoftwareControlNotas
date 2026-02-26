"use client";

import React, { useEffect, useState, useMemo } from "react";
import SidebarLayout from "@/components/Sidebar/SidebarLayout";
import axios from "axios";
import { Estudiante, Competencia, PromediosPorEstudiante } from "@/types/semestre";
import TablaCalificacionesParciales from "@/components/evaluacion/calficacionesParciales/TablaCalificacionesParciales";

/*
interface PromedioParcial {
  tipo: "competencia" | "criterio" | "evidencia";
  promedio: number;
  competenciaId?: number;
  criterioId?: number;
  evidenciaId?: number;
  estudianteId: number;
}
*/

/*
interface PromediosPorEstudiante {
  [estId: number]: {
    nombre: string;
    competencias: {
      [compId: number]: {
        promedio: number;
        criterios: {
          [critId: number]: {
            promedio: number;
            evidencias: {
              [evId: number]: {
                promedio: number;
              };
            };
          };
        };
      };
    };
  };
}
*/

const CalificacionesParciales = () => {
  const [loading, setLoading] = useState(true);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [promedios, setPromedios] = useState<PromediosPorEstudiante>({});
  const [busqueda, setBusqueda] = useState("");
  const [filtroCompetenciaId, setFiltroCompetenciaId] = useState<number | "">(
    ""
  );
  const [filtroPorcentaje, setFiltroPorcentaje] = useState<number | "">("");

  useEffect(() => {
    const materiaSeleccionada = localStorage.getItem("materiaSeleccionada");
    if (!materiaSeleccionada) return;
    const asignaturaId = JSON.parse(materiaSeleccionada);

    const fetchDatos = async () => {
      setLoading(true);
      try {
        const [resEst, resComp, resProm] = await Promise.all([
          axios.get(`/api/estudiantes/listado?asignaturaId=${asignaturaId}`),
          axios.get(
            `/api/asignaturas/competencias?asignaturaId=${asignaturaId}`
          ),
          axios.get(
            `/api/evaluacion/promedioParcial?asignaturaId=${asignaturaId}`
          ),
        ]);

        if (!resEst.data.status || !resComp.data.status || !resProm.data.status)
          return;

        setEstudiantes(resEst.data.estudiantes);
        setCompetencias(resComp.data.competencias);

        // Organizar promedios
        const proms: PromediosPorEstudiante = {};

        (resProm.data.promedios as any[]).forEach((p) => {
          const estudianteId = p.estudianteId;
          const competenciaId = p.competenciaId;
          const criterioId = p.criterioId;
          const evidenciaId = p.evidenciaId;

          if (!proms[estudianteId]) {
            proms[estudianteId] = {
              nombre: p.estudiante?.nombre || "Sin nombre",
              competencias: {},
            };
          }

          const estProm = proms[estudianteId];

          // Competencia
          if (!estProm.competencias[competenciaId]) {
            estProm.competencias[competenciaId] = {
              promedio: 0,
              criterios: {},
            };
          }
          const compProm = estProm.competencias[competenciaId];

          if (p.tipo === "competencia") {
            compProm.promedio = p.promedio;
          }

          // Criterio
          if (p.tipo === "criterio") {
            if (!compProm.criterios[criterioId])
              compProm.criterios[criterioId] = { promedio: 0, evidencias: {} };
            compProm.criterios[criterioId].promedio = p.promedio;
          }

          // Evidencia
          if (p.tipo === "evidencia") {
            if (!compProm.criterios[criterioId])
              compProm.criterios[criterioId] = { promedio: 0, evidencias: {} };
            compProm.criterios[criterioId].evidencias[evidenciaId] = {
              promedio: p.promedio,
            };
          }
        });

        setPromedios(proms);
        console.log(proms);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDatos();
  }, []);

  console.log(promedios);

  const estudiantesFiltrados = useMemo(() => {
    return estudiantes.filter((est) =>
      est.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [estudiantes, busqueda]);

  const competenciasFiltradas = useMemo(() => {
    let lista = [...competencias];
    if (filtroCompetenciaId !== "") {
      lista = lista.filter((comp) => comp.id === filtroCompetenciaId);
    }
    if (filtroPorcentaje !== "") {
      lista = lista.filter(
        (comp) => comp.porcentaje === Number(filtroPorcentaje)
      );
    }
    return lista;
  }, [competencias, filtroCompetenciaId, filtroPorcentaje]);

  return (
    <SidebarLayout>
      <div className="p-8 space-y-8 min-h-screen bg-gray-50 dark:bg-gray-900 black:bg-black transition-colors duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
            Calificaciones Parciales
          </h2>
        </div>

        {/* Filtros Premium */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-white dark:bg-gray-800/50 black:bg-zinc-900/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 black:border-zinc-800 shadow-sm transition-all">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Estudiante
            </label>
            <input
              type="text"
              placeholder="Buscar estudiante..."
              className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all dark:text-gray-200"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Competencia
            </label>
            <select
              className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all dark:text-gray-200"
              value={filtroCompetenciaId}
              onChange={(e) =>
                setFiltroCompetenciaId(
                  e.target.value ? Number(e.target.value) : ""
                )
              }
            >
              <option value="">Todas las competencias</option>
              {competencias.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.tipo}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Porcentaje
            </label>
            <input
              type="number"
              placeholder="Filtrar %..."
              className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all dark:text-gray-200"
              value={filtroPorcentaje}
              onChange={(e) =>
                setFiltroPorcentaje(e.target.value ? Number(e.target.value) : "")
              }
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white dark:bg-gray-900 black:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 black:border-zinc-900 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Cargando registros...
              </p>
            </div>
          ) : estudiantesFiltrados.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 dark:text-gray-400 font-medium italic">
                No se encontraron estudiantes con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <TablaCalificacionesParciales
              estudiantes={estudiantesFiltrados}
              competencias={competenciasFiltradas}
              promedios={promedios}
            />
          )}
        </div>
      </div>
    </SidebarLayout>
  );
};

export default CalificacionesParciales;
