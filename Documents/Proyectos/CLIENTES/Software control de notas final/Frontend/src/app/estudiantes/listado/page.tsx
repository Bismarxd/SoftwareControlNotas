"use client";

import SidebarLayout from "@/components/Sidebar/SidebarLayout";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash, Plus, Eye, Download, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import ModalEstudiante from "@/components/estudiantes/ModalEstudiante";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useAlert } from "@/components/ui/Alert";
import { Estudiante } from "@/types/semestre";
import axios from "axios";
import Tooltip from "@/components/ui/Tooltip";

export default function ListadoEstudiantes() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editarEstudiante, setEditarEstudiante] = useState<Estudiante | null>(
    null
  );
  const [busqueda, setBusqueda] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [loadingImport, setLoadingImport] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    const fetchEstudiantes = async () => {
      const materiaSeleccionada = localStorage.getItem("materiaSeleccionada");
      if (!materiaSeleccionada) return;
      const asignaturaId = JSON.parse(materiaSeleccionada);

      try {
        const res = await axios.get(
          `/api/estudiantes/listado?asignaturaId=${asignaturaId}`
        );
        if (res.data.status) {
          const frontend: Estudiante[] = res.data.estudiantes.map((e: any) => ({
            id: e.id,
            nombre: e.nombre,
            ci: e.ci,
            registro: e.registro,
            email: e.email ?? "-",
            celular: e.celular,
          }));
          setEstudiantes(frontend);
        }
      } catch (error) {
        console.error("Error al cargar estudiantes:", error);
        showAlert("Error al cargar estudiantes", "error");
      }
    };
    fetchEstudiantes();
  }, [showAlert]);

  const handleDownloadTemplate = () => {
    const headers = [["Nombre", "CI", "Registro", "Email", "Celular"]];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(headers);
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, "Plantilla_Estudiantes.xlsx");
  };

  const agregarEstudiante = (nuevo: Estudiante) => {
    setEstudiantes((prev) => [...prev, nuevo]);
  };

  const handleEditar = useCallback((est: Estudiante) => {
    setEditarEstudiante(est);
    setShowModal(true);
  }, []);

  const handleDelete = useCallback((est: Estudiante) => {
    showConfirm(`¿Está seguro de eliminar a "${est.nombre}"?`, async () => {
      try {
        const res = await axios.delete(`/api/estudiantes/listado/${est.id}`);
        if (res.data.status) {
          setEstudiantes((prev) => prev.filter((s) => s.id !== est.id));
          showAlert("Estudiante eliminado correctamente", "success");
        } else {
          showAlert(
            res.data.message || "Error al eliminar el estudiante",
            "error"
          );
        }
      } catch (err) {
        console.error(err);
        showAlert("Error al eliminar el estudiante", "error");
      }
    });
  }, [showAlert, showConfirm]);

  const handleVer = useCallback((est: Estudiante) => {
    router.push(`/estudiantes/listado/${est.id}`);
  }, [router]);

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const datos: any[] = XLSX.utils.sheet_to_json(ws);

      if (datos.length === 0) {
        showAlert("El archivo está vacío.", "error");
        return;
      }

      const materiaSeleccionada = localStorage.getItem("materiaSeleccionada");
      if (!materiaSeleccionada) {
        showAlert("Debe seleccionar una materia primero.", "error");
        return;
      }
      const asignaturaId = JSON.parse(materiaSeleccionada);

      setLoadingImport(true);
      setImportProgress({ current: 0, total: datos.length });
      
      const nuevosEstudiantes: Estudiante[] = [];

      for (let i = 0; i < datos.length; i++) {
        const d = datos[i];
        setImportProgress({ current: i + 1, total: datos.length });

        if (!d.Nombre || !d.CI) continue; // validación mínima

        try {
          const res = await axios.post("/api/estudiantes/listado", {
            nombre: d.Nombre,
            ci: String(d.CI),
            registro: d.Registro || "0",
            email: d.Email || "",
            celular: d.Celular || "0",
            asignaturaId,
          });
          if (res.data.status) {
            const nuevo: any = {
              id: res.data.estudiante.id,
              nombre: res.data.estudiante.nombre,
              ci: res.data.estudiante.ci,
              registro: res.data.estudiante.registro ?? 0,
              email: res.data.estudiante.email ?? "-",
              celular: res.data.estudiante.celular,
              notaactividad: [],
            };
            nuevosEstudiantes.push(nuevo);
          }
        } catch (error) {
          console.error(`Error importando ${d.Nombre}:`, error);
        }
      }

      setEstudiantes((prev) => [...prev, ...nuevosEstudiantes]);
      setLoadingImport(false);
      showAlert(
        `${nuevosEstudiantes.length} estudiantes importados correctamente`,
        "success"
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsBinaryString(file);
  };

  // =========================
  // Columnas tabla
  // =========================
  const columns = useMemo<ColumnDef<Estudiante>[]>(
    () => [
      { header: "Nombre", accessorKey: "nombre" },
      { header: "CI", accessorKey: "ci" },
      { header: "Registro", accessorKey: "registro" },
      { header: "Email", accessorKey: "email" },
      { header: "Celular", accessorKey: "celular" },
      {
        header: "Acciones",
        id: "acciones",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Tooltip content="Ver estudiante">
              <button
                onClick={() => handleVer(row.original)}
                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition hover:cursor-pointer"
              >
                <Eye size={16} />
              </button>
            </Tooltip>

            <Tooltip content="Editar estudiante">
              <button
                onClick={() => handleEditar(row.original)}
                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition hover:cursor-pointer"
              >
                <Pencil size={16} />
              </button>
            </Tooltip>

            <Tooltip content="Eliminar estudiante">
              <button
                onClick={() => handleDelete(row.original)}
                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition hover:cursor-pointer"
              >
                <Trash size={16} />
              </button>
            </Tooltip>
          </div>
        ),
      },
    ],
    [handleVer, handleEditar, handleDelete]
  );

  const estudiantesOrdenados = useMemo(() => {
    return [...estudiantes].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
    );
  }, [estudiantes]);

  // =========================
  // Filtrado por búsqueda
  // =========================
  const estudiantesFiltrados = useMemo(() => {
    return estudiantesOrdenados.filter(
      (e) =>
        e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        e.ci.toLowerCase().includes(busqueda.toLowerCase()) ||
        (e.registro?.toString() || "").includes(busqueda)
    );
  }, [estudiantesOrdenados, busqueda]);

  // =========================
  // Tabla React Table
  // =========================
  const table = useReactTable({
    data: estudiantesFiltrados,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <SidebarLayout>
      <div className="p-8 space-y-8 min-h-screen bg-gray-50 dark:bg-gray-900 black:bg-black transition-colors duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
            Listado de Estudiantes
          </h1>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 dark:bg-teal-700 text-white rounded-xl shadow-lg shadow-teal-500/20 hover:bg-teal-700 dark:hover:bg-teal-600 transition font-bold"
            >
              <Plus size={18} /> Agregar Estudiante
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 dark:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 dark:hover:bg-emerald-600 transition font-bold"
            >
              <Download size={18} /> Descargar Plantilla
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".xlsx, .xls"
              onChange={handleImportExcel}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 dark:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 dark:hover:bg-blue-600 transition font-bold"
            >
              <FileSpreadsheet size={18} /> Importar Excel
            </button>
          </div>
        </div>

        {/* Overlay de Carga/Importación */}
        {loadingImport && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border border-gray-100 dark:border-gray-700">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-teal-500/20 rounded-full" />
                <div 
                  className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin" 
                  style={{ animationDuration: '0.8s' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileSpreadsheet className="w-10 h-10 text-teal-600" />
                </div>
              </div>
              
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Importando Estudiantes</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
                Por favor, no cierre esta ventana. Procesando datos...
              </p>
              
              <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-teal-600">Progreso</span>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {importProgress.current} / {importProgress.total}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-teal-500 transition-all duration-300 rounded-full"
                    style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Barra de búsqueda Premium */}
        <div className="bg-white dark:bg-gray-800/50 black:bg-zinc-900/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 black:border-zinc-800 shadow-sm transition-all">
          <div className="relative group max-w-md">
            <input
              type="text"
              placeholder="Buscar por nombre, CI o registro..."
              className="w-full bg-gray-50 dark:bg-gray-800 black:bg-zinc-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all dark:text-gray-200 shadow-sm"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {/* Tabla Premium */}
        <div className="bg-white dark:bg-gray-900 black:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 black:border-zinc-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="bg-gray-50 dark:bg-gray-800/50 black:bg-zinc-900/50">
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm font-medium"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {estudiantesFiltrados.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-500 dark:text-gray-400 font-medium italic">
                No se encontraron estudiantes registrados.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de agregar/editar */}
      {showModal && (
        <ModalEstudiante
          showModal={showModal}
          setShowModal={setShowModal}
          agregarEstudiante={agregarEstudiante}
          setEstudiantes={setEstudiantes}
          editarEstudiante={editarEstudiante}
          setEditarEstudiante={setEditarEstudiante}
        />
      )}
    </SidebarLayout>
  );
}
