import React, { useState, useEffect } from "react";
import axios from "axios";
import { X } from "lucide-react";
import { Semestre } from "@/types/semestre";
import { useAlert } from "@/components/ui/Alert";

type Datos = {
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  setSemestre: React.Dispatch<React.SetStateAction<Semestre[]>>;
  semestreEditar?: Semestre | null;
  onUpdate?: (data: Partial<Semestre>) => Promise<void>;
};

const ModalSemestre: React.FC<Datos> = ({
  setShowModal,
  setSemestre,
  semestreEditar,
  onUpdate,
}) => {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [nuevoSemestre, setNuevoSemestre] = useState<Semestre>({
    id: 0,
    usuarioId: 1,
    nombre: "",
    fechaInicio: "",
    fechaFin: "",
    estado: "Finalizado",
    seleccionado: false,
  });

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");
    if (usuario) {
      const usuarioObj = JSON.parse(usuario);
      setNuevoSemestre((prev) => ({
        ...prev,
        usuarioId: usuarioObj.id,
      }));
    }
  }, []);

  // Cargar datos si estamos en modo edición
  useEffect(() => {
    if (semestreEditar) {
      setNuevoSemestre({
        ...semestreEditar,
        fechaInicio: semestreEditar.fechaInicio.split("T")[0],
        fechaFin: semestreEditar.fechaFin.split("T")[0],
      });
    }
  }, [semestreEditar]);

  // Guardar o actualizar semestre
  const handleSave = async () => {
    try {
      if (
        !nuevoSemestre.nombre ||
        !nuevoSemestre.fechaInicio ||
        !nuevoSemestre.fechaFin
      ) {
        showAlert("Por favor, completa todos los campos", "error");
        return;
      }

      if (nuevoSemestre.estado === "Activo") {
        const confirmado = window.confirm(
          "Al activar este semestre, se desactivarán los semestres anteriores. ¿Deseas continuar?"
        );
        if (!confirmado) return;
      }

      setLoading(true);

      // Si estamos editando
      if (semestreEditar && onUpdate) {
        await onUpdate(nuevoSemestre);
        return;
      }

      // Si estamos creando
      const res = await axios.post("/api/semestres", nuevoSemestre);
      const data = res.data;

      if (data.status) {
        setSemestre((prev) => [...prev, { ...data.nuevoSemestre }]);
        showAlert("Semestre creado exitosamente", "success");
        setShowModal(false);
      } else {
        console.log(data.message);
        showAlert("Error al crear el semestre", "error");
      }
    } catch (error) {
      console.error("Error al guardar semestre:", error);
      showAlert("Error al guardar semestre", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {semestreEditar ? "Editar Semestre" : "Agregar Nuevo Semestre"}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              type="text"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              value={nuevoSemestre.nombre}
              onChange={(e) =>
                setNuevoSemestre({ ...nuevoSemestre, nombre: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fecha Inicio
              </label>
              <input
                type="date"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                value={nuevoSemestre.fechaInicio}
                onChange={(e) =>
                  setNuevoSemestre({
                    ...nuevoSemestre,
                    fechaInicio: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fecha Final
              </label>
              <input
                type="date"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                value={nuevoSemestre.fechaFin}
                onChange={(e) =>
                  setNuevoSemestre({
                    ...nuevoSemestre,
                    fechaFin: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              value={nuevoSemestre.estado}
              onChange={(e) =>
                setNuevoSemestre({
                  ...nuevoSemestre,
                  estado: e.target.value as "Activo" | "Finalizado",
                })
              }
            >
              <option value="Activo">Activo</option>
              <option value="Finalizado">Finalizado</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setShowModal(false)}
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
              : semestreEditar
              ? "Actualizar"
              : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalSemestre;
