"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import SidebarLayout from "@/components/Sidebar/SidebarLayout";
import { useAlert } from "@/components/ui/Alert";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useTheme } from "@/context/ThemeContext";
import {
  Competencia,
  Estudiante,
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

import { Doughnut } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  PieChart,
  User,
  BookOpen,
  Bookmark,
  Zap,
  Quote,
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

interface Semestre {
  id: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
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
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [semestre, setSemestre] = useState<Semestre | null>(null);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [materia, setMateria] = useState<Materia | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMaterias, setShowMaterias] = useState(false);
  const [user, setUser] = useState<{ nombreUsuario: string } | null>(null);

  const quotes = useMemo(() => [
    { text: "La inteligencia es lo que usas cuando no sabes qué hacer.", author: "Jean Piaget" },
    { text: "Lo que un niño puede hacer hoy con ayuda, será capaz de hacerlo por sí mismo mañana.", author: "Lev Vygotsky" },
    { text: "La única persona educada es la que ha aprendido a aprender y cambiar.", author: "Carl Rogers" },
    { text: "El gran descubrimiento de mi generación es que los seres humanos pueden cambiar sus vidas cambiando sus actitudes mentales.", author: "William James" }
  ], []);

  const [randomQuote, setRandomQuote] = useState<{ text: string; author: string } | null>(null);

  useEffect(() => {
    setRandomQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, [quotes]);

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

    if (usuario) {
      try {
        setUser(JSON.parse(usuario));
      } catch {
        localStorage.removeItem("usuario");
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

  const chartCompetenciasTorta = useMemo(() => {
    if (!materia?.competencia) return { labels: [], datasets: [] };

    const totalCriterios = materia.competencia.reduce(
      (acc: number, c: any) => acc + (c.criterioevaluacion?.length ?? 0),
      0
    );

    if (totalCriterios === 0) return { labels: [], datasets: [] };

    const labels = materia.competencia.map((c: any) => c.tipo);
    const dataLabels = materia.competencia.map((c: any) => {
      const cantidad = c.criterioevaluacion?.length ?? 0;
      return Number(((cantidad / totalCriterios) * 100).toFixed(2));
    });

    return {
      labels,
      datasets: [
        {
          label: "% de Competencias",
          data: dataLabels,
          backgroundColor: [
            "#14b8a6",
            "#3b82f6",
            "#f59e0b",
            "#ef4444",
            "#8b5cf6",
            "#0ea5e9",
          ],
          borderColor: isDark ? "#1e1e1e" : "#ffffff",
          borderWidth: 2,
          hoverOffset: 15,
        },
      ],
    };
  }, [materia, isDark]);

  const chartAprobadosReprobados = useMemo(() => {
    if (!materia?.estudiante) return { labels: [], datasets: [] };

    let aprobados = 0;
    let reprobados = 0;

    materia.estudiante.forEach((est: any) => {
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
          backgroundColor: ["#10b981", "#f43f5e"],
          borderColor: isDark ? "#1e1e1e" : "#ffffff",
          borderWidth: 2,
          hoverOffset: 15,
        },
      ],
    };
  }, [materia, isDark]);

  const optionsCompetenciasTorta = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: "75%",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
          color: isDark ? "#94a3b8" : "#475569",
          font: { size: 12, weight: "600" as const },
        },
      },
      tooltip: {
        backgroundColor: isDark ? "#1e293b" : "#ffffff",
        titleColor: isDark ? "#f8fafc" : "#1e293b",
        bodyColor: isDark ? "#cbd5e1" : "#475569",
        borderColor: isDark ? "#334155" : "#e2e8f0",
        borderWidth: 1,
        padding: 12,
      },
      datalabels: {
        color: "#fff",
        display: (context: any) => context.dataset.data[context.dataIndex] > 5,
        font: { weight: "bold" as const, size: 11 },
        formatter: (value: number) => `${value}%`,
      },
    },
  }), [isDark]);

  const optionsAprobadosReprobados = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: "75%",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
          color: isDark ? "#94a3b8" : "#475569",
          font: { size: 12, weight: "600" as const },
        },
      },
      tooltip: {
        backgroundColor: isDark ? "#1e293b" : "#ffffff",
        titleColor: isDark ? "#f8fafc" : "#1e293b",
        bodyColor: isDark ? "#cbd5e1" : "#475569",
        borderColor: isDark ? "#334155" : "#e2e8f0",
        borderWidth: 1,
        padding: 12,
      },
      datalabels: {
        color: "#fff",
        font: { weight: "bold" as const, size: 11 },
        formatter: (value: number, context: any) => {
          const total = context.chart.data.datasets[0].data.reduce(
            (acc: number, val: number) => acc + val,
            0
          );
          const porcentaje = total ? ((value / total) * 100).toFixed(1) : 0;
          return `${porcentaje}%`;
        },
      },
    },
  }), [isDark]);

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-12 transition-colors duration-300">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Panel de Control
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {materia ? `Gestionando: ${materia.nombre}` : "Bienvenido a su gestión académica."}
            </p>
          </motion.div>
          
          <div className="flex items-center gap-3">
            {loading && (
              <span className="flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-3 py-1.5 rounded-full animate-pulse">
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                Actualizando...
              </span>
            )}
            <button
              onClick={() => setShowMaterias(!showMaterias)}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:border-teal-500 dark:hover:border-teal-500 transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <BookOpen className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-bold">
                {materia ? "Cambiar Asignatura" : "Ver Asignaturas"}
              </span>
              {showMaterias ? (
                <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-teal-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-teal-500" />
              )}
            </button>
          </div>
        </div>

        {/* Subject Selection Grid */}
        <AnimatePresence>
          {showMaterias && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-2">
                {materias.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSeleccionar(m.id, m.nombre)}
                    className={`relative group p-5 rounded-2xl border transition-all duration-300 text-left hover:cursor-pointer
                      ${m.seleccionado
                        ? "bg-teal-50 dark:bg-teal-900/10 border-teal-500 ring-1 ring-teal-500"
                        : "bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-gray-800 hover:border-teal-500 dark:hover:border-teal-400 hover:shadow-lg"
                      }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2.5 rounded-xl transition-colors ${
                        m.seleccionado ? "bg-teal-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/30 group-hover:text-teal-600"
                      }`}>
                        <Bookmark className="w-5 h-5" />
                      </div>
                      {m.seleccionado && (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-white dark:bg-teal-900/20 px-2 py-1 rounded-full border border-teal-100 dark:border-teal-900/30">
                          <div className="w-1 h-1 bg-teal-500 rounded-full animate-pulse" />
                          Activa
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
                      {m.nombre}
                    </h3>
                    <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-1">
                      {m.sigla}
                    </p>
                    
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {m.estudiante?.length ?? 0} estudiantes
                      </span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-1 ${
                        m.seleccionado ? "text-teal-600" : "text-gray-300 dark:text-gray-600 group-hover:text-teal-500"
                      }`}>
                        →
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Welcome & Quick Access Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Welcome Widget */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2 bg-gradient-to-br from-teal-600 to-teal-800 rounded-[2.5rem] p-8 shadow-xl shadow-teal-900/20 text-white relative overflow-hidden"
          >
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                ¡Hola, {user?.nombreUsuario || "Docente"}! 👋
              </h2>
              <p className="text-teal-50/80 text-sm max-w-md font-medium leading-relaxed mb-6">
                Le damos la bienvenida a su espacio de gestión académica. Aquí tiene un resumen de su progreso actual.
              </p>
              
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 inline-block max-w-lg">
                <Quote className="w-4 h-4 text-teal-200 mb-2 opacity-100" />
                {randomQuote && (
                  <>
                    <p className="text-xs italic font-medium text-teal-50">
                      &quot;{randomQuote.text}&quot;
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest mt-2 text-teal-300">
                      — {randomQuote.author}
                    </p>
                  </>
                )}
              </div>
            </div>
            
            {/* Decorative circles */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-teal-400/10 rounded-full blur-2xl" />
          </motion.div>

          {/* Quick Access */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-8 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                <Zap className="w-5 h-5 fill-amber-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Accesos Rápidos</h3>
            </div>
            
            <div className="space-y-3">
  {[
    { 
      label: "Registrar Actividades", 
      icon: CheckCircle2, 
      path: "/evaluacion/registroActividades", 
      color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20" 
    },
    { 
      label: "Pasar Asistencia", 
      icon: User, 
      path: "/evaluacion/registroAsistencia", 
      color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" 
    },
    { 
      label: "Gestionar Materias", 
      icon: BookOpen, 
      path: "/configuracion/semestres", 
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
      dynamic: true
    },
  ].map((link, i) => (
    <button
      key={i}
      onClick={() => {
        if (link.dynamic) {
          const semestre = localStorage.getItem("semestreSeleccionado");

          if (semestre) {
            const parsed = JSON.parse(semestre);
            router.push(`/configuracion/semestres/${parsed.id}`);
          } else {
            // fallback si no hay semestre
            router.push("/configuracion/semestres");
          }
        } else {
          router.push(link.path);
        }
      }}
      className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${link.color}`}>
          <link.icon className="w-4 h-4" />
        </div>
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
          {link.label}
        </span>
      </div>
      <span className="text-gray-300 group-hover:translate-x-1 transition-transform">→</span>
    </button>
  ))}
</div>
          </motion.div>
        </div>

        {/* Semester Progress Bar */}
        {semestre && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Progreso del Semestre</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{semestre.nombre}</p>
                </div>
              </div>
              
              {(() => {
                const inicio = new Date(semestre.fechaInicio);
                const fin = new Date(semestre.fechaFin);
                const hoy = new Date();
                
                const total = fin.getTime() - inicio.getTime();
                const transcurrido = hoy.getTime() - inicio.getTime();
                const porcentaje = Math.min(100, Math.max(0, (transcurrido / total) * 100));
                
                const diasRestantes = Math.max(0, Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)));

                return (
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{porcentaje.toFixed(0)}% Completado</p>
                      <p className="text-[10px] text-gray-500 font-bold">{diasRestantes} días restantes</p>
                    </div>
                    <div className="w-32 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${porcentaje}%` }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-teal-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-50 dark:border-gray-800/50">
              <div className="text-center md:text-left">
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-tighter">Inicio</p>
                <p className="text-xs font-bold text-gray-600 dark:text-gray-300">{new Date(semestre.fechaInicio).toLocaleDateString()}</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-tighter">Fin Previsto</p>
                <p className="text-xs font-bold text-gray-600 dark:text-gray-300">{new Date(semestre.fechaFin).toLocaleDateString()}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Highlight Stats Section */}
        {materia ? (
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[
                { label: "Estudiantes", value: stats.estudiantes, icon: User, color: "from-blue-500 to-indigo-600 shadow-blue-500/20" },
                { label: "Competencias", value: stats.competencias, icon: Brain, color: "from-teal-500 to-emerald-600 shadow-teal-500/20" },
                { label: "Actividades", value: stats.actividades, icon: CheckCircle2, color: "from-purple-500 to-pink-600 shadow-purple-500/20" },
              ].map((stat, i) => (
                <div key={i} className="group relative overflow-hidden rounded-3xl bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-gray-800 p-1 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">
                        {stat.label}
                      </p>
                      <p className="text-4xl font-extrabold text-gray-900 dark:text-white leading-none">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                      <stat.icon className="w-7 h-7" />
                    </div>
                  </div>
                  <div className={`h-1.5 bg-gradient-to-r ${stat.color} rounded-full absolute bottom-0 left-4 right-4 opacity-10 group-hover:opacity-100 transition-opacity`} />
                </div>
              ))}
            </motion.div>
          </div>
        ) : (
          <div className="bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-900/30 rounded-3xl p-12 text-center max-w-2xl mx-auto border-dashed">
            <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-teal-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Seleccione una asignatura</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Debe seleccionar una materia para visualizar las estadísticas y el rendimiento académico.</p>
            <button 
              onClick={() => setShowMaterias(true)}
              className="px-8 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-teal-600/20 transition-all active:scale-95"
            >
              Ver Todas las Asignaturas
            </button>
          </div>
        )}

        {/* Charts Grid */}
        {materia && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Competencias Chart */}
            {chartCompetenciasTorta.labels.length > 0 && (
              <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm transition-colors hover:shadow-md">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600">
                      <PieChart className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Competencias</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-none mt-1">Distribución académica</p>
                    </div>
                  </div>
                </div>
                <div className="h-[320px] relative">
                  <Doughnut data={chartCompetenciasTorta as any} options={optionsCompetenciasTorta as any} />
                </div>
              </div>
            )}

            {/* Performance Chart */}
            {(materia.estudiante?.length ?? 0) > 0 && (
              <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm transition-colors hover:shadow-md">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Rendimiento</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-none mt-1">Aprobados vs Reprobados</p>
                    </div>
                  </div>
                </div>
                <div className="h-[320px] relative">
                  <Doughnut data={chartAprobadosReprobados as any} options={optionsAprobadosReprobados as any} />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </SidebarLayout>
  );
}
