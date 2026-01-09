"use client";

import React, { useEffect, useMemo, useState } from "react";
import SidebarLayout from "@/components/Sidebar/SidebarLayout";
import { Competencia, Estudiante } from "@/types/semestre";
import axios from "axios";
import TablaCalificacionesFinales from "@/components/evaluacion/calificacionesFinales/TablaCalificacionesFinales";

const redondear = (num: number, decimales = 2) =>
  Math.round(num * 10 ** decimales) / 10 ** decimales;

interface PromediosFinales {
  [estId: number]: {
    nombre: string;
    competencias: { [compId: number]: number };
    promedioFinal: number;
    notaSegundoTurno: number;
  };
}

const CalificacionesFinales = () => {
  const [loading, setLoading] = useState(true);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [promedios, setPromedios] = useState<PromediosFinales>({});

  useEffect(() => {
    const materiaSeleccionada = localStorage.getItem("materiaSeleccionada");
    if (!materiaSeleccionada) return;

    const asignaturaId = JSON.parse(materiaSeleccionada);

    const fetchDatos = async () => {
      setLoading(true);
      try {
        const [resEst, resComp, resProm] = await Promise.all([
          axios.get(`/api/estudiantes/listado?asignaturaId=${asignaturaId}`),
          axios.get(
            `/api/asignaturas/competencias?asignaturaId=${asignaturaId}`
          ),
          axios.get(
            `/api/evaluacion/promedioParcial?asignaturaId=${asignaturaId}`
          ),
        ]);

        if (resEst.data.status && resComp.data.status) {
          console.log(resProm.data.promedios);
          setEstudiantes(resEst.data.estudiantes);
          setCompetencias(resComp.data.competencias);

          // Organizar promedios por estudiante desde la BD
          const calc: PromediosFinales = {};
          (resProm.data.promedios || []).forEach((p: any) => {
            if (!calc[p.estudianteId]) {
              const est = resEst.data.estudiantes.find(
                (e: any) => e.id === p.estudianteId
              );
              calc[p.estudianteId] = {
                nombre: est?.nombre,
                competencias: {},
                promedioFinal: 0,
                notaSegundoTurno: 0,
              };
            }

            if (p.tipo === "competencia" && p.competenciaId) {
              calc[p.estudianteId].competencias[p.competenciaId] = p.promedio;
            }

            // Si existe un registro de promedio final directamente
            if (p.tipo === "final") {
              calc[p.estudianteId].promedioFinal = Number(p.promedio);
            }
            if (p.tipo === "segundoTurno") {
              calc[p.estudianteId].notaSegundoTurno = Number(p.promedio);
            }
          });
          setPromedios(calc);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDatos();
  }, []);

  return (
    <SidebarLayout>
      <div className="p-6">
        <h2 className="text-3xl font-bold text-gray-700 mb-6">
          Calificaciones Finales
        </h2>

        {loading ? (
          <p className="text-gray-500 text-center py-6">Cargando...</p>
        ) : (
          <TablaCalificacionesFinales
            estudiantes={estudiantes}
            competencias={competencias}
            promedios={promedios}
            setPromedios={setPromedios}
          />
        )}
      </div>
    </SidebarLayout>
  );
};

export default CalificacionesFinales;
