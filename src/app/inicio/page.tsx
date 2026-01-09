"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

import SidebarLayout from "@/components/Sidebar/SidebarLayout";
import { useAlert } from "@/components/ui/Alert";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import {
  Competencia,
  Estudiante,
  PromedioParcial,
  Asignaturas,
} from "@/types/semestre";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar, Doughnut } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Eye,
  EyeOff,
  PieChart,
  User,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Semestre {
  id: number;
}

interface Materia {
  id: number;
  nombre: string;
  sigla: string;
  seleccionado: boolean;
  estudiante: Estudiante[];
  competencia?: Competencia[];
  clase?: any[];
}

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);

  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [semestre, setSemestre] = useState<Semestre | null>(null);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [materia, setMateria] = useState<Materia | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMaterias, setShowMaterias] = useState(false);

  const fetchMaterias = async (id: number) => {
    try {
      const res = await axios.get(`/api/asignaturas/${id}`);
      const data = res.data;

      if (data.status) {
        setMaterias(data.asignaturas);

        const materiaSeleccionada = data.asignaturas.find(
          (m: Materia) => m.seleccionado
        );

        setMateria(materiaSeleccionada || null);

        // 🔥 SI NO HAY MATERIA SELECCIONADA → MOSTRAR LISTA
        if (!materiaSeleccionada && data.asignaturas.length > 0) {
          setShowMaterias(true);
        }
      }
    } catch (error) {
      console.error("Error al cargar materias:", error);
    }
  };

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");
    const data = localStorage.getItem("semestreSeleccionado");
    if (!usuario) return router.push("/");

    if (data && data !== "undefined" && data !== "null") {
      try {
        setSemestre(JSON.parse(data));
      } catch {
        localStorage.removeItem("semestreSeleccionado");
      }
    }
  }, [router]);

  useEffect(() => {
    if (semestre) fetchMaterias(semestre.id);
  }, [semestre]);

  const handleSeleccionar = async (
    materiaId: number,
    materiaNombre: string
  ) => {
    if (!semestre) return;
    showConfirm("¿Desea seleccionar esta Asignatura?", async () => {
      setLoading(true);
      try {
        await axios.put(`/api/asignaturas/seleccionar/${materiaId}`, {
          semestreId: semestre.id,
        });
        await fetchMaterias(semestre.id);
        localStorage.setItem("materiaSeleccionada", JSON.stringify(materiaId));
        localStorage.setItem("materiaNombre", JSON.stringify(materiaNombre));
        showAlert(`Materia seleccionada: ${materiaNombre}`);
        window.location.reload();
      } catch (error) {
        console.error("Error al seleccionar materia:", error);
      } finally {
        setLoading(false);
      }
    });
  };

  const stats = useMemo(() => {
    if (!materia)
      return {
        estudiantes: 0,
        competencias: 0,
        criterioevaluacion: 0,
        actividades: 0,
      };
    return {
      estudiantes: materia.estudiante?.length ?? 0,
      competencias: materia.competencia?.length ?? 0,
      actividades: materia.clase?.length ?? 0,
    };
  }, [materia]);

  // Datos para gráfico del procentaje de las competencias
  const chartCompetenciasTorta = useMemo(() => {
    if (!materia?.competencia) return { labels: [], datasets: [] };

    // total de criterios
    const totalCriterios = materia.competencia.reduce(
      (acc: number, c: any) => acc + (c.criterioevaluacion?.length ?? 0),
      0
    );

    // si no hay criterios, no mostrar nada
    if (totalCriterios === 0) return { labels: [], datasets: [] };

    const labels = materia.competencia.map((c: any) => c.tipo);

    const data = materia.competencia.map((c: any) => {
      const cantidad = c.criterioevaluacion?.length ?? 0;
      return Number(((cantidad / totalCriterios) * 100).toFixed(2));
    });

    return {
      labels,
      datasets: [
        {
          label: "% de Competencias",
          data,
          backgroundColor: [
            "#22c55e",
            "#3b82f6",
            "#f59e0b",
            "#ef4444",
            "#8b5cf6",
            "#14b8a6",
          ],
          borderColor: "#ffffff",
          borderWidth: 3,
          hoverOffset: 20, // efecto al pasar el mouse
        },
      ],
    };
  }, [materia]);

  const optionsCompetenciasTorta = {
    responsive: true,
    cutout: "65%", // dona más elegante
    animation: {
      animateRotate: true,
      animateScale: true,
    },
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          boxWidth: 18,
          font: {
            size: 12,
            weight: "bold" as const, // ✅ usar as const
          },
        },
      },
      title: {
        display: true,
        text: "Distribución porcentual de Competencias",
        font: {
          size: 18,
          weight: "bold" as const, // ✅ usar as const
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.label}: ${context.raw}%`,
        },
      },

      // 🔥 PORCENTAJES DENTRO DE LA TORTA
      datalabels: {
        color: "#fff",
        font: {
          weight: "bold" as const, // ✅ usar as const aquí también
          size: 14,
        },
        formatter: (value: number) => `${value}%`,
      },
    },
  };

  const chartAprobadosReprobados = useMemo(() => {
    if (!materia?.estudiante) return { labels: [], datasets: [] };

    let aprobados = 0;
    let reprobados = 0;

    materia.estudiante.forEach((est: any) => {
      // Busca el promedio final
      const final = est.promedioparcial?.find(
        (p: any) => p.tipo === "final"
      )?.promedio;

      if (final !== undefined && final !== null) {
        if (final >= 50) aprobados++;
        else reprobados++;
      }
    });

    return {
      labels: ["Aprobados", "Reprobados"],
      datasets: [
        {
          label: "Estudiantes",
          data: [aprobados, reprobados],
          backgroundColor: ["#22c55e", "#ef4444"], // verde y rojo
          borderColor: "#ffffff",
          borderWidth: 2,
          hoverOffset: 15,
        },
      ],
    };
  }, [materia]);

  const optionsAprobadosReprobados = {
    responsive: true,
    cutout: "65%",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          boxWidth: 18,
          font: { size: 12, weight: "bold" as const },
        },
      },
      title: {
        display: true,
        text: "Estudiantes Aprobados y Reprobados",
        font: { size: 18, weight: "bold" as const },
        padding: { bottom: 20 },
      },
      datalabels: {
        color: "#fff",
        font: { weight: "bold" as const, size: 14 },
        formatter: (value: number, context: any) => {
          const total = context.chart.data.datasets[0].data.reduce(
            (acc: number, val: number) => acc + val,
            0
          );
          const porcentaje = total ? ((value / total) * 100).toFixed(1) : 0;
          return `${value} (${porcentaje}%)`;
        },
      },
    },
  };

  // if(!materias.length && !loading) return <div>Cargando...</div>;

  return (
    <SidebarLayout>
      <div className="flex min-h-screen bg-gray-100 text-gray-800">
        <main className="flex-1 p-6">
          {loading && <p className="text-gray-500 mb-4">Actualizando...</p>}

          {showMaterias && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
              {materias.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleSeleccionar(m.id, m.nombre)}
                  className={`relative w-full h-[320px] rounded-[15px] flex flex-col items-center justify-center font-bold text-[22px] cursor-pointer overflow-hidden group shadow-md transition-all duration-500
                    ${
                      m.seleccionado
                        ? "bg-cyan-600 hover:bg-cyan-700 text-white"
                        : "bg-teal-400 hover:bg-teal-500 text-black"
                    }`}
                >
                  {m.nombre}
                  <p className="text-[15px] text-neutral-100">{m.sigla}</p>
                  <p className="text-sm mt-2">
                    Estudiantes: {m.estudiante?.length ?? 0}
                  </p>

                  {!m.seleccionado && (
                    <div className="absolute bottom-0 left-0 w-[20%] h-[20%] bg-teal-200 rounded-tr-[100%] rounded-bl-[15px] flex items-center justify-center transition-all duration-500 group-hover:w-full group-hover:h-full group-hover:rounded-[15px]">
                      <span className="opacity-0 group-hover:opacity-100 text-gray-700 font-bold transition-opacity duration-500">
                        Seleccionar
                      </span>
                    </div>
                  )}

                  {m.seleccionado && (
                    <div className="absolute top-3 right-3 bg-white text-green-600 text-xs font-semibold px-2 py-1 rounded-full shadow">
                      Seleccionado
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Estadísticas generales */}
          {materia && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* ESTUDIANTES */}
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-5 shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />

                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-sm text-white/80">Estudiantes</p>
                    <p className="text-3xl font-bold text-white">
                      {stats.estudiantes}
                    </p>
                  </div>

                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20">
                    <User className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* COMPETENCIAS */}
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />

                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-sm text-white/80">Competencias</p>
                    <p className="text-3xl font-bold text-white">
                      {stats.competencias}
                    </p>
                  </div>

                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GRÁFICOS DE TORTA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* TORTA COMPETENCIAS */}
            {materia && chartCompetenciasTorta.labels.length > 0 && (
              <div className="group relative rounded-3xl bg-white/80 backdrop-blur-md border border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 p-6">
                {/* Glow */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-teal-400/10 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition" />

                {/* Header */}
                <div className="relative z-10 flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-600 text-white shadow">
                    <PieChart className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Distribución de Competencias
                  </h3>
                </div>

                {/* Chart */}
                <div className="relative z-10 flex items-center justify-center h-[300px]">
                  <Doughnut
                    data={chartCompetenciasTorta}
                    options={optionsCompetenciasTorta}
                  />
                </div>
              </div>
            )}

            {/* TORTA APROBADOS / REPROBADOS */}
            {materia && materia.estudiante?.length > 0 && (
              <div className="group relative rounded-3xl bg-white/80 backdrop-blur-md border border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 p-6">
                {/* Glow */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition" />

                {/* Header */}
                <div className="relative z-10 flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-600 text-white shadow">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Aprobados vs Reprobados
                  </h3>
                </div>

                {/* Chart */}
                <div className="relative z-10 flex items-center justify-center h-[300px]">
                  <Doughnut
                    data={chartAprobadosReprobados}
                    options={optionsAprobadosReprobados}
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarLayout>
  );
}
