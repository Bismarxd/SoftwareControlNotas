"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

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
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      {/* Header */}
      <header className="flex justify-center items-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Login
        </h1>
      </header>

      {/* Main */}
      <main className="flex-grow flex flex-col items-center px-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              S.C.N.
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Inicia sesión para continuar
            </p>
          </div>

          {/* Formulario */}
          <form className="space-y-6" onSubmit={loginUser}>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Nombre de Usuario"
                  value={nombreUsuario}
                  onChange={(e) => setNombreUsuario(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white h-12 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  placeholder="Contraseña"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white h-12 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Botón de login */}
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Ingresar
              </button>
            </div>

            {/* Mensaje de estado */}
            {mensaje && (
              <p
                className={`text-center mt-4 text-sm font-medium ${
                  mensaje.startsWith("✅") ? "text-green-600" : "text-red-600"
                }`}
              >
                {mensaje}
              </p>
            )}
          </form>
        </div>
      </main>

      <footer className="py-4">
        <div className="h-5"></div>
      </footer>
    </div>
  );
}
