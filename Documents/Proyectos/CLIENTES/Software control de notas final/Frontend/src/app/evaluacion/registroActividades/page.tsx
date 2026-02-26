"use client";

import React, { useEffect, useState, useMemo } from "react";
import SidebarLayout from "@/components/Sidebar/SidebarLayout";
import axios from "axios";
import { Estudiante, Competencia, Actividad } from "@/types/semestre";
import ModalActividades from "@/components/evaluacion/ModalActividades/ModalActividades";
import { useAlert } from "@/components/ui/Alert";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import FiltrosActividades from "@/components/evaluacion/registroActividades/FiltrosActividades";
import TablaActividades from "@/components/evaluacion/registroActividades/TablaActividades";
import { motion } from "framer-motion";
import { PlusCircle, Search, Loader2, Users, Hash, ToggleLeft, ToggleRight } from "lucide-react";

const RegistroActividades = () => {
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [busqueda, setBusqueda] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [actividadEditar, setActividadEditar] = useState<Actividad | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modoGeneral, setModoGeneral] = useState<"nota" | "simbolo">("nota");

  // Filtros y orden
  const [filtroCompetencia, setFiltroCompetencia] = useState("");
  const [filtroCriterio, setFiltroCriterio] = useState("");
  const [filtroEvidencia, setFiltroEvidencia] = useState("");
  const [ordenActividades, setOrdenActividades] = useState("fecha_asc");

  // Cargar estudiantes y competencias
  useEffect(() => {
    const materiaSeleccionada = localStorage.getItem("materiaSeleccionada");
    if (!materiaSeleccionada) return;
    const asignaturaId = JSON.parse(materiaSeleccionada);

    const fetchDatos = async () => {
      setLoading(true);
      try {
        const resEst = await axios.get(`/api/estudiantes/listado?asignaturaId=${asignaturaId}`);
        const resComp = await axios.get(`/api/asignaturas/competencias?asignaturaId=${asignaturaId}`);

        if (resEst.data.status && resComp.data.status) {
          const competenciasData: Competencia[] = resComp.data.competencias;

          const todasActividades: Actividad[] = competenciasData.flatMap(
            (comp) =>
              comp.criterioevaluacion?.flatMap(
                (crit) => crit.evidencia?.flatMap((ev) => ev.actividad ?? []) ?? []
              ) ?? []
          );

          const actividadesUnicas = [
            ...new Map(todasActividades.filter(Boolean).map((a) => [a.id, a])).values(),
          ];

          setActividades(actividadesUnicas);
          setCompetencias(competenciasData);

          const estudiantesConNotas = resEst.data.estudiantes.map((est: any) => {
            const notas: Record<number, number> = {};
            est.notaactividad?.forEach((nota: any) => { notas[nota.actividadId] = nota.puntaje; });
            return { ...est, notas };
          });

          estudiantesConNotas.sort((a: any, b: any) =>
            a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
          );

          setEstudiantes(estudiantesConNotas);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDatos();
  }, []);

  console.log(competencias);

  const estudiantesFiltrados = useMemo(() => {
    return estudiantes.filter((est) =>
      est.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [estudiantes, searchTerm]);

  const handleModal = (actividad?: Actividad) => {
    setActividadEditar(actividad || null);
    setShowModal(true);
  };

  const handleEditarActividad = (id: number) => {
    const competencia = competencias.find((comp) =>
      comp.criterioevaluacion.some((crit) =>
        crit.evidencia.some((ev) => ev.actividad?.some((a) => a.id === id))
      )
    );
    if (!competencia) return;

    let actividadEncontrada: Actividad | null = null;
    competencia.criterioevaluacion.forEach((crit) => {
      crit.evidencia.forEach((ev) => {
        const act = ev.actividad?.find((a) => a.id === id);
        if (act) actividadEncontrada = act;
      });
    });

    if (!actividadEncontrada) return;
    handleModal(actividadEncontrada);
  };

  const handleEliminar = async (id: number) => {
    showConfirm("¿Está seguro que desea eliminar la actividad?", async () => {
      try {
        const res = await axios.delete(`/api/evaluacion/registroActividades/${id}`);
        if (res.data.status) {
          showAlert(res.data.message, "success");
          window.location.reload();
        } else {
          showAlert(res.data.message, "error");
        }
      } catch (error) {
        console.error(error);
      }
    });
  };

  const actividadesFiltradas = useMemo(() => {
    let lista = [...actividades];

    if (filtroCompetencia) {
      lista = lista.filter((act) =>
        competencias.some(
          (comp) =>
            comp.id === Number(filtroCompetencia) &&
            comp.criterioevaluacion.some((crit) =>
              crit.evidencia.some((ev) => ev.actividad?.some((a) => a.id === act.id))
            )
        )
      );
    }

    if (filtroCriterio) {
      lista = lista.filter((act) =>
        competencias.some((comp) =>
          comp.criterioevaluacion.some(
            (crit) =>
              crit.id === Number(filtroCriterio) &&
              crit.evidencia.some((ev) => ev.actividad?.some((a) => a.id === act.id))
          )
        )
      );
    }

    if (filtroEvidencia) {
      lista = lista.filter((act) =>
        competencias.some((comp) =>
          comp.criterioevaluacion.some((crit) =>
            crit.evidencia.some(
              (ev) =>
                ev.id === Number(filtroEvidencia) &&
                ev.actividad?.some((a) => a.id === act.id)
            )
          )
        )
      );
    }

    if (busqueda.trim() !== "") {
      const term = busqueda.toLowerCase();
      lista = lista.filter(
        (act) =>
          act.nombre.toLowerCase().includes(term) ||
          act.fecha?.toLowerCase().includes(term)
      );
    }

    switch (ordenActividades) {
      case "fecha_asc":
        lista.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
        break;
      case "fecha_desc":
        lista.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        break;
      case "nombre_asc":
        lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
        break;
      case "nombre_desc":
        lista.sort((a, b) => b.nombre.localeCompare(a.nombre, "es"));
        break;
    }

    return lista;
  }, [actividades, filtroCompetencia, filtroCriterio, filtroEvidencia, ordenActividades, competencias, busqueda]);

  const competenciasFiltradas = useMemo(() => {
    const actividadesIds = new Set(actividadesFiltradas.map((a) => a?.id).filter(Boolean));

    return competencias
      .map((comp) => {
        const criterios =
          comp.criterioevaluacion
            ?.map((crit) => {
              const evidencias =
                crit.evidencia
                  ?.map((ev) => {
                    const actsFiltradas = ev.actividad?.filter((a) => actividadesIds.has(a.id)) ?? [];
                    if (actsFiltradas.length === 0) return null;
                    return { ...ev, actividad: actsFiltradas };
                  })
                  .filter(Boolean) ?? [];
              if (evidencias.length === 0) return null;
              return { ...crit, evidencia: evidencias };
            })
            .filter(Boolean) ?? [];

        if (criterios.length === 0) return null;
        return { ...comp, criterioevaluacion: criterios };
      })
      .filter(Boolean);
  }, [competencias, actividadesFiltradas]);

  const limpiarFiltros = () => {
    setFiltroCompetencia("");
    setFiltroCriterio("");
    setFiltroEvidencia("");
    setOrdenActividades("fecha_asc");
    setBusqueda("");
  };

  return (
    <SidebarLayout>
      <div className="max-w-full mx-auto space-y-6 pb-12 transition-colors duration-300">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 border-b border-gray-200 dark:border-gray-800 pb-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
              <span className="w-1.5 h-8 bg-teal-600 rounded-full" />
              Registro de Actividades
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 ml-4">
              Registra y gestiona las notas de los estudiantes por actividad.
            </p>
          </motion.div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Buscador de estudiante */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
              <input
                type="text"
                placeholder="Buscar estudiante..."
                className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 outline-none w-full sm:w-56 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Botón agregar */}
            <button
              onClick={() => handleModal()}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-lg shadow-teal-600/20 transition-all active:scale-95 font-bold whitespace-nowrap cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              Agregar Actividad
            </button>
          </div>
        </div>

        {/* Stats rápidas */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-4"
        >
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Estudiantes</p>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white">{estudiantesFiltrados.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
              <Hash className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Actividades</p>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white">{actividadesFiltradas.length}</p>
            </div>
          </div>

          {/* Toggle modo calificación */}
          <div className="col-span-2 sm:col-span-1 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3 shadow-sm">
            <div className="flex-1">
              <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                Modo de calificación
              </p>
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                {modoGeneral === "nota" ? "Números" : "Símbolos"}
              </p>
            </div>
            <button
              onClick={() => setModoGeneral(modoGeneral === "nota" ? "simbolo" : "nota")}
              className="shrink-0 cursor-pointer"
            >
              {modoGeneral === "nota" ? (
                <ToggleLeft className="w-9 h-9 text-gray-400 hover:text-teal-500 transition-colors" />
              ) : (
                <ToggleRight className="w-9 h-9 text-teal-600 dark:text-teal-400" />
              )}
            </button>
          </div>
        </motion.div>

        {/* Filtros */}
        <FiltrosActividades
          limpiarFiltros={limpiarFiltros}
          competencias={competencias}
          filtroCompetencia={filtroCompetencia}
          setFiltroCompetencia={setFiltroCompetencia}
          filtroCriterio={filtroCriterio}
          setFiltroCriterio={setFiltroCriterio}
          filtroEvidencia={filtroEvidencia}
          setFiltroEvidencia={setFiltroEvidencia}
          ordenActividades={ordenActividades}
          setOrdenActividades={setOrdenActividades}
          busqueda={searchTerm}
          setBusqueda={setSearchTerm}
        />

        {/* Tabla */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-[40vh] text-gray-400 dark:text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest">Cargando datos...</p>
          </div>
        ) : estudiantesFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 dark:bg-gray-800/10 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600">
            <Users className="w-10 h-10 mb-3 opacity-40" />
            <p className="font-bold dark:text-gray-400">No hay estudiantes registrados</p>
            <p className="text-sm opacity-70 mt-1">No se encontraron coincidencias con tu búsqueda.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="-mx-4 sm:mx-0 bg-white dark:bg-[#1e1e1e] sm:rounded-2xl border-y sm:border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
          >
            <TablaActividades
              estudiantesFiltrados={estudiantesFiltrados}
              actividades={actividadesFiltradas}
              competencias={competenciasFiltradas}
              modoGeneral={modoGeneral}
              handleEditarActividad={handleEditarActividad}
              handleEliminar={handleEliminar}
              setEstudiantes={setEstudiantes}
            />
          </motion.div>
        )}
      </div>

      {showModal && (
        <ModalActividades
          showModal={showModal}
          setShowModal={setShowModal}
          competencias={competencias}
          setCompetencias={setCompetencias}
          actividadEditar={actividadEditar}
          setActividades={setActividades}
        />
      )}
    </SidebarLayout>
  );
};

export default RegistroActividades;
