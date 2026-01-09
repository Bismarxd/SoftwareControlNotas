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

const RegistroActividades = () => {
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [busqueda, setBusqueda] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [actividadEditar, setActividadEditar] = useState<Actividad | null>(
    null
  );
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
        // Traer estudiantes
        const resEst = await axios.get(
          `/api/estudiantes/listado?asignaturaId=${asignaturaId}`
        );

        // Traer competencias y actividades
        const resComp = await axios.get(
          `/api/asignaturas/competencias?asignaturaId=${asignaturaId}`
        );

        if (resEst.data.status && resComp.data.status) {
          const competenciasData: Competencia[] = resComp.data.competencias;

          // Obtener todas las actividades únicas
          const todasActividades: Actividad[] = competenciasData.flatMap(
            (comp) =>
              comp.criterioevaluacion?.flatMap(
                (crit) =>
                  crit.evidencia?.flatMap((ev) => ev.actividad ?? []) ?? []
              ) ?? []
          );

          const actividadesUnicas = [
            ...new Map(
              todasActividades.filter(Boolean).map((a) => [a.id, a])
            ).values(),
          ];

          setActividades(actividadesUnicas);
          setCompetencias(competenciasData);

          // Mapear notas para cada estudiante
          const estudiantesConNotas = resEst.data.estudiantes.map(
            (est: any) => {
              const notas: Record<number, number> = {};
              est.notaactividad?.forEach((nota: any) => {
                notas[nota.actividadId] = nota.puntaje;
              });
              return { ...est, notas };
            }
          );

          // Ordenar estudiantes
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

  // Filtrar estudiantes por nombre
  const estudiantesFiltrados = useMemo(() => {
    return estudiantes.filter((est) =>
      est.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [estudiantes, searchTerm]);

  // Abrir modal para agregar o editar actividad
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
        const res = await axios.delete(
          `/api/evaluacion/registroActividades/${id}`
        );
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

  // Filtrar y ordenar actividades
  const actividadesFiltradas = useMemo(() => {
    let lista = [...actividades];

    if (filtroCompetencia) {
      lista = lista.filter((act) =>
        competencias.some(
          (comp) =>
            comp.id === Number(filtroCompetencia) &&
            comp.criterioevaluacion.some((crit) =>
              crit.evidencia.some((ev) =>
                ev.actividad?.some((a) => a.id === act.id)
              )
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
              crit.evidencia.some((ev) =>
                ev.actividad?.some((a) => a.id === act.id)
              )
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

    // 🔍 FILTRO DE BÚSQUEDA
    if (busqueda.trim() !== "") {
      const term = busqueda.toLowerCase();

      lista = lista.filter(
        (act) =>
          act.nombre.toLowerCase().includes(term) ||
          act.fecha?.toLowerCase().includes(term)
      );
    }

    // 🔽 ORDEN
    switch (ordenActividades) {
      case "fecha_asc":
        lista.sort(
          (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
        );
        break;
      case "fecha_desc":
        lista.sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
        break;
      case "nombre_asc":
        lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
        break;
      case "nombre_desc":
        lista.sort((a, b) => b.nombre.localeCompare(a.nombre, "es"));
        break;
    }

    return lista;
  }, [
    actividades,
    filtroCompetencia,
    filtroCriterio,
    filtroEvidencia,
    ordenActividades,
    competencias,
    busqueda,
  ]);

  const competenciasFiltradas = useMemo(() => {
    const actividadesIds = new Set(
      actividadesFiltradas.map((a) => a?.id).filter(Boolean)
    );

    return competencias
      .map((comp) => {
        const criterios =
          comp.criterioevaluacion
            ?.map((crit) => {
              const evidencias =
                crit.evidencia
                  ?.map((ev) => {
                    const actsFiltradas =
                      ev.actividad?.filter((a) => actividadesIds.has(a.id)) ??
                      [];
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

  //Para limpiar filtros
  const limpiarFiltros = () => {
    setFiltroCompetencia("");
    setFiltroCriterio("");
    setFiltroEvidencia("");
    setOrdenActividades("fecha_asc");
    setBusqueda("");
  };

  return (
    <SidebarLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-gray-700">
            Registro de Actividades
          </h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Buscar estudiante..."
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              onClick={() => handleModal()}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition hover:cursor-pointer"
            >
              Agregar Actividad
            </button>
          </div>
        </div>

        <div className="flex items-center mb-4 gap-4">
          <span className="font-semibold">Modo de calificación:</span>
          <button
            onClick={() =>
              setModoGeneral(modoGeneral === "nota" ? "simbolo" : "nota")
            }
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm hover:cursor-pointer"
          >
            {modoGeneral === "nota" ? "Símbolos" : "Números"}
          </button>
        </div>

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
          <p className="text-gray-500 text-center py-6">
            Cargando estudiantes...
          </p>
        ) : estudiantesFiltrados.length === 0 ? (
          <p className="text-gray-500 text-center py-6">
            No hay estudiantes registrados o no se encontraron coincidencias.
          </p>
        ) : (
          <TablaActividades
            estudiantesFiltrados={estudiantesFiltrados}
            actividades={actividadesFiltradas}
            competencias={competenciasFiltradas}
            modoGeneral={modoGeneral}
            handleEditarActividad={handleEditarActividad}
            handleEliminar={handleEliminar}
            setEstudiantes={setEstudiantes}
          />
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
