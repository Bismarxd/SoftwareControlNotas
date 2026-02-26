"use client";
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Estudiante } from "@/types/semestre";
import { useAlert } from "../ui/Alert";
import axios from "axios";

interface ModalEstudianteProps {
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  agregarEstudiante: (nuevo: Estudiante) => void;
  setEstudiantes: React.Dispatch<React.SetStateAction<Estudiante[]>>;
  editarEstudiante: Estudiante | null;
  setEditarEstudiante: React.Dispatch<React.SetStateAction<Estudiante | null>>;
}

const ModalEstudiante: React.FC<ModalEstudianteProps> = ({
  showModal,
  setShowModal,
  agregarEstudiante,
  setEstudiantes,
  editarEstudiante,
  setEditarEstudiante,
}) => {
  const { showAlert } = useAlert();

  const [nombre, setNombre] = useState("");
  const [ci, setCi] = useState("");
  const [email, setEmail] = useState("");
  const [registro, setRegistro] = useState<number | "">("");
  const [celular, setCelular] = useState<number | "">("");
  const [loading, setLoading] = useState(false);

  // al editar, cargar datos en los inputs
  useEffect(() => {
    if (editarEstudiante) {
      setNombre(editarEstudiante.nombre || "");
      setCi(editarEstudiante.ci || "");
      setEmail(editarEstudiante.email || "");
      setRegistro(editarEstudiante.registro || "");
      setCelular(editarEstudiante.celular || 0);
    } else {
      setNombre("");
      setCi("");
      setEmail("");
      setRegistro("");
      setCelular("");
    }
  }, [editarEstudiante]);

  if (!showModal) return null;

  const handleGuardar = async () => {
    try {
      const materiaIdString = localStorage.getItem("materiaSeleccionada");
      const materiaId = materiaIdString ? JSON.parse(materiaIdString) : null;

      if (!nombre.trim() || !ci.trim() || registro === "") {
        showAlert(
          "Por favor, completa todos los campos obligatorios.",
          "error"
        );
        return;
      }

      if (isNaN(Number(registro))) {
        showAlert("El número de registro debe ser un valor numérico.", "error");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (
        email &&
        email.trim() !== "" &&
        email.trim() !== "-" &&
        !emailRegex.test(email)
      ) {
        showAlert("Por favor, ingresa un correo electrónico válido.", "error");
        return;
      }

      setLoading(true);

      const payload: any = {
        nombre,
        ci,
        registro: Number(registro),
        asignaturaId: materiaId,
        celular: Number(celular),
      };
      if (email.trim()) payload.email = email.trim();

      let data: any;

      if (editarEstudiante) {
        payload.id = editarEstudiante.id;
        const res = await axios.put("/api/estudiantes/listado", payload);
        data = res.data;

        if (data.status) {
          showAlert("Estudiante actualizado correctamente", "success");
          setEstudiantes((prev) =>
            prev.map((e) =>
              e.id === editarEstudiante.id ? data.estudiante : e
            )
          );
        } else {
          showAlert(data.message, "error");
          return;
        }
      } else {
        const res = await axios.post("/api/estudiantes/listado", payload);
        data = res.data;

        if (data.status) {
          showAlert("Estudiante agregado correctamente", "success");
          agregarEstudiante(data.estudiante);
        } else {
          showAlert(data.message, "error");
          return;
        }
      }

      // limpiar
      setNombre("");
      setCi("");
      setEmail("");
      setRegistro("");
      setEditarEstudiante(null);
      setShowModal(false);
    } catch (error) {
      console.error("Error al guardar el estudiante:", error);
      showAlert("Ocurrió un error al guardar el estudiante.", "error");
    } finally {
      setLoading(false);
    }
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditarEstudiante(null);
    setNombre("");
    setCi("");
    setEmail("");
    setRegistro("");
  };

  return (
    <>
      {/* Fondo oscuro con blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={cerrarModal}
      ></div>

      {/* Panel lateral Premium */}
      <div className="fixed right-0 top-0 w-full sm:w-1/3 max-w-lg h-full bg-white dark:bg-gray-900 black:bg-black shadow-2xl z-50 flex flex-col animate-slide-in border-l border-gray-200 dark:border-gray-800 black:border-zinc-800 transition-colors duration-300">
        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 px-8 py-6 bg-teal-600 dark:bg-teal-700 text-white">
          <h2 className="text-xl font-bold tracking-tight">
            {editarEstudiante ? "Editar Estudiante" : "Agregar Estudiante"}
          </h2>
          <button 
            onClick={cerrarModal} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col gap-6 p-8 flex-grow overflow-y-auto">
          {/* Campo: Nombre */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Nombre Completo
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: María López"
              className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all dark:text-gray-100 shadow-sm"
            />
          </div>

          {/* Campo: CI */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Cédula de Identidad
            </label>
            <input
              type="text"
              value={ci}
              onChange={(e) => setCi(e.target.value)}
              placeholder="Ej: 7896543"
              className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all dark:text-gray-100 shadow-sm"
            />
          </div>

          {/* Campo: Registro */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Registro (N°)
            </label>
            <input
              type="number"
              value={registro}
              onChange={(e) =>
                setRegistro(e.target.value ? Number(e.target.value) : "")
              }
              placeholder="Ej: 12345"
              className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all dark:text-gray-100 shadow-sm"
            />
          </div>

          {/* Campo: Email */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ej: maria@psico.edu"
              className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all dark:text-gray-100 shadow-sm"
            />
          </div>

          {/* Campo: Celular */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Celular
            </label>
            <input
              type="number"
              value={celular}
              onChange={(e) =>
                setCelular(e.target.value ? Number(e.target.value) : "")
              }
              placeholder="Ej: 76543210"
              className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all dark:text-gray-100 shadow-sm"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-8 py-6 flex justify-end gap-4 bg-gray-50 dark:bg-gray-900/50 black:bg-zinc-900/50">
          <button
            onClick={cerrarModal}
            className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition font-bold"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={loading}
            className="px-8 py-2.5 bg-teal-600 dark:bg-teal-700 text-white rounded-xl shadow-lg shadow-teal-500/20 hover:bg-teal-700 dark:hover:bg-teal-600 transition font-bold disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default ModalEstudiante;
