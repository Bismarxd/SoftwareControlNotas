"use client";

import React, { useEffect, useMemo, useState } from "react";
import SidebarLayout from "@/components/Sidebar/SidebarLayout";
import axios from "axios";
import ModalClase from "@/components/evaluacion/ModalClase";
import { Clase, Estudiante } from "@/types/semestre";
import { useConfirm } from "@/components/ui/ConfirmDialog";

import FiltrosAsistencia from "@/components/evaluacion/registroAsistencia/FiltroAsistencia";
import TablaAsistencia from "@/components/evaluacion/registroAsistencia/TablaAsistencia";

const RegistroAsistencia = () => {
  const { showConfirm } = useConfirm();
  const [showModal, setShowModal] = useState(false);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [clase, setClase] = useState<Clase[]>([]);

  // FILTROS
  const [filtroFechaInicio, setFiltroFechaInicio] = useState("");
  const [filtroFechaFin, setFiltroFechaFin] = useState("");
  const [busquedaEstudiante, setBusquedaEstudiante] = useState("");

  // ====================
  // CARGA DE DATOS
  // ====================
  useEffect(() => {
    const materiaIdString = localStorage.getItem("materiaSeleccionada");
    const materiaId = materiaIdString ? JSON.parse(materiaIdString) : null;

    const fetchEstudiantes = async () => {
      if (!materiaId) return;

      try {
        const res = await axios.get(
          `/api/estudiantes/listado?asignaturaId=${materiaId}`
        );

        if (res.data.status) {
          const estudiantesConAsistencias = res.data.estudiantes.map(
            (est: any) => ({
              ...est,
              asistencias: est.asistencia.reduce(
                (acc: Record<number, boolean>, a: any) => {
                  acc[a.claseId] = a.presente;
                  return acc;
                },
                {}
              ),
            })
          );

          setEstudiantes(estudiantesConAsistencias);
        }
      } catch (error) {
        console.error("Error al cargar estudiantes:", error);
      }
    };

    const fetchClases = async () => {
      try {
        const res = await axios.get(
          `/api/evaluacion/clase?asignaturaId=${materiaId}`
        );

        if (res.data.status) {
          setClase(res.data.clases);
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchEstudiantes();
    fetchClases();
  }, []);

  // ====================
  // TOGGLE ASISTENCIA
  // ====================
  const toggleAsistencia = async (
    estudianteId: number,
    claseId: number,
    presente: boolean
  ) => {
    const estudiante = estudiantes.find((e) => e.id === estudianteId);
    const nombre = estudiante?.nombre || "este estudiante";

    if (!presente) {
      showConfirm(`¿Seguro que desea marcar como AUSENTE a ${nombre}?`, () =>
        actualizarAsistencia(estudianteId, claseId, presente)
      );
      return;
    }

    actualizarAsistencia(estudianteId, claseId, presente);
  };

  const actualizarAsistencia = async (
    estudianteId: number,
    claseId: number,
    presente: boolean
  ) => {
    try {
      const res = await axios.post("/api/evaluacion/registroAsistencia", {
        estudianteId,
        claseId,
        presente,
      });

      const { porcentaje } = res.data;

      setEstudiantes((prev) =>
        prev.map((est: any) =>
          est.id === estudianteId
            ? {
                ...est,
                asistencias: { ...est.asistencias, [claseId]: presente },
                porcentajeAsistencia: porcentaje,
              }
            : est
        )
      );
    } catch (error) {
      console.error("Error al actualizar asistencia:", error);
    }
  };

  // ====================
  // 🔹 FILTROS MEMO
  // ====================
  const clasesFiltradas = useMemo(() => {
    return clase.filter((c) => {
      if (!filtroFechaInicio && !filtroFechaFin) return true;

      const fecha = new Date(c.fecha);
      const inicio = filtroFechaInicio ? new Date(filtroFechaInicio) : null;
      const fin = filtroFechaFin ? new Date(filtroFechaFin) : null;

      if (inicio && fecha < inicio) return false;
      if (fin && fecha > fin) return false;

      return true;
    });
  }, [clase, filtroFechaInicio, filtroFechaFin]);

  const estudiantesFiltrados = useMemo(() => {
    return estudiantes.filter((e) =>
      e.nombre.toLowerCase().includes(busquedaEstudiante.toLowerCase())
    );
  }, [estudiantes, busquedaEstudiante]);

  return (
    <SidebarLayout>
      <div className="p-6">
        {/* 🔎 COMPONENTE DE FILTROS */}
        <FiltrosAsistencia
          busquedaEstudiante={busquedaEstudiante}
          setBusquedaEstudiante={setBusquedaEstudiante}
          filtroFechaInicio={filtroFechaInicio}
          setFiltroFechaInicio={setFiltroFechaInicio}
          filtroFechaFin={filtroFechaFin}
          setFiltroFechaFin={setFiltroFechaFin}
          handleAgregarClase={() => setShowModal(true)}
        />

        {/* 🔎 TABLA */}
        <TablaAsistencia
          estudiantes={estudiantesFiltrados}
          clases={clasesFiltradas}
          toggleAsistencia={toggleAsistencia}
        />
      </div>

      {showModal && (
        <ModalClase setShowModal={setShowModal} setClase={setClase} />
      )}
    </SidebarLayout>
  );
};

export default RegistroAsistencia;
