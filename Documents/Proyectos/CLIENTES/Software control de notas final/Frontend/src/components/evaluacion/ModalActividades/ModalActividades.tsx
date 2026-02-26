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
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={cerrarModal}
      />

      {/* Panel lateral */}
      <div className="fixed right-0 top-0 w-full sm:w-1/3 h-full bg-white dark:bg-gray-900 black:bg-black shadow-2xl z-50 flex flex-col animate-slide-in border-l border-gray-200 dark:border-gray-800 black:border-gray-900">
        <div className="flex justify-between items-center border-b border-white/10 px-6 py-5 bg-teal-600 dark:bg-teal-700 text-white">
          <h2 className="text-xl font-bold tracking-tight">
            {actividadEditar ? "Editar Actividad" : "Nueva Actividad"}
          </h2>
          <button
            onClick={cerrarModal}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col gap-6 p-8 flex-grow overflow-y-auto">
          {/* Competencia */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Competencia
            </label>
            <select
              className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all dark:text-gray-200"
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
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Criterio de Evaluación
            </label>
            <select
              className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all dark:text-gray-200 disabled:opacity-50"
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
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Evidencia
            </label>
            {evidencias.length > 0 ? (
              <select
                className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all dark:text-gray-200 disabled:opacity-50"
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
              <p className="text-sm text-gray-500 italic mt-1">
                No hay evidencias disponibles para este criterio.
              </p>
            )}
          </div>

          <div className="h-px bg-gray-200 dark:bg-gray-800 my-2" />

          {/* Detalles de la actividad */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Nombre de la Actividad
              </label>
              <input
                type="text"
                placeholder="Ej. Análisis de Caso Clínico I"
                value={actividadData.nombre}
                onChange={(e) =>
                  setActividadData((prev) => ({
                    ...prev,
                    nombre: e.target.value,
                  }))
                }
                className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all dark:text-gray-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Fecha de la Actividad
              </label>
              <input
                type="date"
                value={actividadData.fecha}
                onChange={(e) =>
                  setActividadData((prev) => ({
                    ...prev,
                    fecha: e.target.value,
                  }))
                }
                className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all dark:text-gray-200"
              />
            </div>
          </div>
        </div>

        {/* Footer fijo */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-6 bg-gray-50 dark:bg-gray-900/50 black:bg-black flex justify-end gap-3">
          <button
            onClick={cerrarModal}
            className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition shadow-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={loading}
            className="px-8 py-2.5 bg-teal-600 dark:bg-teal-700 text-white rounded-xl hover:bg-teal-700 dark:hover:bg-teal-600 transition shadow-lg shadow-teal-500/20 disabled:opacity-50 font-bold flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Actividad"
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default ModalActividades;
