"use client";

import React from "react";

interface EncabezadoTablaProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  modoGeneral: "nota" | "simbolo";
  setModoGeneral: (modo: "nota" | "simbolo") => void;
  handleModal: () => void;
}

const EncabezadoTabla: React.FC<EncabezadoTablaProps> = ({
  searchTerm,
  setSearchTerm,
  modoGeneral,
  setModoGeneral,
  handleModal,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
      {/* Título */}
      <h2 className="text-2xl font-bold text-gray-700">
        Registro de Actividades
      </h2>

      {/* Buscar y agregar actividad */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <input
          type="text"
          placeholder="Buscar estudiante..."
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-64"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          onClick={handleModal}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition"
        >
          Agregar Actividad
        </button>
      </div>

      {/* Switch modo calificación */}
      <div className="flex items-center mt-4 sm:mt-0 gap-4">
        <span className="font-semibold">Modo de calificación:</span>
        <button
          onClick={() =>
            setModoGeneral(modoGeneral === "nota" ? "simbolo" : "nota")
          }
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
        >
          {modoGeneral === "nota" ? "Símbolos" : "Números"}
        </button>
      </div>
    </div>
  );
};

export default EncabezadoTabla;
