import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Asignaturas } from "@/types/semestre";
import { useParams } from "next/navigation";
import axios from "axios";
import { useAlert } from "@/components/ui/Alert";

type Props = {
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  setAsignaturas: React.Dispatch<React.SetStateAction<Asignaturas[]>>;
  onSave?: (nuevaAsignatura: Asignaturas) => void;
  asignaturaEditar?: Asignaturas | null;
  onUpdate?: (data: Partial<Semestre>) => Promise<void>;
};

const ModalAsignatura: React.FC<Props> = ({
  setShowModal,
  setAsignaturas,
  asignaturaEditar,
}) => {
  const { showAlert } = useAlert();
  const params = useParams();

  const semestreId = Number(params.id);
  const [loading, setLoading] = useState(false);
  const [nuevaAsignatura, setNuevaAsignatura] = useState<
    Omit<Asignaturas, "id" | "semestreId">
  >({
    nombre: "",
    sigla: "",
    nivel: "",
    prerequisito: "",
    area: "",
    hp: "",
    hc: "",
    haa: "",
    hip: "",
    he: "",
    creditos: "",
    justificacion: "",
    seleccionado: false,
  });

  useEffect(() => {
    if (asignaturaEditar) {
      setNuevaAsignatura({
        ...asignaturaEditar,
      });
    }
  }, [asignaturaEditar]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNuevaAsignatura((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Guardar o actualizar asignatura
  const handleSave = async () => {
    if (
      !nuevaAsignatura.nombre ||
      !nuevaAsignatura.sigla ||
      !nuevaAsignatura.nivel ||
      !nuevaAsignatura.prerequisito ||
      !nuevaAsignatura.area
    ) {
      showAlert("Por favor, completa todos los campos obligatorios.", "error");
      return;
    }

    const asignaturaFinal: Asignaturas = {
      ...nuevaAsignatura,
      hp: Number(nuevaAsignatura.hp) || 0,
      hc: Number(nuevaAsignatura.hc) || 0,
      haa: Number(nuevaAsignatura.haa) || 0,
      hip: Number(nuevaAsignatura.hip) || 0,
      he: Number(nuevaAsignatura.he) || 0,
      creditos: Number(nuevaAsignatura.creditos) || 0,
      semestreId: semestreId,
    };

    try {
      setLoading(true);

      // Si estamos editando
      if (asignaturaEditar && asignaturaEditar.id) {
        const res = await axios.put(
          `/api/asignaturas/${asignaturaEditar.id}`,
          asignaturaFinal
        );
        const data = res.data;

        if (data.status) {
          // Actualiza la lista local de asignaturas
          setAsignaturas((prev) =>
            prev.map((a) =>
              a.id === asignaturaEditar.id ? data.asignaturaActualizada : a
            )
          );

          showAlert("Asignatura actualizada correctamente", "success");
          setShowModal(false);
        } else {
          showAlert("Error al actualizar la asignatura", "error");
        }

        return;
      }

      // Si estamos creando
      const res = await axios.post("/api/asignaturas", asignaturaFinal);
      const data = res.data;

      if (data.status) {
        setAsignaturas((prev) => [...prev, { ...data.nuevaAsignatura }]);
        showAlert("Asignatura creada exitosamente", "success");
        setShowModal(false);
      } else {
        showAlert("Error al crear la asignatura", "error");
      }
    } catch (error) {
      console.error("Error al guardar asignatura:", error);
      showAlert("Error al guardar la asignatura", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[90%] p-6 relative m-4">
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Agregar Nueva Asignatura (* son obligatorios)
        </h2>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            {
              label: "Nombre*",
              name: "nombre",
              type: "text",
              value: nuevaAsignatura.nombre,
            },
            {
              label: "Sigla*",
              name: "sigla",
              type: "text",
              value: nuevaAsignatura.sigla,
            },
            {
              label: "Nivel*",
              name: "nivel",
              type: "text",
              value: nuevaAsignatura.nivel,
            },
            {
              label: "Área*",
              name: "area",
              type: "text",
              value: nuevaAsignatura.area,
            },
            {
              label: "Prerrequisito*",
              name: "prerequisito",
              type: "text",
              value: nuevaAsignatura.prerequisito,
            },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium">{field.label}</label>
              <input
                type={field.type}
                value={field.value}
                name={field.name}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          ))}
        </div>

        {/* Línea única para los campos numéricos */}
        <div className="flex gap-2 flex-wrap mb-4">
          {[
            {
              label: "Créditos",
              name: "creditos",
              value: nuevaAsignatura.creditos,
            },
            { label: "HP", name: "hp", value: nuevaAsignatura.hp },
            { label: "HC", name: "hc", value: nuevaAsignatura.hc },
            { label: "HAA", name: "haa", value: nuevaAsignatura.haa },
            { label: "HIP", name: "hip", value: nuevaAsignatura.hip },
            { label: "HE", name: "he", value: nuevaAsignatura.he },
          ].map((field) => (
            <div key={field.name} className="flex-1 min-w-[100px]">
              <label className="block text-sm font-medium">{field.label}</label>
              <input
                type="number"
                name={field.name}
                value={field.value !== 0 ? field.value : ""}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          ))}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium">Justificación</label>
          <textarea
            name="justificacion"
            value={nuevaAsignatura.justificacion}
            onChange={handleChange}
            rows={3}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAsignatura;
