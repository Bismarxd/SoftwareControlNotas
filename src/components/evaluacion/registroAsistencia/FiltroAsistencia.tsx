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
    <div className="flex flex-wrap gap-4 mb-6 items-end bg-gray-100 p-4 rounded-lg">
      <div className="flex flex-col">
        <label className="text-sm">Buscar estudiante</label>
        <input
          type="text"
          value={busquedaEstudiante}
          onChange={(e) => setBusquedaEstudiante(e.target.value)}
          placeholder="Nombre..."
          className="border px-3 py-2 rounded-lg w-60"
        />
      </div>

      <div className="flex flex-col">
        <label className="text-sm">Desde</label>
        <input
          type="date"
          value={filtroFechaInicio}
          onChange={(e) => setFiltroFechaInicio(e.target.value)}
          className="border px-3 py-2 rounded-lg"
        />
      </div>

      <div className="flex flex-col">
        <label className="text-sm">Hasta</label>
        <input
          type="date"
          value={filtroFechaFin}
          onChange={(e) => setFiltroFechaFin(e.target.value)}
          className="border px-3 py-2 rounded-lg"
        />
      </div>

      <button
        onClick={handleAgregarClase}
        className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
      >
        Agregar Clase
      </button>
    </div>
  );
};

export default FiltrosAsistencia;
