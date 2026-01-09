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
        return "bg-green-100 text-green-800 border-green-400";
      case "error":
        return "bg-red-100 text-red-800 border-red-400";
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-400";
      default:
        return "";
    }
  };

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case "success":
        return <CheckCircle size={22} className="text-green-600" />;
      case "error":
        return <XCircle size={22} className="text-red-600" />;
      case "info":
        return <Info size={22} className="text-blue-600" />;
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}

      {alert && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 ">
          <div
            className={`flex items-center gap-2 p-2 rounded-xl border shadow-md animate-fade-in ${getAlertStyles(
              alert.type
            )}`}
          >
            {getAlertIcon(alert.type)}
            <span className="font-medium">{alert.message}</span>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};
