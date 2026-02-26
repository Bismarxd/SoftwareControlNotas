"use client";

import { useState, ReactNode, useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

import {
  Home,
  BookOpen,
  Brain,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  GraduationCap,
  BookMarked,
  ClipboardList,
  UserCheck,
  BarChart2,
  Award,
  User,
  Layers,
} from "lucide-react";

import Tooltip from "@/components/ui/Tooltip";
import { useAlert } from "../ui/Alert";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface SidebarLayoutProps {
  children: ReactNode;
}

interface Usuario {
  nombreUsuario: string;
}

interface Semestre {
  id: number;
  nombre: string;
  seleccionado: boolean;
}

interface Materia {
  id: number;
  nombre: string;
}

const menuItems = [
  {
    label: "Inicio",
    icon: <Home className="w-5 h-5" />,
    path: "/inicio",
  },
  {
    label: "Asignaturas",
    icon: <BookOpen className="w-5 h-5" />,
    subItems: [
      { label: "Información General", path: "/asignaturas/info-general", icon: <BookMarked className="w-4 h-4" /> },
      { label: "Agregar Información", path: "/asignaturas/objetivos", icon: <ClipboardList className="w-4 h-4" /> },
      { label: "Competencias", path: "/asignaturas/competencias", icon: <Layers className="w-4 h-4" /> },
    ],
  },
  {
    label: "Evaluación",
    icon: <Brain className="w-5 h-5" />,
    subItems: [
      { label: "Actividades", path: "/evaluacion/registroActividades", icon: <ClipboardList className="w-4 h-4" /> },
      { label: "Asistencia", path: "/evaluacion/registroAsistencia", icon: <UserCheck className="w-4 h-4" /> },
      { label: "Parciales", path: "/evaluacion/calificacionesParciales", icon: <BarChart2 className="w-4 h-4" /> },
      { label: "Finales", path: "/evaluacion/calificacionesFinales", icon: <Award className="w-4 h-4" /> },
    ],
  },
  {
    label: "Estudiantes",
    icon: <Users className="w-5 h-5" />,
    subItems: [
      { label: "Listado", path: "/estudiantes/listado", icon: <GraduationCap className="w-4 h-4" /> },
    ],
  },
  {
    label: "Configuración",
    icon: <Settings className="w-5 h-5" />,
    subItems: [
      { label: "Perfil", path: "/configuracion/perfil", icon: <User className="w-4 h-4" /> },
      { label: "Semestres", path: "/configuracion/semestres", icon: <BookOpen className="w-4 h-4" /> },
    ],
  },
];

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { showAlert } = useAlert();

  const [isOpen, setIsOpen] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [semestreActivo, setSemestreActivo] = useState<Semestre | null>(null);
  const [materia, setMateria] = useState<Materia | null>(null);

  useEffect(() => {
    axios.get("/api/usuarios").then((res) => {
      if (res.data.status) setUsuarios(res.data.usuarios);
    });

    axios.get("/api/semestres").then((res) => {
      if (res.data.status && res.data.semestres) {
        const activo = res.data.semestres.find((s: Semestre) => s.seleccionado);
        if (activo) {
          setSemestreActivo(activo);
          localStorage.setItem("semestreSeleccionado", JSON.stringify(activo));
        }
      }
    });
  }, []);

  useEffect(() => {
    const semestreLS = localStorage.getItem("semestreSeleccionado");
    if (!semestreLS || semestreLS === "undefined") return;

    try {
      const semestre = JSON.parse(semestreLS);
      if (semestre && semestre.id) {
        axios.get(`/api/asignaturas/materiaSeleccionada/${semestre.id}`).then((res) => {
          if (res.data.status) {
            const selectedMateria = res.data.asignaturaSeleccionada;
            setMateria(selectedMateria);
            if (selectedMateria) {
              localStorage.setItem("materiaSeleccionada", JSON.stringify(selectedMateria.id));
              localStorage.setItem("materiaNombre", JSON.stringify(selectedMateria.nombre));
            }
          }
        });
      }
    } catch (error) {
      console.error("Error parsing semestreSeleccionado:", error);
      localStorage.removeItem("semestreSeleccionado");
    }
  }, []);

  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.subItems?.some((s) => pathname.startsWith(s.path))) {
        setOpenMenu(item.label);
      }
    });
  }, [pathname]);

  const cerrarSesion = async () => {
    const res = await axios.post("/api/logout");
    if (res.data.status) {
      showAlert("Sesión cerrada", "success");
      localStorage.clear();
      router.push("/");
    }
  };

  // Initials from username
  const username = usuarios[0]?.nombreUsuario ?? "";
  const initials = username
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-[#121212] relative overflow-hidden transition-colors duration-300">

      {/* BACKDROP for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="bg-white/90 dark:bg-[#1e1e1e]/90 backdrop-blur shadow-sm flex items-center justify-between px-4 sm:px-6 py-3 m-2 rounded-2xl relative border border-gray-200 dark:border-gray-800 transition-colors duration-300 z-30">

        {/* Mobile menu toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden flex items-center justify-center h-9 w-9 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo and title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 shrink-0">
            <Image src="/logo.png" alt="Logo" width={22} height={22} className="sm:w-6 sm:h-6" />
          </div>
          <div className="flex flex-col leading-tight overflow-hidden">
            <h1 className="font-bold text-sm sm:text-base text-teal-700 dark:text-teal-400 truncate">
              Control de Notas
            </h1>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 hidden sm:block tracking-wide">
              Gestión académica
            </span>
          </div>
        </div>

        {/* Semestre + materia pill — centered, desktop only */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 transition-colors">
          <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
            {semestreActivo?.nombre ?? "Sin semestre"}
          </span>
          {materia && (
            <>
              <span className="w-1 h-1 rounded-full bg-teal-300 dark:bg-teal-700" />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                {materia.nombre}
              </span>
            </>
          )}
        </div>

        {/* User + theme + logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {/* Avatar + name (desktop) */}
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-xs font-extrabold text-white">{initials || "U"}</span>
            </div>
            <div className="flex flex-col text-right leading-tight">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest">Docente</span>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[100px] lg:max-w-[140px]">
                {username}
              </span>
            </div>
          </div>

          <button
            onClick={cerrarSesion}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl
                 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30
                 hover:bg-rose-600 hover:text-white hover:border-rose-600 dark:hover:bg-rose-600 dark:hover:text-white
                 transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline text-sm font-semibold">Salir</span>
          </button>
        </div>
      </header>

      {/* SIDEBAR + CONTENT */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* SIDEBAR */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
            m-2 flex flex-col rounded-3xl transition-all duration-300 ease-in-out
            bg-gradient-to-b from-[#0f4c4c] via-[#0d3d3d] to-[#0a2e2e]
            text-white shadow-2xl shadow-teal-900/30
            ${isOpen ? "translate-x-0 w-64 p-4" : "-translate-x-full lg:translate-x-0 w-64 lg:w-[70px] p-3"}
          `}
        >
          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hidden lg:flex items-center justify-center
                 h-9 w-9 rounded-xl mb-5 self-end
                 bg-white/10 hover:bg-white/20
                 transition-all duration-200 cursor-pointer border border-white/10"
          >
            {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Mobile: logo + close */}
          <div className="lg:hidden flex flex-col items-center mb-6 pt-2">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 mb-3 shadow-lg">
              <Image src="/logo.png" alt="Logo" width={36} height={36} />
            </div>
            <h2 className="text-base font-bold text-white">Menú Principal</h2>
            <div className="mt-2 text-xs text-white/50 bg-white/10 px-3 py-1 rounded-full border border-white/10">
              {semestreActivo?.nombre ?? "Sin semestre"}
            </div>
          </div>

          {/* NAV MENU */}
          <nav className="flex flex-col gap-1 overflow-y-auto flex-1 pr-0.5">
            {menuItems.map((item) => {
              const isActive =
                item.path === pathname ||
                item.subItems?.some((s) => pathname.startsWith(s.path));
              const isItemOpen = openMenu === item.label;

              const content = (
                <div
                  onClick={() => {
                    if (item.subItems) {
                      setOpenMenu(isItemOpen ? null : item.label);
                    } else {
                      router.push(item.path!);
                      if (window.innerWidth < 1024) setIsOpen(false);
                    }
                  }}
                  className={`group relative flex items-center gap-3
                    rounded-xl px-3 py-2.5 cursor-pointer select-none
                    transition-all duration-200
                    ${isActive
                      ? "bg-white/15 shadow-md"
                      : "hover:bg-white/10"
                    }
                  `}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
                  )}

                  {/* Icon */}
                  <span className={`flex items-center justify-center shrink-0 transition-all duration-200
                    ${isActive ? "text-emerald-400" : "text-white/70 group-hover:text-white"}
                  `}>
                    {item.icon}
                  </span>

                  {/* Label */}
                  {isOpen && (
                    <div className="flex-1 flex items-center justify-between overflow-hidden">
                      <span className={`text-sm font-semibold tracking-wide whitespace-nowrap truncate
                        ${isActive ? "text-white" : "text-white/80 group-hover:text-white"}
                      `}>
                        {item.label}
                      </span>
                      {item.subItems && (
                        <ChevronDown className={`w-4 h-4 text-white/50 shrink-0 transition-transform duration-200 ${isItemOpen ? "rotate-180" : ""}`} />
                      )}
                    </div>
                  )}
                </div>
              );

              return (
                <div key={item.label}>
                  {!isOpen ? (
                    <div className="hidden lg:block">
                      <Tooltip content={item.label}>{content}</Tooltip>
                    </div>
                  ) : (
                    content
                  )}

                  {/* SUBMENU with animation */}
                  <AnimatePresence initial={false}>
                    {isOpen && isItemOpen && item.subItems && (
                      <motion.div
                        key="submenu"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 mt-1 mb-1 flex flex-col gap-0.5 border-l border-white/10 pl-4">
                          {item.subItems.map((sub) => {
                            const subActive = pathname === sub.path || pathname.startsWith(sub.path);

                            return (
                              <div
                                key={sub.path}
                                onClick={() => {
                                  router.push(sub.path);
                                  setOpenMenu(item.label);
                                  if (window.innerWidth < 1024) setIsOpen(false);
                                }}
                                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm cursor-pointer
                                  transition-all duration-150
                                  ${subActive
                                    ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/20"
                                    : "text-white/60 hover:bg-white/10 hover:text-white"
                                  }
                                `}
                              >
                                <span className={subActive ? "text-emerald-400" : "text-white/40"}>
                                  {sub.icon}
                                </span>
                                <span className="truncate">{sub.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Bottom user card (collapsed desktop shows avatar only) */}
          <div className={`mt-4 pt-4 border-t border-white/10 ${isOpen ? "" : "hidden lg:block"}`}>
            {isOpen ? (
              <div className="flex items-center gap-3 px-2 py-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shrink-0 shadow-md">
                  <span className="text-xs font-extrabold text-white">{initials || "U"}</span>
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Docente</p>
                  <p className="text-sm font-bold text-white truncate">{username}</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <Tooltip content={username}>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-md cursor-default">
                    <span className="text-xs font-extrabold text-white">{initials || "U"}</span>
                  </div>
                </Tooltip>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto bg-gray-50 dark:bg-[#121212] transition-colors duration-300 h-full w-full">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
