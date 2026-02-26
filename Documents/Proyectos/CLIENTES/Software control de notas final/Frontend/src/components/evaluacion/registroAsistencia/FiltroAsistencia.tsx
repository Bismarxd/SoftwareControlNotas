import React from "react";

interface Props {
  busquedaEstudiante: string;
  setBusquedaEstudiante: (v: string) => void;
  filtroFechaInicio: string;
  setFiltroFechaInicio: (v: string) => void;
  filtroFechaFin: string;
  setFiltroFechaFin: (v: string) => void;
  handleAgregarClase: () => void;
}

const FiltrosAsistencia = ({
  busquedaEstudiante,
  setBusquedaEstudiante,
  filtroFechaInicio,
  setFiltroFechaInicio,
  filtroFechaFin,
  setFiltroFechaFin,
  handleAgregarClase,
}: Props) => {
  return (
    <div className="flex flex-wrap gap-6 mb-8 items-end bg-white dark:bg-gray-900 black:bg-black p-6 rounded-2xl border border-gray-200 dark:border-gray-800 black:border-zinc-900 shadow-sm transition-all">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Buscar estudiante
        </label>
        <input
          type="text"
          value={busquedaEstudiante}
          onChange={(e) => setBusquedaEstudiante(e.target.value)}
          placeholder="Nombre del estudiante..."
          className="bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all dark:text-gray-200 w-full sm:w-72 shadow-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Desde
        </label>
        <input
          type="date"
          value={filtroFechaInicio}
          onChange={(e) => setFiltroFechaInicio(e.target.value)}
          className="bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all dark:text-gray-200 shadow-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Hasta
        </label>
        <input
          type="date"
          value={filtroFechaFin}
          onChange={(e) => setFiltroFechaFin(e.target.value)}
          className="bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all dark:text-gray-200 shadow-sm"
        />
      </div>

      <div className="flex-grow flex justify-end">
        <button
          onClick={handleAgregarClase}
          className="bg-teal-600 dark:bg-teal-700 text-white px-6 py-2.5 rounded-xl hover:bg-teal-700 dark:hover:bg-teal-600 transition shadow-lg shadow-teal-500/20 font-bold hover:cursor-pointer flex items-center gap-2"
        >
          <span className="text-lg">+</span> Agregar Clase
        </button>
      </div>
    </div>
  );
};

export default FiltrosAsistencia;
