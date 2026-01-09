"use client";
import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { X, Check } from "lucide-react";
import axios from "axios";
import { Criterio } from "@/types/semestre";
import { useAlert } from "../ui/Alert";

interface ModalEvidenciaProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  criterio: Criterio;
  onEvidenciaAdded?: (nuevaEvidencia: any) => void;
  setCriterios: React.Dispatch<React.SetStateAction<Criterio[]>>;
  criterios: Criterio[];
}

const ModalEvidencia: React.FC<ModalEvidenciaProps> = ({
  showModal,
  setShowModal,
  criterio,
  onEvidenciaAdded,
  setCriterios,
  criterios,
}) => {
  const { showAlert } = useAlert();
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<"producto" | "desempeno" | "conocimiento">(
    "producto"
  );
  const [puntajeMaximo, setPuntajeMaximo] = useState<number | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(false);

  const handleGuardar = async () => {
    if (!nombre) return alert("El nombre es obligatorio");
    setLoading(true);
    try {
      const res = await axios.post(
        "/api/asignaturas/competencias/criterios/evidencias",
        {
          nombre,
          tipo,
          criterioId: criterio.id,
        }
      );
      const data = res.data;
      if (data.status) {
        showAlert("Evidencia creada correctamente");
        // Por ejemplo, si la evidencia debería tener {id, nombre, tipo, ...}
        setCriterios((prev) =>
          prev.map((c) =>
            c.id === criterio.id
              ? {
                  ...c,
                  evidencia: [
                    ...(c.evidencia || []),
                    {
                      id: data.evidencia.id,
                      nombre: data.evidencia.nombre,
                      tipo: data.evidencia.tipo,
                    },
                  ],
                }
              : c
          )
        );

        setShowModal(false);
      } else {
        alert("Error al crear la evidencia");
      }
    } catch (error) {
      console.error(error);
      alert("Error al crear la evidencia");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={showModal}
      onClose={() => setShowModal(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded bg-white p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-semibold">
              Añadir Evidencia
            </Dialog.Title>
            <button onClick={() => setShowModal(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex flex-col text-sm font-medium">
              Nombre de la evidencia
              <input
                type="text"
                className="border rounded px-2 py-1 mt-1"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </label>

            <label className="flex flex-col text-sm font-medium">
              Tipo de evidencia
              <select
                className="border rounded px-2 py-1 mt-1"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
              >
                <option value="producto">Producto</option>
                <option value="desempeno">Desempeño</option>
                <option value="conocimiento">Conocimiento</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 transition flex items-center gap-2"
              onClick={handleGuardar}
              disabled={loading}
            >
              <Check size={18} />
              Guardar
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default ModalEvidencia;
