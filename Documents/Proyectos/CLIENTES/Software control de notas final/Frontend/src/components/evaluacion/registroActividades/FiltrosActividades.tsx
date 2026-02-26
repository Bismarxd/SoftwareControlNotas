"use client";

import React from "react";
import { Search, Filter, X, Layers } from "lucide-react";
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

const selectBase =
  "mt-1 w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all";

const selectDisabled =
  "mt-1 w-full bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-400 dark:text-gray-600 cursor-not-allowed";

const labelBase =
  "text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-1";

const FiltrosActividades: React.FC<FiltrosActividadesProps> = ({
  competencias,
  filtroCompetencia,
  setFiltroCompetencia,
  filtroCriterio,
  setFiltroCriterio,
  filtroEvidencia,
  setFiltroEvidencia,
  busqueda,
  setBusqueda,
  limpiarFiltros,
}) => {
  const competenciaSel = competencias.find((c) => c.id === Number(filtroCompetencia));
  const criterioSel = competenciaSel?.criterioevaluacion.find((c) => c.id === Number(filtroCriterio));

  return (
    <div className="w-full bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        <h2 className="text-sm font-extrabold text-gray-700 dark:text-white uppercase tracking-widest">
          Filtros
        </h2>
        <button
          onClick={limpiarFiltros}
          className="ml-auto flex items-center gap-1 text-xs px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold rounded-lg transition-all cursor-pointer border border-rose-100 dark:border-rose-900/30"
        >
          <X className="w-3.5 h-3.5" />
          Limpiar
        </button>
      </div>

      {/* Filtros grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* Buscador actividad */}
        <div className="md:col-span-1">
          <label className={labelBase}>
            <Search className="w-3.5 h-3.5" />
            Buscar actividad
          </label>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
            <input
              type="text"
              placeholder="Nombre o fecha..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="mt-1 w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Competencia */}
        <div>
          <label className={labelBase}>
            <Layers className="w-3.5 h-3.5" />
            Competencia
          </label>
          <select
            value={filtroCompetencia}
            onChange={(e) => {
              setFiltroCompetencia(e.target.value);
              setFiltroCriterio("");
              setFiltroEvidencia("");
            }}
            className={selectBase}
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
          <label className={labelBase}>Criterio</label>
          <select
            value={filtroCriterio}
            onChange={(e) => {
              setFiltroCriterio(e.target.value);
              setFiltroEvidencia("");
            }}
            disabled={!filtroCompetencia}
            className={!filtroCompetencia ? selectDisabled : selectBase}
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
          <label className={labelBase}>Evidencia</label>
          <select
            value={filtroEvidencia}
            onChange={(e) => setFiltroEvidencia(e.target.value)}
            disabled={!filtroCriterio}
            className={!filtroCriterio ? selectDisabled : selectBase}
          >
            <option value="">Todas</option>
            {criterioSel?.evidencia.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.nombre} ({ev.tipo})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FiltrosActividades;
