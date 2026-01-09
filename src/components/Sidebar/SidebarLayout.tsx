"use client";

import { useState, ReactNode, useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";

import { CiLogout } from "react-icons/ci";
import { FiHome } from "react-icons/fi";
import { FaBookBookmark } from "react-icons/fa6";
import { FaBrain } from "react-icons/fa";
import { PiStudent } from "react-icons/pi";
import { GrConfigure } from "react-icons/gr";

import Tooltip from "@/components/ui/Tooltip";
import { useAlert } from "../ui/Alert";

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
    icon: <FiHome className="w-6 h-6" />,
    path: "/inicio",
  },
  {
    label: "Asignaturas",
    icon: <FaBookBookmark className="w-6 h-6" />,
    subItems: [
      { label: "Información General", path: "/asignaturas/info-general" },
      { label: "Agregar Información", path: "/asignaturas/objetivos" },
      { label: "Competencias", path: "/asignaturas/competencias" },
    ],
  },
  {
    label: "Evaluación",
    icon: <FaBrain className="w-6 h-6" />,
    subItems: [
      { label: "Actividades", path: "/evaluacion/registroActividades" },
      { label: "Asistencia", path: "/evaluacion/registroAsistencia" },
      { label: "Parciales", path: "/evaluacion/calificacionesParciales" },
      { label: "Finales", path: "/evaluacion/calificacionesFinales" },
    ],
  },
  {
    label: "Estudiantes",
    icon: <PiStudent className="w-6 h-6" />,
    subItems: [{ label: "Listado", path: "/estudiantes/listado" }],
  },
  {
    label: "Configuración",
    icon: <GrConfigure className="w-6 h-6" />,
    subItems: [
      { label: "Perfil", path: "/configuracion/perfil" },
      { label: "Semestres", path: "/configuracion/semestres" },
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
    // Usuario
    axios.get("/api/usuarios").then((res) => {
      if (res.data.status) setUsuarios(res.data.usuarios);
    });

    // Semestre
    axios.get("/api/semestres").then((res) => {
      if (res.data.status) {
        const activo = res.data.semestres.find((s: Semestre) => s.seleccionado);
        setSemestreActivo(activo);
        localStorage.setItem("semestreSeleccionado", JSON.stringify(activo));
      }
    });
  }, []);

  // Materia seleccionada
  useEffect(() => {
    const semestreLS = localStorage.getItem("semestreSeleccionado");
    if (!semestreLS) return;

    const semestre = JSON.parse(semestreLS);
    axios
      .get(`/api/asignaturas/materiaSeleccionada/${semestre.id}`)
      .then((res) => {
        if (res.data.status) {
          setMateria(res.data.asignaturaSeleccionada);
        }
      });
  }, []);

  // Abrir menú según ruta
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

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* HEADER */}
      <header className="bg-white/90 backdrop-blur shadow-sm flex items-center justify-between px-6 py-3 m-2 rounded-2xl relative border border-gray-200">
        {/* Logo + título */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-full bg-teal-100 border border-teal-300">
            <Image src="/logo.png" alt="Logo" width={28} height={28} />
          </div>

          <div className="flex flex-col leading-tight">
            <h1 className="font-semibold text-teal-700 text-lg">
              Sistema Control de Notas
            </h1>
            <span className="text-xs text-gray-500">Gestión académica</span>
          </div>
        </div>

        {/* Semestre + materia */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1 rounded-full bg-teal-50 border border-teal-200">
          <span className="text-sm font-medium text-teal-700">
            Semestre {semestreActivo?.nombre}
          </span>

          {materia && (
            <>
              <span className="text-gray-400">•</span>
              <span className="text-sm font-semibold text-gray-700">
                {materia.nombre}
              </span>
            </>
          )}
        </div>

        {/* Usuario + logout */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-right leading-tight">
            <span className="text-xs text-gray-500">Docente</span>
            <span className="text-sm font-medium text-gray-700">
              {usuarios[0]?.nombreUsuario}
            </span>
          </div>

          <button
            onClick={cerrarSesion}
            className="flex items-center gap-2 px-3 py-2 rounded-xl
                 bg-red-50 text-red-600 border border-red-200
                 hover:bg-red-600 hover:text-white hover:border-red-600
                 transition-all duration-200 hover: cursor-pointer"
          >
            <CiLogout className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-medium">Salir</span>
          </button>
        </div>
      </header>

      {/* SIDEBAR + CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside
          className={`m-2 flex flex-col rounded-3xl transition-all duration-300 ease-in-out
      bg-gradient-to-b from-teal-800 via-teal-900 to-teal-950
      text-white shadow-2xl
      ${isOpen ? "w-64 p-4" : "w-20 p-3"}
    `}
        >
          {/* TOGGLE */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="mb-6 flex items-center justify-center
                 h-10 w-10 rounded-xl
                 bg-teal-700 hover:bg-teal-600
                 transition-all duration-200
                 hover:scale-105 active:scale-95 hover:cursor-pointer"
          >
            <span className="text-lg">☰</span>
          </button>

          {/* MENU */}
          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const isActive =
                item.path === pathname ||
                item.subItems?.some((s) => pathname.startsWith(s.path));

              const content = (
                <div
                  onClick={() => {
                    if (item.subItems) {
                      setOpenMenu(openMenu === item.label ? null : item.label);
                    } else {
                      router.push(item.path!);
                    }
                  }}
                  className={`group relative flex items-center gap-3
              rounded-xl px-3 py-2.5 cursor-pointer
              transition-all duration-200
              ${isActive ? "bg-teal-700 shadow-md" : "hover:bg-teal-700/60"}
            `}
                >
                  {/* Indicador activo */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-emerald-400" />
                  )}

                  {/* Icono */}
                  <span
                    className={`flex items-center justify-center
                transition-transform duration-200
                ${
                  isActive
                    ? "scale-110 text-white"
                    : "text-white/80 group-hover:scale-110"
                }
              `}
                  >
                    {item.icon}
                  </span>

                  {/* Texto */}
                  {isOpen && (
                    <span className="text-sm font-medium tracking-wide whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </div>
              );

              return (
                <div key={item.label}>
                  {/* Tooltip cuando está cerrado */}
                  {!isOpen ? (
                    <Tooltip content={item.label}>{content}</Tooltip>
                  ) : (
                    content
                  )}

                  {/* SUBMENÚ */}
                  {isOpen && openMenu === item.label && item.subItems && (
                    <div
                      className="ml-10 mt-2 flex flex-col gap-1
                              border-l border-teal-600 pl-4"
                    >
                      {item.subItems.map((sub) => {
                        const subActive = pathname === sub.path;

                        return (
                          <div
                            key={sub.path}
                            onClick={() => {
                              router.push(sub.path);
                              setOpenMenu(item.label);
                            }}
                            className={`rounded-lg px-3 py-2 text-sm cursor-pointer
                        transition-all duration-200
                        ${
                          subActive
                            ? "bg-emerald-500 text-white shadow"
                            : "text-white/80 hover:bg-teal-700/60 hover:text-white"
                        }
                      `}
                          >
                            {sub.label}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* CONTENT */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
