"use client";
import React, { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { Competencia } from "@/types/semestre";
import { useAlert } from "@/components/ui/Alert";
import axios from "axios";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

type Datos = {
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  competencias: Competencia[];
  setCompetencias: React.Dispatch<React.SetStateAction<Competencia[]>>;
  competenciasEditar: Competencia | null;
  setCompetenciasEditar: React.Dispatch<
    React.SetStateAction<Competencia | null>
  >;
};

const ModalCompetencias: React.FC<Datos> = ({
  showModal,
  setShowModal,
  competencias,
  setCompetencias,
  competenciasEditar,
  setCompetenciasEditar,
}) => {
  const { showAlert } = useAlert();
  const editor = useRef(null);
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [porcentaje, setPorcentaje] = useState<number | "">("");

  // Inicializar campos si estamos editando
  useEffect(() => {
    if (competenciasEditar) {
      setTipo(competenciasEditar.tipo);
      setDescripcion(competenciasEditar.descripcion);
      setPorcentaje(competenciasEditar.porcentaje); // ✅ inicializamos correctamente
    } else {
      setTipo("");
      setDescripcion("");
      setPorcentaje(""); // vacio solo para crear
    }
  }, [competenciasEditar]);

  // Calcular porcentaje restante
  const totalAsignado = competencias
    .filter((c) => c.id !== competenciasEditar?.id) // excluir la competencia que estamos editando
    .reduce((acc, c) => acc + c.porcentaje, 0);
  const restante = Math.max(0, 100 - totalAsignado);

  const handleSave = async () => {
    if (!tipo || !descripcion) {
      showAlert("Por favor completa todos los campos", "error");
      return;
    }

    if (porcentaje === "" || porcentaje < 0 || porcentaje > restante) {
      showAlert(`El porcentaje debe estar entre 0 y ${restante}`, "error");
      return;
    }

    try {
      setLoading(true);
      const materiaIdString = localStorage.getItem("materiaSeleccionada");
      const materiaId = materiaIdString ? JSON.parse(materiaIdString) : null;

      if (competenciasEditar) {
        // Para Editar
        const res = await axios.put(`/api/asignaturas/competencias/`, {
          id: competenciasEditar?.id,
          tipo,
          descripcion,
          porcentaje,
        });
        const data = res.data;

        if (data.status) {
          setCompetencias((prev) =>
            prev.map((c) =>
              c.id === competenciasEditar.id ? data.competencia : c
            )
          );
          showAlert("Competencia editada correctamente", "success");
          setShowModal(false);
          setCompetenciasEditar(null);
        } else {
          showAlert("Error al editar la competencia", "error");
        }
      } else {
        // Para Crear
        const res = await axios.post("/api/asignaturas/competencias", {
          tipo,
          descripcion,
          porcentaje,
          asignaturaId: materiaId,
        });
        const data = res.data;

        if (data.status) {
          setCompetencias((prev) => [...prev, data.competencia]);
          showAlert("Competencia añadida correctamente", "success");
          setShowModal(false);
        } else {
          showAlert("Error al añadir la competencia", "error");
        }
      }
    } catch (error) {
      console.error(error);
      showAlert("Error al guardar la competencia", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!showModal) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => {
          setShowModal(false);
          setCompetenciasEditar(null);
        }}
      ></div>

      <div className="fixed top-0 right-0 w-full md:w-1/3 h-full bg-white z-50 shadow-lg p-6 flex flex-col transform transition-transform duration-300">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {competenciasEditar ? "Editar Competencia" : "Añadir Competencia"}
          </h2>
          <button
            onClick={() => {
              setShowModal(false);
              setCompetenciasEditar(null);
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <div className="flex flex-col gap-4 flex-grow overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <input
              list="tiposCompetencia"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              placeholder="Selecciona o escribe un tipo"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <datalist id="tiposCompetencia">
              <option value="Cognitiva" />
              <option value="Procedimental" />
              <option value="Actitudinal" />
            </datalist>
          </div>

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

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Porcentaje
              </label>
              <span
                className={`text-sm font-medium ${
                  restante > 0 ? "text-teal-600" : "text-red-600"
                }`}
              >
                Restante: {restante}%
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 mb-2 relative overflow-hidden">
              {/* Barra de porcentaje */}
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  porcentaje === ""
                    ? "bg-gray-300"
                    : porcentaje <= 50
                    ? "bg-teal-500"
                    : porcentaje <= 80
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{
                  width: `${
                    porcentaje === "" ? 0 : Math.min(porcentaje, restante)
                  }%`,
                }}
              ></div>

              <span className="absolute left-1/2 top-0 -translate-x-1/2 text-xs text-gray-700">
                {porcentaje === "" ? 0 : Math.min(porcentaje, restante)}%
              </span>
            </div>

            <input
              type="number"
              value={porcentaje === "" ? "" : porcentaje}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  setPorcentaje("");
                  return;
                }

                let value = Number(raw);
                if (isNaN(value)) value = 0;
                if (value < 0) value = 0;
                if (value > restante) value = restante;
                setPorcentaje(value);
              }}
              min={0}
              max={restante}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => {
              setShowModal(false);
              setCompetenciasEditar(null);
            }}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </>
  );
};

export default ModalCompetencias;
