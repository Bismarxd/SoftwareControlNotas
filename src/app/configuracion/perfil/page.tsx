"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "@/components/Sidebar/SidebarLayout";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAlert } from "@/components/ui/Alert";

const Perfil = () => {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [usuario, setUsuario] = useState();
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
    console.log({
      nuevoNombre: nombreUsuario,
      contrasenaActual,
      nuevaContrasena,
      confirmarContrasena,
    });
    const usuarioGuardado = localStorage.getItem("usuario");
    const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
    const id = usuario?.id;
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
        const usuarioGuardado = localStorage.getItem("usuario");
        const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
        if (usuario) {
          const usuarioActualizado = { ...usuario, nombreUsuario };
          localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
        }

        // Limpiar campos
        setContrasenaActual("");
        setNuevaContrasena("");
        setConfirmarContrasena("");

        // Recargar la página
        window.location.reload();
      }
    } catch (error: any) {
      showAlert(error.response?.data?.message || "Error del servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-xl mt-10">
        <h2 className="text-2xl font-bold text-gray-700 mb-6 text-center">
          Perfil de Usuario
        </h2>

        <div className="space-y-5">
          {/* Nombre de usuario */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Cambiar Nombre de usuario
            </label>
            <input
              type="text"
              value={nombreUsuario}
              onChange={(e) => setNombreUsuario(e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="Ingresa tu nombre de usuario"
            />
          </div>

          {/* Contraseña actual */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Contraseña actual
            </label>
            <input
              type="password"
              value={contrasenaActual}
              onChange={(e) => setContrasenaActual(e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {/* Nueva contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={nuevaContrasena}
              onChange={(e) => setNuevaContrasena(e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {/* Confirmar nueva contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              value={confirmarContrasena}
              onChange={(e) => setConfirmarContrasena(e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {/* Botón Guardar */}
          <button
            onClick={handleGuardar}
            disabled={loading}
            className="w-full bg-teal-600 text-white py-2 rounded-lg font-semibold hover:bg-teal-700 transition disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Perfil;
