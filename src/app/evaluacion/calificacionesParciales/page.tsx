"use client";

import React, { useEffect, useState, useMemo } from "react";
import SidebarLayout from "@/components/Sidebar/SidebarLayout";
import axios from "axios";
import { Estudiante, Competencia } from "@/types/semestre";
import TablaCalificacionesParciales from "@/components/evaluacion/calficacionesParciales/TablaCalificacionesParciales";

interface PromedioParcial {
  tipo: "competencia" | "criterio" | "evidencia";
  promedio: number;
  competenciaId?: number;
  criterioId?: number;
  evidenciaId?: number;
  estudianteId: number;
}

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
      <div className="p-6 space-y-6">
        <h2 className="text-3xl font-bold text-gray-700">
          Calificaciones Parciales
        </h2>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <input
            type="text"
            placeholder="Buscar estudiante..."
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-64"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <select
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-64"
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

          <input
            type="number"
            placeholder="Filtrar por porcentaje..."
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-40"
            value={filtroPorcentaje}
            onChange={(e) =>
              setFiltroPorcentaje(e.target.value ? Number(e.target.value) : "")
            }
          />
        </div>

        {/* Tabla */}
        {loading ? (
          <p className="text-gray-500 text-center py-6">
            Cargando estudiantes...
          </p>
        ) : estudiantesFiltrados.length === 0 ? (
          <p className="text-gray-500 text-center py-6">
            No se encontraron estudiantes.
          </p>
        ) : (
          <TablaCalificacionesParciales
            estudiantes={estudiantesFiltrados}
            competencias={competenciasFiltradas}
            promedios={promedios}
          />
        )}
      </div>
    </SidebarLayout>
  );
};

export default CalificacionesParciales;
