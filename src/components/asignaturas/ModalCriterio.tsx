"use client";
import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { Criterio } from "@/types/semestre";
import { useAlert } from "@/components/ui/Alert";
import axios from "axios";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

type Datos = {
  showModal: boolean;
  idCompetencia: number;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  criterios: Criterio[];
  setCriterios: React.Dispatch<React.SetStateAction<Criterio[]>>;
  setCriteriosEditar: React.Dispatch<React.SetStateAction<Criterio | null>>;
  criteriosEditar: Criterio | null;
};

const ModalCriterio: React.FC<Datos> = ({
  showModal,
  idCompetencia,
  setShowModal,
  criterios,
  setCriterios,
  setCriteriosEditar,
  criteriosEditar,
}) => {
  console.log(criteriosEditar);
  const { showAlert } = useAlert();
  const editor = useRef(null);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [porcentaje, setPorcentaje] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Inicializar campos si estamos editando
  useEffect(() => {
    if (criteriosEditar) {
      setNombre(criteriosEditar.nombre);
      setDescripcion(criteriosEditar.descripcion);
      setPorcentaje(criteriosEditar.porcentaje);
    } else {
      setNombre("");
      setDescripcion("");
      setPorcentaje(0);
    }
  }, [criteriosEditar]);

  if (!showModal) return null;

  const handleSave = async () => {
    // Validaciones
    if (!nombre.trim() || !descripcion.trim() || !idCompetencia) {
      showAlert("Completa todos los campos antes de guardar", "error");
      return;
    }

    try {
      setLoading(true);

      if (criteriosEditar) {
        // Para Editar
        const res = await axios.put(`/api/asignaturas/competencias/criterios`, {
          id: criteriosEditar?.id,
          nombre,
          descripcion,
          porcentaje,
        });
        const data = res.data;

        if (data.status) {
          setCriterios((prev) =>
            prev.map((c) =>
              c.id === criteriosEditar.id ? data.competencia : c
            )
          );
          showAlert("Competencia editada correctamente", "success");
          setShowModal(false);
          setCriteriosEditar(null);
        } else {
          showAlert("Error al editar la competencia", "error");
        }
      } else {
        const res = await axios.post(
          "/api/asignaturas/competencias/criterios",
          {
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            porcentaje: Number(porcentaje),
            competenciaId: Number(idCompetencia),
          }
        );

        const data = res.data;

        if (data.status) {
          setCriterios((prev) => [...prev, data.criterio]);
          showAlert("Criterio añadido correctamente", "success");
          setShowModal(false);
          setNombre("");
          setDescripcion("");
          setPorcentaje(0);
        } else {
          showAlert(data.message || "Error al añadir el criterio", "error");
        }
      }
    } catch (error: any) {
      console.error("Error al guardar criterio:", error);
      showAlert("Error al guardar el criterio", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Fondo semi-transparente */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => {
          setShowModal(false);
          setCriteriosEditar(null);
        }}
      ></div>

      {/* Modal */}
      <div className="fixed top-0 right-0 w-full md:w-1/3 h-full bg-white z-50 shadow-lg p-6 flex flex-col transform transition-transform duration-300">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Añadir Criterio de Evaluación
          </h2>
          <button
            onClick={() => {
              setShowModal(false);
              setCriteriosEditar(null);
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <div className="flex flex-col gap-4 flex-grow overflow-y-auto">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Nombre del criterio"
            />
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

          {/* Porcentaje */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Porcentaje
            </label>
            <input
              type="number"
              value={porcentaje === "" ? "" : porcentaje}
              onChange={(e) => {
                const val = e.target.value === "" ? "" : Number(e.target.value);
                if (val === "" || (val >= 1 && val <= 100)) {
                  setPorcentaje(val);
                }
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Porcentaje (1 - 100)"
              min={1}
              max={100}
            />
          </div> */}
        </div>

        {/* Botones */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition hover:cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50 hover:cursor-pointer"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </>
  );
};

export default ModalCriterio;
