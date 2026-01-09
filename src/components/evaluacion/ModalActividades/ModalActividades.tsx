"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Competencia, Actividad, Evidencia } from "@/types/semestre";
import { useAlert } from "@/components/ui/Alert";
import axios from "axios";

interface ModalActividadesProps {
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  competencias: Competencia[];
  setCompetencias: React.Dispatch<React.SetStateAction<Competencia[]>>;
  actividadEditar: Actividad | null;
  setActividades: React.Dispatch<React.SetStateAction<Actividad[]>>;
}

const ModalActividades: React.FC<ModalActividadesProps> = ({
  showModal,
  setShowModal,
  competencias,
  setCompetencias,
  actividadEditar,
  setActividades,
}) => {
  const { showAlert } = useAlert();

  const [competenciaId, setCompetenciaId] = useState<number | "">("");
  const [criterioId, setCriterioId] = useState<number | "">("");
  const [criterios, setCriterios] = useState<any[]>([]);
  const [evidenciaId, setEvidenciaId] = useState<number | "">("");
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [actividadData, setActividadData] = useState({
    nombre: "",
    fecha: "",
  });

  const [loading, setLoading] = useState(false);

  // Inicializar modal si es edición
  useEffect(() => {
    if (!actividadEditar) return;

    // Buscar competencia
    const comp = competencias.find((c) =>
      c.criterioevaluacion.some((crit) =>
        crit.evidencia.some((ev) =>
          ev.actividad?.some((a) => a.id === actividadEditar.id)
        )
      )
    );
    if (!comp) return;
    setCompetenciaId(comp.id);
    setCriterios(comp.criterioevaluacion);

    // Buscar criterio
    const crit = comp.criterioevaluacion.find((crit) =>
      crit.evidencia.some((ev) =>
        ev.actividad?.some((a) => a.id === actividadEditar.id)
      )
    );
    if (crit) {
      setCriterioId(crit.id);
      setEvidencias(crit.evidencia);
    }

    // Buscar evidencia
    const ev = crit?.evidencia.find((ev) =>
      ev.actividad?.some((a) => a.id === actividadEditar.id)
    );
    if (ev) setEvidenciaId(ev.id);

    setActividadData({
      nombre: actividadEditar.nombre,
      fecha: actividadEditar.fecha.split("T")[0],
    });
  }, [actividadEditar, competencias]);

  if (!showModal) return null;

  const cerrarModal = () => setShowModal(false);

  const handleGuardar = async () => {
    if (!actividadData.nombre || !actividadData.fecha) {
      showAlert("Completa todos los campos antes de guardar.", "error");
      return;
    }

    if (!evidenciaId) {
      showAlert("Selecciona una evidencia antes de guardar.", "error");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        id: actividadEditar?.id || null,
        nombre: actividadData.nombre,
        fecha: new Date(actividadData.fecha),
        evidenciaId: Number(evidenciaId),
      };

      const res = actividadEditar
        ? await axios.put("/api/evaluacion/registroActividades", payload)
        : await axios.post("/api/evaluacion/registroActividades", payload);

      const data = res.data;

      if (!data.status) {
        showAlert(data.message || "Error al guardar la actividad", "error");
        return;
      }

      const nuevaActividad = data.actividad;
      const esEdicion = Boolean(actividadEditar?.id);

      // Actualizar competencias sin borrar actividades por error
      setCompetencias((prev) =>
        prev.map((comp) => ({
          ...comp,
          criterioEvaluacion: comp.criterioevaluacion.map((crit) => ({
            ...crit,
            evidencia: crit.evidencia.map((ev) => {
              // Copia segura del array
              let nuevasActividades = ev.actividad ? [...ev.actividad] : [];

              // Si es edición → reemplazo
              if (esEdicion) {
                nuevasActividades = nuevasActividades.map((a) =>
                  a.id === actividadEditar?.id ? nuevaActividad : a
                );
              }

              // Si es creación → agregar pero SOLO a la evidencia seleccionada
              if (!esEdicion && ev.id === Number(evidenciaId)) {
                nuevasActividades.push(nuevaActividad);
                window.location.reload();
              }

              return {
                ...ev,
                actividades: nuevasActividades,
              };
            }),
          })),
        }))
      );

      // 2) Actualizar arreglo principal de actividades (tabla)
      setActividades((prev) => {
        let nuevas = [...prev];

        if (esEdicion) {
          nuevas = nuevas.map((a) =>
            a.id === actividadEditar?.id ? nuevaActividad : a
          );
        } else {
          nuevas.push(nuevaActividad);
        }

        return nuevas.sort(
          (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
        );
      });

      showAlert(
        esEdicion ? "Actividad actualizada" : "Actividad añadida",
        "success"
      );

      // 🔥 3) Limpiar todo y cerrar modal
      setActividadData({ nombre: "", fecha: "" });
      setEvidenciaId("");
      setCriterioId("");
      setCompetenciaId("");
      setShowModal(false);
    } catch (error) {
      console.error("Error al guardar la actividad:", error);
      showAlert("Ocurrió un error al guardar la actividad.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Fondo */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={cerrarModal} />

      {/* Panel lateral */}
      <div className="fixed right-0 top-0 w-full sm:w-1/3 h-full bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
        <div className="flex justify-between items-center border-b px-6 py-4 bg-teal-600 text-white">
          <h2 className="text-lg font-semibold">
            {actividadEditar ? "Editar Actividad" : "Agregar Actividad"}
          </h2>
          <button onClick={cerrarModal} className="hover:text-gray-200">
            <X size={22} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-6 flex-grow overflow-y-auto">
          {/* Competencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Competencia
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              value={competenciaId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setCompetenciaId(id);

                const compSeleccionada = competencias.find((c) => c.id === id);
                setCriterios(compSeleccionada?.criterioevaluacion || []);
                setCriterioId("");
                setEvidencias([]);
                setEvidenciaId("");
              }}
            >
              <option value="" disabled>
                Selecciona una competencia
              </option>
              {competencias.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.tipo} – {comp.porcentaje}%
                </option>
              ))}
            </select>
          </div>

          {/* Criterio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Criterio de Evaluación
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              value={criterioId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setCriterioId(id);

                const critSeleccionado = criterios.find((c) => c.id === id);
                setEvidencias(critSeleccionado?.evidencia || []);
                setEvidenciaId("");
              }}
              disabled={!competenciaId}
            >
              <option value="" disabled>
                Selecciona un criterio
              </option>
              {criterios.map((crit) => (
                <option key={crit.id} value={crit.id}>
                  {crit.nombre} – {crit.porcentaje}%
                </option>
              ))}
            </select>
          </div>

          {/* Evidencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Evidencia
            </label>
            {evidencias.length > 0 ? (
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                value={evidenciaId}
                onChange={(e) => setEvidenciaId(Number(e.target.value))}
                disabled={!criterioId}
              >
                <option value="" disabled>
                  Selecciona una evidencia
                </option>
                {evidencias.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-500 mt-1">
                No hay evidencias disponibles para este criterio.
              </p>
            )}
          </div>

          {/* Detalles de la actividad */}
          <div className="mt-4 border rounded-lg p-3 bg-gray-50">
            <label className="text-sm text-gray-600">
              Nombre de la Actividad
            </label>
            <input
              type="text"
              value={actividadData.nombre}
              onChange={(e) =>
                setActividadData((prev) => ({
                  ...prev,
                  nombre: e.target.value,
                }))
              }
              className="w-full border border-gray-300 rounded-lg px-2 py-1 focus:outline-none mb-2"
            />

            <label className="text-sm text-gray-600">
              Fecha de la Actividad
            </label>
            <input
              type="date"
              value={actividadData.fecha}
              onChange={(e) =>
                setActividadData((prev) => ({ ...prev, fecha: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-2 py-1"
            />

            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={cerrarModal}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition hover:cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={loading}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50 hover:cursor-pointer"
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModalActividades;
