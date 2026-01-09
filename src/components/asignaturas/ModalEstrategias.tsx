"use client";
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { X } from "lucide-react";
import { useAlert } from "@/components/ui/Alert";
import dynamic from "next/dynamic";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });
import { Objetivo } from "@/types/semestre";

type Datos = {
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  setEstrategias: React.Dispatch<React.SetStateAction<Objetivo[]>>;
  estrategiasEditar?: Objetivo | null;
  setEstrategiasEditar: React.Dispatch<React.SetStateAction<Objetivo | null>>;
};

const ModalEstrategias: React.FC<Datos> = ({
  setShowModal,
  setEstrategias,
  estrategiasEditar,
  setEstrategiasEditar,
}) => {
  const { showAlert } = useAlert();
  const editor = useRef(null);
  const [loading, setLoading] = useState(false);

  const [tipo, setTipo] = useState("");
  const [descripcion, setDescripcion] = useState("");

  // Cargar los datos si estamos editando
  useEffect(() => {
    if (estrategiasEditar) {
      setTipo(estrategiasEditar.tipo || "");
      setDescripcion(estrategiasEditar.descripcion || "");
    } else {
      setTipo("");
      setDescripcion("");
    }
  }, [estrategiasEditar]);

  // Guardar o actualizar
  const handleSave = async () => {
    try {
      const materiaIdString = localStorage.getItem("materiaSeleccionada");
      const materiaId = materiaIdString ? JSON.parse(materiaIdString) : null;

      if (!tipo || !descripcion) {
        showAlert("Por favor, completa todos los campos", "error");
        return;
      }

      setLoading(true);

      // Si se está editando
      if (estrategiasEditar?.id) {
        const res = await axios.put("/api/asignaturas/estrategias", {
          id: estrategiasEditar.id,
          tipo,
          descripcion,
        });
        const data = res.data;

        if (data.status) {
          setEstrategias((prev) =>
            prev.map((a) =>
              a.id === estrategiasEditar.id ? data.objetivoActualizado : a
            )
          );
          showAlert("Estrategia actualizada correctamente", "success");
          setTipo("");
          setDescripcion("");
          setShowModal(false);
          setTipo("");
          setDescripcion("");
          setEstrategiasEditar(null);
        } else {
          showAlert("Error al actualizar la estrategia", "error");
        }
        return;
      }

      // Si se está creando
      const res = await axios.post("/api/asignaturas/estrategias", {
        tipo,
        descripcion,
        asignaturaId: materiaId,
      });
      const data = res.data;

      if (data.status) {
        showAlert("Estrategia añadida correctamente", "success");
        setEstrategias((prev) => [...prev, data.estrategia]);
        setShowModal(false);
        setTipo("");
        setDescripcion("");
        setEstrategiasEditar(null);
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.error("Error al guardar la estrategia:", error);
      showAlert("Error al guardar la estrategia", "error");
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
            setTipo("");
            setDescripcion("");
            setEstrategiasEditar?.(null);
          }}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {estrategiasEditar ? "Editar Objetivo" : "Agregar Objetivo"}
        </h2>

        <div className="space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tipo
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
            >
              <option value="">Selecciona un tipo</option>
              <option value="colaborativa">Colaborativa</option>
              <option value="indagativa">Indagativa / Investigativa</option>
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <JoditEditor
              ref={editor}
              value={descripcion}
              config={{
                readonly: false,
                height: 250,
                toolbarAdaptive: false,
                toolbarSticky: false,
                buttons:
                  "bold,italic,underline,ul,ol,link,|,fontsize,brush,paragraph,align",
                placeholder: "Escribe la descripción aquí...",
              }}
              onBlur={(newContent) => setDescripcion(newContent)}
              onChange={() => {}}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              setShowModal(false);
              setTipo("");
              setDescripcion("");
              setEstrategiasEditar?.(null);
            }}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
            disabled={loading}
          >
            {loading
              ? "Guardando..."
              : estrategiasEditar
              ? "Actualizar"
              : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEstrategias;
