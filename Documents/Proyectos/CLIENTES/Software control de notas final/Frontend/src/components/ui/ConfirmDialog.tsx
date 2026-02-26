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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-white dark:bg-gray-900 black:bg-black border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl w-full max-w-sm p-8 transition-all scale-in">
            <div className="flex flex-col items-center text-center space-y-5">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-full">
                <AlertTriangle className="text-yellow-500" size={42} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Confirmar acción
              </h2>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                {confirmData.message}
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6 w-full">
                <button
                  onClick={handleCancel}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition shadow-lg shadow-teal-500/20 font-bold"
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
