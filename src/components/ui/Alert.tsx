"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { CheckCircle, XCircle, Info } from "lucide-react";

type AlertType = "success" | "error" | "info";

interface AlertData {
  message: string;
  type: AlertType;
}

interface AlertContextType {
  showAlert: (message: string, type?: AlertType) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert debe usarse dentro de un <AlertProvider>");
  }
  return context;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alert, setAlert] = useState<AlertData | null>(null);

  const showAlert = useCallback(
    (message: string, type: AlertType = "success") => {
      setAlert({ message, type });
      setTimeout(() => setAlert(null), 3000);
    },
    []
  );

  const getAlertStyles = (type: AlertType) => {
    switch (type) {
      case "success":
        return "bg-green-50 dark:bg-green-900/20 black:bg-green-950/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800";
      case "error":
        return "bg-red-50 dark:bg-red-900/20 black:bg-red-950/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800";
      case "info":
        return "bg-blue-50 dark:bg-blue-900/20 black:bg-blue-950/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      default:
        return "";
    }
  };

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case "success":
        return <CheckCircle size={20} className="text-green-600 dark:text-green-400" />;
      case "error":
        return <XCircle size={20} className="text-red-600 dark:text-red-400" />;
      case "info":
        return <Info size={20} className="text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}

      {alert && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-3">
          <div
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-xl backdrop-blur-md animate-fade-in ${getAlertStyles(
              alert.type
            )}`}
          >
            {getAlertIcon(alert.type)}
            <span className="font-semibold text-sm">{alert.message}</span>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};
