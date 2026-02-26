"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

import SidebarLayout from "@/components/Sidebar/SidebarLayout";
import { 
  PlusCircle, 
  Pencil, 
  Trash2, 
  Target, 
  Lightbulb, 
  BookOpen, 
  FileText,
  Search,
  MoreVertical,
  AlertCircle,
  Calendar,
  Loader2
} from "lucide-react";

import ModalObjetivos from "@/components/asignaturas/ModalObjetivos";
import ModalEstrategias from "@/components/asignaturas/ModalEstrategias";
import ModalRecursos from "@/components/asignaturas/ModalRecursos";
import ModalContenido from "@/components/asignaturas/ModalContenido";

import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useAlert } from "@/components/ui/Alert";
import Tooltip from "@/components/ui/Tooltip";
import { Objetivo, Estrategia, Recursos, Contenido as ContenidoType } from "@/types/semestre";

type Category = "objetivos" | "estrategias" | "recursos" | "contenido";

const ObjectivesPage = () => {
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [categoria, setCategoria] = useState<Category>("objetivos");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [objetivosEditar, setObjetivosEditar] = useState<Objetivo | null>(null);

  const [estrategias, setEstrategias] = useState<Estrategia[]>([]);
  const [estrategiasEditar, setEstrategiasEditar] = useState<Estrategia | null>(null);

  const [recursos, setRecursos] = useState<Recursos[]>([]);
  const [recursosEditar, setRecursosEditar] = useState<Recursos | null>(null);

  const [contenido, setContenido] = useState<ContenidoType[]>([]);
  const [contenidoEditar, setContenidoEditar] = useState<ContenidoType | null>(null);

  const [materiaId, setMateriaId] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("materiaSeleccionada");
    if (stored) {
      try {
        setMateriaId(JSON.parse(stored));
      } catch (e) {
        console.error("Error parsing materiaId", e);
      }
    }
  }, []);

  useEffect(() => {
    if (!materiaId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const endpoint = `/api/asignaturas/${categoria}?asignaturaId=${materiaId}`;
        const res = await axios.get(endpoint);
        if (res.data.status) {
          if (categoria === "objetivos") setObjetivos(res.data.objetivos);
          else if (categoria === "estrategias") setEstrategias(res.data.estrategias);
          else if (categoria === "recursos") setRecursos(res.data.recursos);
          else if (categoria === "contenido") setContenido(res.data.contenido);
        }
      } catch (error) {
        console.error(`Error loading ${categoria}:`, error);
        showAlert(`Error al cargar ${categoria}`, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoria, materiaId, showAlert]);

  const handleEdit = (id: number) => {
    if (categoria === "objetivos") setObjetivosEditar(objetivos.find((o) => o.id === id) || null);
    else if (categoria === "estrategias") setEstrategiasEditar(estrategias.find((e) => e.id === id) || null);
    else if (categoria === "recursos") setRecursosEditar(recursos.find((r) => r.id === id) || null);
    else if (categoria === "contenido") setContenidoEditar(contenido.find((c) => c.id === id) || null);

    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    const label = categoria.slice(0, -1); // Simple singularization
    showConfirm(`¿Está seguro que desea eliminar este ${label}?`, async () => {
      try {
        const res = await axios.delete(`/api/asignaturas/${categoria}/${id}`);
        if (res.data.status) {
          showAlert(`${label.charAt(0).toUpperCase() + label.slice(1)} eliminado correctamente`, "success");
          if (categoria === "objetivos") setObjetivos(prev => prev.filter(o => o.id !== id));
          if (categoria === "estrategias") setEstrategias(prev => prev.filter(e => e.id !== id));
          if (categoria === "recursos") setRecursos(prev => prev.filter(r => r.id !== id));
          if (categoria === "contenido") setContenido(prev => prev.filter(c => c.id !== id));
        } else showAlert(res.data.message || "Error al eliminar", "error");
      } catch (err) {
        console.error(err);
        showAlert("Error al eliminar", "error");
      }
    });
  };

  const getFilteredItems = () => {
    const items = categoria === "objetivos" ? objetivos : categoria === "estrategias" ? estrategias : categoria === "recursos" ? recursos : contenido;
    if (!searchTerm) return items;
    return (items as any[]).filter(item => 
      (item.tipo?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.titulo?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const filteredItems = getFilteredItems();

  const categoryConfig = {
    objetivos: { icon: Target, color: "blue", label: "Objetivos" },
    estrategias: { icon: Lightbulb, color: "amber", label: "Estrategias" },
    recursos: { icon: BookOpen, color: "emerald", label: "Recursos" },
    contenido: { icon: FileText, color: "teal", label: "Contenido" },
  };

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-12 transition-colors duration-300">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 dark:border-gray-800 pb-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
              <span className="w-1.5 h-8 bg-teal-600 rounded-full transition-colors" />
              Planificación Académica
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 ml-4">
              Gestiona los pilares fundamentales de tu asignatura.
            </p>
          </motion.div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
              <input 
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none w-full md:w-64 transition-all"
              />
            </div>
            <button
              onClick={() => {
                setObjetivosEditar(null);
                setEstrategiasEditar(null);
                setRecursosEditar(null);
                setContenidoEditar(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-lg shadow-teal-600/20 transition-all active:scale-95 font-bold whitespace-nowrap"
            >
              <PlusCircle className="w-5 h-5" />
              Nuevo Item
            </button>
          </div>
        </div>

        {/* Categories Tabs */}
        <div className="flex p-1 bg-gray-100 dark:bg-gray-800/50 rounded-2xl w-fit max-w-full overflow-x-auto no-scrollbar">
          {(Object.entries(categoryConfig) as [Category, typeof categoryConfig["objetivos"]][]).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setCategoria(key)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all relative ${
                categoria === key 
                  ? "text-teal-600 dark:text-teal-400" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {categoria === key && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-teal-100 dark:border-teal-900/30"
                />
              )}
              {React.createElement(config.icon, { 
                className: `w-4 h-4 relative z-10 ${categoria === key ? "text-teal-600" : ""}` 
              })}
              <span className="relative z-10 capitalize">{config.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-[40vh] text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest">Cargando {categoria}...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col justify-center items-center h-[40vh] bg-gray-50/50 dark:bg-gray-800/10 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600"
          >
            <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              {React.createElement(categoryConfig[categoria].icon, { className: "w-8 h-8 opacity-50" })}
            </div>
            <p className="font-bold">No se encontraron {categoryConfig[categoria].label.toLowerCase()}</p>
            <p className="text-sm opacity-70">Empieza agregando uno nuevo arriba.</p>
          </motion.div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item: any) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -4 }}
                  className="group relative bg-white dark:bg-[#1e1e1e] rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm hover:shadow-xl transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 bg-${categoryConfig[categoria].color}-50 dark:bg-${categoryConfig[categoria].color}-900/20 text-${categoryConfig[categoria].color}-600 dark:text-${categoryConfig[categoria].color}-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-${categoryConfig[categoria].color}-100 dark:border-${categoryConfig[categoria].color}-900/30`}>
                      {item.tipo || "General"}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip content="Editar">
                        <button
                          onClick={() => handleEdit(item.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Eliminar">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>

                  {item.titulo && (
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {item.titulo}
                    </h3>
                  )}

                  <div 
                    className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed line-clamp-4"
                    dangerouslySetInnerHTML={{ __html: item.descripcion }}
                  />

                  <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      ID: {item.id}
                    </span>
                    <button 
                      onClick={() => handleEdit(item.id)}
                      className="text-teal-600 dark:text-teal-400 text-xs font-bold flex items-center gap-1 hover:underline"
                    >
                      Ver más <MoreVertical className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Status Alert if no materiaId */}
        {!materiaId && !loading && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 font-bold mb-2">
              <AlertCircle className="w-5 h-5" />
              Atención
            </div>
            <p className="text-amber-700 dark:text-amber-300 text-sm">
              Debes seleccionar una asignatura en el Dashboard principal para gestionar sus contenidos.
            </p>
          </div>
        )}

        {/* Modals */}
        <AnimatePresence>
          {showModal && (
            <>
              {categoria === "objetivos" && (
                <ModalObjetivos
                  setShowModal={setShowModal}
                  setObjetivos={setObjetivos}
                  objetivosEditar={objetivosEditar}
                  setObjetivosEditar={setObjetivosEditar}
                />
              )}
              {categoria === "estrategias" && (
                <ModalEstrategias
                  setShowModal={setShowModal}
                  setEstrategias={setEstrategias}
                  estrategiasEditar={estrategiasEditar}
                  setEstrategiasEditar={setEstrategiasEditar}
                />
              )}
              {categoria === "recursos" && (
                <ModalRecursos
                  setShowModal={setShowModal}
                  setRecursos={setRecursos}
                  recursosEditar={recursosEditar}
                  setRecursosEditar={setRecursosEditar}
                />
              )}
              {categoria === "contenido" && (
                <ModalContenido
                  setShowModal={setShowModal}
                  setContenido={setContenido}
                  contenidoEditar={contenidoEditar}
                  setContenidoEditar={setContenidoEditar}
                />
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </SidebarLayout>
  );
};

export default ObjectivesPage;
