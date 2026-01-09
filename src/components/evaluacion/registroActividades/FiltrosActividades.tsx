"use client";

import React from "react";
import { Search, Filter, X, Layers, ListFilter } from "lucide-react";
import { Competencia } from "@/types/semestre";

interface FiltrosActividadesProps {
  competencias: Competencia[];
  filtroCompetencia: string;
  setFiltroCompetencia: (value: string) => void;
  filtroCriterio: string;
  setFiltroCriterio: (value: string) => void;
  filtroEvidencia: string;
  setFiltroEvidencia: (value: string) => void;
  ordenActividades: string;
  setOrdenActividades: (value: string) => void;
  busqueda: string;
  setBusqueda: (value: string) => void;
  limpiarFiltros: () => void;
}

const FiltrosActividades: React.FC<FiltrosActividadesProps> = ({
  competencias,
  filtroCompetencia,
  setFiltroCompetencia,
  filtroCriterio,
  setFiltroCriterio,
  filtroEvidencia,
  setFiltroEvidencia,
  ordenActividades,
  setOrdenActividades,
  busqueda,
  setBusqueda,
  limpiarFiltros,
}) => {
  const competenciaSel = competencias.find(
    (c) => c.id === Number(filtroCompetencia)
  );

  const criterioSel = competenciaSel?.criterioevaluacion.find(
    (c) => c.id === Number(filtroCriterio)
  );

  return (
    <div className="w-full p-4 mb-4 bg-white rounded-2xl shadow-lg border border-gray-100">
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-5 h-5 text-teal-600" />
        <h2 className="text-lg font-semibold text-gray-700">
          Filtros de actividades
        </h2>

        <button
          onClick={limpiarFiltros}
          className="ml-auto flex items-center gap-1 text-xs px-3 py-1.5 
          bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-all hover:cursor-pointer"
        >
          <X className="w-4 h-4" />
          Limpiar
        </button>
      </div>

      {/* GRID DE FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Buscador */}
        <div className="col-span-1 md:col-span-2">
          <label className="font-medium text-sm text-gray-600 flex items-center gap-1">
            <Search className="w-4 h-4 text-gray-500" />
            Buscar Actividad
          </label>
          <input
            type="text"
            placeholder="Nombre, fecha o descripción…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 shadow-sm focus:ring-2 
            focus:ring-teal-500 focus:border-teal-500 transition-all"
          />
        </div>

        {/* Ordenar */}
        {/* <div>
          <label className="font-medium text-sm text-gray-600 flex items-center gap-1">
            <ListFilter className="w-4 h-4 text-gray-500" />
            Ordenar
          </label>
          <select
            value={ordenActividades}
            onChange={(e) => setOrdenActividades(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 shadow-sm focus:ring-2 
            focus:ring-teal-500 focus:border-teal-500 transition-all"
          >
            <option value="fecha_asc">Fecha: Ascendente</option>
            <option value="fecha_desc">Fecha: Descendente</option>
            <option value="nombre_asc">Nombre: A → Z</option>
            <option value="nombre_desc">Nombre: Z → A</option>
          </select>
        </div> */}

        {/* Competencia */}
        <div>
          <label className="font-medium text-sm text-gray-600 flex items-center gap-1">
            <Layers className="w-4 h-4 text-gray-500" />
            Competencia
          </label>
          <select
            value={filtroCompetencia}
            onChange={(e) => {
              setFiltroCompetencia(e.target.value);
              setFiltroCriterio("");
              setFiltroEvidencia("");
            }}
            className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 shadow-sm focus:ring-2 
            focus:ring-teal-500 focus:border-teal-500 transition-all"
          >
            <option value="">Todas</option>
            {competencias.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.tipo}
              </option>
            ))}
          </select>
        </div>

        {/* Criterio */}
        <div>
          <label className="font-medium text-sm text-gray-600">Criterio</label>
          <select
            value={filtroCriterio}
            onChange={(e) => {
              setFiltroCriterio(e.target.value);
              setFiltroEvidencia("");
            }}
            disabled={!filtroCompetencia}
            className={`mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 shadow-sm transition-all
            ${
              !filtroCompetencia
                ? "bg-gray-100 cursor-not-allowed"
                : "focus:ring-2 focus:ring-teal-500"
            }
          `}
          >
            <option value="">Todos</option>
            {competenciaSel?.criterioevaluacion.map((crit) => (
              <option key={crit.id} value={crit.id}>
                {crit.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Evidencia */}
        <div>
          <label className="font-medium text-sm text-gray-600">Evidencia</label>
          <select
            value={filtroEvidencia}
            onChange={(e) => setFiltroEvidencia(e.target.value)}
            disabled={!filtroCriterio}
            className={`mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 shadow-sm transition-all
            ${
              !filtroCriterio
                ? "bg-gray-100 cursor-not-allowed"
                : "focus:ring-2 focus:ring-teal-500"
            }
          `}
          >
            <option value="">Todas</option>
            {criterioSel?.evidencia.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.nombre}({ev.tipo})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FiltrosActividades;
