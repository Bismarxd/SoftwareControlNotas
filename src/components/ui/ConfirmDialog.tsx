"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

type ConfirmData = {
  message: string;
  onConfirm: () => void;
};

type ConfirmContextType = {
  showConfirm: (message: string, onConfirm: () => void) => void;
};

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm debe usarse dentro de un <ConfirmProvider>");
  }
  return context;
};

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [confirmData, setConfirmData] = useState<ConfirmData | null>(null);

  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmData({ message, onConfirm });
  };

  const handleConfirm = () => {
    if (confirmData?.onConfirm) confirmData.onConfirm();
    setConfirmData(null);
  };

  const handleCancel = () => {
    setConfirmData(null);
  };

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}

      {confirmData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <AlertTriangle className="text-yellow-500" size={40} />
              <h2 className="text-lg font-semibold text-gray-800">
                Confirmar acción
              </h2>
              <p className="text-gray-600">{confirmData.message}</p>

              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
