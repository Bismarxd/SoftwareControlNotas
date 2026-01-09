"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";
import JoditEditor from "jodit-react";
import { useAlert } from "@/components/ui/Alert";
import { Contenido } from "@/types/semestre";

interface Props {
  setShowModal: (value: boolean) => void;
  setContenido: React.Dispatch<React.SetStateAction<Contenido[]>>;
  contenidoEditar: Contenido | null;
  setContenidoEditar: (value: Contenido | null) => void;
}

const ModalContenido = ({
  setShowModal,
  setContenido,
  contenidoEditar,
  setContenidoEditar,
}: Props) => {
  console.log(contenidoEditar);
  const editor = useRef(null);
  const { showAlert } = useAlert();

  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [recursoUrl, setRecursoUrl] = useState("");

  const [loading, setLoading] = useState(false);

  const materiaId =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("materiaSeleccionada") || "null")
      : null;

  useEffect(() => {
    if (contenidoEditar) {
      setTitulo(contenidoEditar.titulo);
      setTipo(contenidoEditar.tipo);
      setDescripcion(contenidoEditar.descripcion);
      setRecursoUrl(contenidoEditar.recursoUrl || "");
    }
  }, [contenidoEditar]);

  const resetForm = () => {
    setTitulo("");
    setTipo("");
    setDescripcion("");
    setContenidoEditar(null);
  };

  const handleSave = async () => {
    if (!titulo || !tipo || !descripcion) {
      showAlert("Complete todos los campos", "error");
      return;
    }

    setLoading(true);

    try {
      let res;

      if (contenidoEditar) {
        // PUT correcto
        res = await axios.put(`/api/asignaturas/contenido`, {
          id: contenidoEditar.id, // ✅ el id del contenido a editar
          titulo,
          tipo,
          descripcion,
          recurso: recursoUrl || null, // ✅ opcional
        });
      } else {
        // POST (creación) no cambia
        res = await axios.post(`/api/asignaturas/contenido`, {
          asignaturaId: materiaId,
          titulo,
          tipo,
          descripcion,
          recurso: recursoUrl || null,
        });
      }

      if (res.data.status) {
        setContenido((prev) =>
          contenidoEditar
            ? prev.map((c) =>
                c.id === contenidoEditar.id ? res.data.contenido : c
              )
            : [...prev, res.data.contenido]
        );

        showAlert(
          contenidoEditar
            ? "Contenido actualizado correctamente"
            : "Contenido agregado correctamente",
          "success"
        );

        setShowModal(false);
        resetForm();
      } else {
        showAlert(res.data.message || "Error al guardar", "error");
      }
    } catch (error) {
      console.error(error);
      showAlert("Error al guardar contenido", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
        {/* Cerrar */}
        <button
          onClick={() => {
            setShowModal(false);
            resetForm();
          }}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {contenidoEditar ? "Editar Contenido" : "Agregar Contenido"}
        </h2>

        <div className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Título
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="Ej: Unidad 1 – Introducción"
            />
          </div>

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
              <option value="unidad">Unidad</option>
              <option value="tema">Tema</option>
              <option value="modulo">Módulo</option>
              <option value="clase">Clase</option>
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
                placeholder: "Escribe el contenido aquí...",
              }}
              onBlur={(newContent) => setDescripcion(newContent)}
              onChange={() => {}}
            />
          </div>
        </div>

        {/* Recurso */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Recurso (opcional)
          </label>
          <input
            type="url"
            value={recursoUrl}
            onChange={(e) => setRecursoUrl(e.target.value)}
            placeholder="https://drive.google.com / https://youtube.com / pdf..."
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              setShowModal(false);
              resetForm();
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
              : contenidoEditar
              ? "Actualizar"
              : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalContenido;
