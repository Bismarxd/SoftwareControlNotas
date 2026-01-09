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
      {/* Fondo oscuro */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={cerrarModal}
      ></div>

      {/* Panel lateral */}
      <div className="fixed right-0 top-0 w-full sm:w-1/3 h-full bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
        <div className="flex justify-between items-center border-b px-6 py-4 bg-teal-600 text-white">
          <h2 className="text-lg font-semibold">
            {editarEstudiante ? "Editar Estudiante" : "Agregar Estudiante"}
          </h2>
          <button onClick={cerrarModal} className="hover:text-gray-200">
            <X size={22} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-6 flex-grow overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: María López"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cédula de Identidad
            </label>
            <input
              type="text"
              value={ci}
              onChange={(e) => setCi(e.target.value)}
              placeholder="Ej: 7896543"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registro (N°)
            </label>
            <input
              type="number"
              value={registro}
              onChange={(e) =>
                setRegistro(e.target.value ? Number(e.target.value) : "")
              }
              placeholder="Ej: 12345"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ej: maria@uni.edu"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Celular
            </label>
            <input
              type="number"
              value={celular}
              onChange={(e) =>
                setCelular(e.target.value ? Number(e.target.value) : "")
              }
              placeholder="Ej: 5744284"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={loading}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </>
  );
};

export default ModalEstudiante;
