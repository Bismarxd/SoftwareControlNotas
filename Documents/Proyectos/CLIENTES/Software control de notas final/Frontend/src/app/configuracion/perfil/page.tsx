"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "@/components/Sidebar/SidebarLayout";
import axios from "axios";
import { useAlert } from "@/components/ui/Alert";
import { User, Lock, Save, ShieldCheck } from "lucide-react";

const Perfil = () => {
  const { showAlert } = useAlert();
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsuario = async () => {
      const res = await axios.get("/api/usuarios");
      const data = res.data;
      if (data.status) {
        setNombreUsuario(data.usuarios[0].nombreUsuario);
      }
    };

    fetchUsuario();
  }, []);

  const handleGuardar = async () => {
    const usuarioGuardado = localStorage.getItem("usuario");
    const usuarioLocal = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
    const id = usuarioLocal?.id;
    
    if (!nombreUsuario) {
      showAlert("El nombre de usuario no puede estar vacío", "error");
      return;
    }

    if (nuevaContrasena && nuevaContrasena !== confirmarContrasena) {
      showAlert("Las contraseñas no coinciden", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.put("/api/usuarios", {
        id,
        nombreUsuario,
        contrasenaActual,
        nuevaContrasena,
      });

      const data = res.data;

      if (data.status) {
        showAlert(data.message, "success");

        // Actualizar localStorage
        if (usuarioLocal) {
          const usuarioActualizado = { ...usuarioLocal, nombreUsuario };
          localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
        }

        // Limpiar campos
        setContrasenaActual("");
        setNuevaContrasena("");
        setConfirmarContrasena("");

        // Recargar la página
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error: any) {
      showAlert(error.response?.data?.message || "Error del servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="p-8 space-y-8 min-h-screen bg-gray-50 dark:bg-gray-900 black:bg-black transition-colors duration-300 flex flex-col items-center">
        <div className="w-full max-w-2xl bg-white dark:bg-gray-900 black:bg-black rounded-3xl border border-gray-200 dark:border-gray-800 black:border-zinc-900 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-teal-600 dark:bg-teal-700 p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-3xl font-black tracking-tight mb-2">Configuración de Perfil</h1>
              <p className="text-teal-50/80 font-medium">Gestiona tu identidad y seguridad en la plataforma</p>
            </div>
            <div className="absolute right-[-20px] top-[-20px] opacity-10">
              <User size={160} />
            </div>
          </div>

          <div className="p-8 sm:p-10 space-y-10">
            {/* Sección de Identidad */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                <User size={20} />
                <h2 className="text-sm font-black uppercase tracking-widest">Identidad</h2>
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                  Nombre de Usuario
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-teal-500 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={nombreUsuario}
                    onChange={(e) => setNombreUsuario(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-200 dark:border-gray-700 rounded-2xl pl-11 pr-4 py-3.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all dark:text-gray-100 shadow-inner"
                    placeholder="Ingresa tu nombre de usuario"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-800" />

            {/* Sección de Seguridad */}
            <div className="space-y-8">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <ShieldCheck size={20} />
                <h2 className="text-sm font-black uppercase tracking-widest">Seguridad</h2>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                    Contraseña Actual
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-rose-500 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      value={contrasenaActual}
                      onChange={(e) => setContrasenaActual(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-200 dark:border-gray-700 rounded-2xl pl-11 pr-4 py-3.5 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all dark:text-gray-100 shadow-inner"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={nuevaContrasena}
                      onChange={(e) => setNuevaContrasena(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all dark:text-gray-100 shadow-inner"
                      placeholder="Nueva contraseña"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={confirmarContrasena}
                      onChange={(e) => setConfirmarContrasena(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all dark:text-gray-100 shadow-inner"
                      placeholder="Repite la contraseña"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Botón Accion */}
            <div className="pt-4">
              <button
                onClick={handleGuardar}
                disabled={loading}
                className="w-full bg-gray-900 dark:bg-teal-700 black:bg-white black:text-black text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-gray-200 dark:shadow-none disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Perfil;
