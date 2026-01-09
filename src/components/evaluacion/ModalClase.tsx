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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
        <button
          onClick={() => {
            setShowModal(false);
            setFecha("");
            // setObjetivosEditar?.(null);
          }}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Agregar Clase
          {/* {objetivosEditar ? "Editar Objetivo" : "Agregar Objetivo"} */}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fecha
            </label>
            <input
              type="date"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              // value={nuevoSemestre.fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              setShowModal(false);
              setFecha("");
              //   setObjetivosEditar?.(null);
            }}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition hover:cursor-pointer"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition hover:cursor-pointer"
            disabled={loading}
          >
            Actualizar
            {/* {loading
              ? "Guardando..."
              : objetivosEditar
              ? "Actualizar"
              : "Guardar"} */}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalClase;
