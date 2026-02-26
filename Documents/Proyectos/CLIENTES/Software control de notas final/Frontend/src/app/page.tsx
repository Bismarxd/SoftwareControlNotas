"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Home() {
  const router = useRouter();
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function loginUser(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(""); // limpiar mensaje anterior

    await axios
      .post("/api/login", { nombreUsuario, contrasena })
      .then((res) => {
        const data = res.data;
        if (data.status) {
          localStorage.setItem("usuario", JSON.stringify(data.usuario));
          setMensaje(`✅ ¡Éxito! Bienvenido ${data.usuario.nombreUsuario}`);
          // Enviar al inicio del dashboard
          setTimeout(() => {
            router.push("/inicio");
          }, 1000);
        } else {
          setMensaje(`❌ ${data.message || "Error al iniciar sesión"}`);
        }
      })
      .catch((error) => {
        console.error("Error en login:", error);

        if (error.response && error.response.data?.message) {
          setMensaje(`❌ ${error.response.data.message}`);
        } else {
          setMensaje("❌ Error de conexión con el servidor");
        }
      });
  }

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");

    if (usuario) {
      router.replace("/inicio");
    }
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#121212] font-sans transition-colors duration-300">
      {/* Header */}
      <header className="flex justify-between items-center py-6 px-8">
        <div className="w-10"></div> {/* Spacer for centering */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Sistema de Control de Notas
        </h1>
        <ThemeToggle />
      </header>

      {/* Main */}
      <main className="flex-grow flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md p-8 bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl space-y-8 transition-colors duration-300 border border-transparent dark:border-gray-800">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-teal-600 dark:text-teal-400">
              S.C.N.
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Bienvenido docente, inicie sesión
            </p>
          </div>

          {/* Formulario */}
          <form className="space-y-6" onSubmit={loginUser}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Usuario</label>
                <input
                  type="text"
                  required
                  placeholder="Ingrese su usuario"
                  value={nombreUsuario}
                  onChange={(e) => setNombreUsuario(e.target.value)}
                  className="block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white h-12 px-4 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  className="block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white h-12 px-4 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>
            </div>

            {/* Botón de login */}
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 rounded-xl shadow-lg text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all hover:scale-[1.02] active:scale-95 hover:cursor-pointer"
              >
                INGRESAR AL SISTEMA
              </button>
            </div>

            {/* Mensaje de estado */}
            {mensaje && (
              <div
                className={`text-center p-3 rounded-lg animate-fade-in ${
                  mensaje.startsWith("✅") 
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" 
                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                }`}
              >
                {mensaje}
              </div>
            )}
          </form>
        </div>
      </main>

      <footer className="py-6 text-center text-gray-500 dark:text-gray-400 text-xs">
        &copy; {new Date().getFullYear()} Sistema de Control de Notas Académicas
      </footer>
    </div>
  );
}
