// context/SemestreSeleccionadoContext.tsx
"use client";

import React, { createContext, useContext, useState } from "react";

interface Semestre {
  id: number;
  usuarioId: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  estado: "Activo" | "Finalizado";
}

interface SemestreSeleccionadoContextType {
  semestreSeleccionado: Semestre | null;
  setSemestreSeleccionado: (semestre: Semestre) => void;
}

const SemestreSeleccionadoContext = createContext<
  SemestreSeleccionadoContextType | undefined
>(undefined);

export const SemestreSeleccionadoProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [semestreSeleccionado, setSemestreSeleccionado] =
    useState<Semestre | null>(null);

  return (
    <SemestreSeleccionadoContext.Provider
      value={{ semestreSeleccionado, setSemestreSeleccionado }}
    >
      {children}
    </SemestreSeleccionadoContext.Provider>
  );
};

export const useSemestreSeleccionado = () => {
  const context = useContext(SemestreSeleccionadoContext);
  if (!context)
    throw new Error(
      "useSemestreSeleccionado debe usarse dentro de SemestreSeleccionadoProvider"
    );
  return context;
};
