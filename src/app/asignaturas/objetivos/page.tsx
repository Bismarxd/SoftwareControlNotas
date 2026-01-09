"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

import SidebarLayout from "@/components/Sidebar/SidebarLayout";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import ModalObjetivos from "@/components/asignaturas/ModalObjetivos";
import ModalEstrategias from "@/components/asignaturas/ModalEstrategias";
import ModalRecursos from "@/components/asignaturas/ModalRecursos";

import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useAlert } from "@/components/ui/Alert";

import { Objetivo, Estrategia, Recursos } from "@/types/semestre";
import { Disclosure } from "@headlessui/react";
import Tooltip from "@/components/ui/Tooltip";
import ModalContenido from "@/components/asignaturas/ModalContenido";

export interface Contenido {
  id: number;
  asignaturaId: number;
  titulo: string;
  descripcion: string;
  tipo: string; // tema | unidad | modulo | etc
}

// Componente principal
const Objetivos = () => {
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [categoria, setCategoria] = useState<
    "objetivos" | "estrategias" | "recursos" | "contenido"
  >("objetivos");

  const [showModal, setShowModal] = useState(false);

  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [objetivosEditar, setObjetivosEditar] = useState<Objetivo | null>(null);

  const [estrategias, setEstrategias] = useState<Estrategia[]>([]);
  const [estrategiasEditar, setEstrategiasEditar] = useState<Estrategia | null>(
    null
  );

  const [recursos, setRecursos] = useState<Recursos[]>([]);
  const [recursosEditar, setRecursosEditar] = useState<Recursos | null>(null);

  const [contenido, setContenido] = useState<Contenido[]>([]);
  const [contenidoEditar, setContenidoEditar] = useState<Contenido | null>(
    null
  );

  const [materiaId, setMateriaId] = useState<number | null>(null);

  useEffect(() => {
    const materiaI = localStorage.getItem("materiaSeleccionada")
      ? JSON.parse(localStorage.getItem("materiaSeleccionada")!)
      : null;
    setMateriaId(materiaI);
  }, []);

  // Cargar datos según categoría

  useEffect(() => {
    if (!materiaId) return;

    const fetchData = async () => {
      try {
        if (categoria === "objetivos") {
          const res = await axios.get(
            `/api/asignaturas/objetivos?asignaturaId=${materiaId}`
          );
          if (res.data.status) setObjetivos(res.data.objetivos);
        } else if (categoria === "estrategias") {
          const res = await axios.get(
            `/api/asignaturas/estrategias?asignaturaId=${materiaId}`
          );
          if (res.data.status) setEstrategias(res.data.estrategias);
        } else if (categoria === "recursos") {
          const res = await axios.get(
            `/api/asignaturas/recursos?asignaturaId=${materiaId}`
          );
          if (res.data.status) setRecursos(res.data.recursos);
        } else if (categoria === "contenido") {
          const res = await axios.get(
            `/api/asignaturas/contenido?asignaturaId=${materiaId}`
          );
          if (res.data.status) setContenido(res.data.contenido);
        }
      } catch (error) {
        console.error(`Error al cargar ${categoria}:`, error);
      }
    };

    fetchData();
  }, [categoria, materiaId]);

  // Handlers

  const handleEdit = (id: number) => {
    if (categoria === "objetivos") {
      setObjetivosEditar(objetivos.find((o) => o.id === id) || null);
    } else if (categoria === "estrategias") {
      setEstrategiasEditar(estrategias.find((e) => e.id === id) || null);
    } else if (categoria === "recursos") {
      setRecursosEditar(recursos.find((r) => r.id === id) || null);
    } else if (categoria === "contenido") {
      setContenidoEditar(contenido.find((c) => c.id === id) || null);
    }

    setShowModal(true);
  };

  const handleAdd = () => setShowModal(true);

  const handleDelete = async (id: number) => {
    const mensajes: Record<string, string> = {
      objetivos: "objetivo",
      estrategias: "estrategia",
      recursos: "recurso",
    };
    showConfirm(
      `¿Está seguro que desea eliminar el ${mensajes[categoria]}?`,
      async () => {
        try {
          const res = await axios.delete(`/api/asignaturas/${categoria}/${id}`);
          if (res.data.status) {
            showAlert(
              `${mensajes[categoria]} eliminado correctamente`,
              "success"
            );
            if (categoria === "objetivos")
              setObjetivos((prev) => prev.filter((o) => o.id !== id));
            if (categoria === "estrategias")
              setEstrategias((prev) => prev.filter((e) => e.id !== id));
            if (categoria === "recursos")
              setRecursos((prev) => prev.filter((r) => r.id !== id));
            if (categoria === "contenido")
              setContenido((prev) => prev.filter((c) => c.id !== id));
          } else showAlert(res.data.message || "Error al eliminar", "error");
        } catch (err) {
          console.error(err);
          showAlert("Error al eliminar", "error");
        }
      }
    );
  };

  const items =
    categoria === "objetivos"
      ? objetivos
      : categoria === "estrategias"
      ? estrategias
      : categoria === "recursos"
      ? recursos
      : contenido;

  // Render

  return (
    <SidebarLayout>
      <div className="p-6 space-y-6">
        {/* Header y botones de categoría */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 capitalize">
            {categoria}
          </h1>
          <div className="flex flex-wrap gap-2">
            {["objetivos", "estrategias", "recursos", "contenido"].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategoria(cat as any);
                    setShowModal(false);
                  }}
                  className={`px-4 py-2 rounded-lg shadow-md text-white transition hover: cursor-pointer ${
                    categoria === cat
                      ? "bg-teal-600"
                      : "bg-gray-400 hover:bg-gray-500"
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              )
            )}
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 bg-blue-400 hover:bg-blue-900 text-white px-4 py-2 rounded-lg shadow-md transition hover: cursor-pointer"
            >
              <PlusCircle size={20} /> Añadir
            </button>
          </div>
        </div>

        {/* Lista de elementos con acordeón */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item: any) => (
            <div
              key={item.id}
              className="group relative bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-lg p-5 hover:shadow-2xl transition-all duration-300 border border-gray-200"
            >
              <span>{item.titulo || item.tipo || "Sin título"}</span>
              {/* Contenido */}
              <div
                className="mt-3 text-gray-700 text-sm leading-relaxed space-y-2"
                dangerouslySetInnerHTML={{ __html: item.descripcion }}
              />

              {/* Botones de editar y eliminar */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Tooltip content="Editar">
                  <button
                    className="p-2 rounded-full bg-teal-50 text-teal-600 hover:bg-teal-100 hover:scale-110 transition-transform hover:cursor-pointer"
                    onClick={() => handleEdit(item.id)}
                  >
                    <Pencil size={18} />
                  </button>
                </Tooltip>

                <Tooltip content="Eliminar">
                  <button
                    className="p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 hover:scale-110 transition-transform hover:cursor-pointer"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>

        {/* Modales según categoría */}
        {showModal && categoria === "objetivos" && (
          <ModalObjetivos
            setShowModal={setShowModal}
            setObjetivos={setObjetivos}
            objetivosEditar={objetivosEditar}
            setObjetivosEditar={setObjetivosEditar}
          />
        )}
        {showModal && categoria === "estrategias" && (
          <ModalEstrategias
            setShowModal={setShowModal}
            setEstrategias={setEstrategias}
            estrategiasEditar={estrategiasEditar}
            setEstrategiasEditar={setEstrategiasEditar}
          />
        )}
        {showModal && categoria === "recursos" && (
          <ModalRecursos
            setShowModal={setShowModal}
            setRecursos={setRecursos}
            recursosEditar={recursosEditar}
            setRecursosEditar={setRecursosEditar}
          />
        )}
        {showModal && categoria === "contenido" && (
          <ModalContenido
            setShowModal={setShowModal}
            setContenido={setContenido}
            contenidoEditar={contenidoEditar}
            setContenidoEditar={setContenidoEditar}
          />
        )}
      </div>
    </SidebarLayout>
  );
};

export default Objetivos;
