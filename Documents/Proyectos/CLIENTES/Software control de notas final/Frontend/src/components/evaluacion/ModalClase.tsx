"use client";
import React, { useState } from "react";
import axios from "axios";
import { X } from "lucide-react";
import { useAlert } from "@/components/ui/Alert";

import { Clase } from "@/types/semestre";

type Datos = {
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  setClase: React.Dispatch<React.SetStateAction<Clase[]>>;
  //   objetivosEditar?: Objetivo | null;
  //   setObjetivosEditar: React.Dispatch<React.SetStateAction<Objetivo | null>>;
};

const ModalClase: React.FC<Datos> = ({
  setShowModal,
  setClase,
  //   objetivosEditar,
  //   setObjetivosEditar,
}) => {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);

  const [fecha, setFecha] = useState("");

  //   // Cargar los datos si estamos editando
  //   useEffect(() => {
  //     if (objetivosEditar) {
  //       setTipo(objetivosEditar.tipo || "");
  //       setDescripcion(objetivosEditar.descripcion || "");
  //     } else {
  //       setTipo("");
  //       setDescripcion("");
  //     }
  //   }, [objetivosEditar]);

  // Guardar o actualizar
  const handleSave = async () => {
    try {
      const materiaIdString = localStorage.getItem("materiaSeleccionada");
      const materiaId = materiaIdString ? JSON.parse(materiaIdString) : null;

      if (!fecha) {
        showAlert("Por favor, completa todos los campos", "error");
        return;
      }

      setLoading(true);

      //   // Si se está editando
      //   if (objetivosEditar?.id) {
      //     const res = await axios.put(
      //       `/api/asignaturas/objetivos/${objetivosEditar.id}`,
      //       { tipo, descripcion }
      //     );
      //     const data = res.data;

      //     if (data.status) {
      //       setObjetivos((prev) =>
      //         prev.map((a) =>
      //           a.id === objetivosEditar.id ? data.objetivoActualizado : a
      //         )
      //       );
      //       showAlert("Objetivo actualizado correctamente", "success");
      //       setTipo("");
      //       setDescripcion("");
      //       setShowModal(false);
      //       setTipo("");
      //       setDescripcion("");
      //       setObjetivosEditar(null);
      //     } else {
      //       showAlert("Error al actualizar el objetivo", "error");
      //     }
      //     return;
      //   }

      // Si se está creando
      const res = await axios.post("/api/evaluacion/clase", {
        fecha,
        asignaturaId: materiaId,
      });
      const data = res.data;

      if (data.status) {
        showAlert("Clase añadida correctamente", "success");
        setClase((prev) => [...prev, data.nuevaClase]);
        setShowModal(false);
        setFecha("");

        // setObjetivosEditar(null);
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.error("Error al guardar objetivo:", error);
      showAlert("Error al guardar el objetivo", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay con blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => {
          setShowModal(false);
          setFecha("");
        }}
      />

      {/* Modal Content */}
      <div className="bg-white dark:bg-gray-900 black:bg-black rounded-3xl shadow-2xl w-full max-w-md p-8 relative z-50 transform transition-all border border-gray-200 dark:border-gray-800 black:border-zinc-900">
        <button
          onClick={() => {
            setShowModal(false);
            setFecha("");
          }}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white tracking-tight">
          Nueva Clase
        </h2>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Fecha de la Clase
            </label>
            <input
              type="date"
              className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all dark:text-gray-200"
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
          <button
            onClick={() => {
              setShowModal(false);
              setFecha("");
            }}
            className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition font-bold"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-teal-600 dark:bg-teal-700 text-white rounded-xl hover:bg-teal-700 dark:hover:bg-teal-600 transition shadow-lg shadow-teal-500/20 font-bold flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Clase"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalClase;
