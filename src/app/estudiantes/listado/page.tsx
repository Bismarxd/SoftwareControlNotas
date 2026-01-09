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
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash, Plus, Upload, Eye } from "lucide-react";
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
  console.log(estudiantes);

  const agregarEstudiante = (nuevo: Estudiante) => {
    setEstudiantes((prev) => [...prev, nuevo]);
  };

  const handleEditar = (est: Estudiante) => {
    setEditarEstudiante(est);
    setShowModal(true);
  };

  const handleDelete = (est: Estudiante) => {
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
  };

  const handleVer = (est: Estudiante) => {
    router.push(`/estudiantes/listado/${est.id}`);
  };

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

      const materiaSeleccionada = localStorage.getItem("materiaSeleccionada");
      if (!materiaSeleccionada) return;
      const asignaturaId = JSON.parse(materiaSeleccionada);

      const nuevosEstudiantes: Estudiante[] = [];

      for (let i = 0; i < datos.length; i++) {
        const d = datos[i];
        if (!d.Nombre || !d.CI) continue; // validación mínima

        try {
          const res = await axios.post("/api/estudiantes/listado", {
            nombre: d.Nombre,
            ci: d.CI,
            registro: d.Registro || "",
            email: d.Email || "",
            celular: d.Celular || "",
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
      showAlert(
        `${nuevosEstudiantes.length} estudiantes importados correctamente`,
        "success"
      );
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
    []
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
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4 items-center">
          <h1 className="text-3xl font-bold text-gray-800">
            Listado de Estudiantes
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg shadow hover:bg-teal-700 transition"
            >
              <Plus size={16} /> Agregar Estudiante
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
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            >
              <Upload size={16} /> Importar Excel
            </button>
          </div>
        </div>

        <input
          type="text"
          placeholder="Buscar por nombre, CI o registro..."
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-64"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      className="px-4 py-2 text-left text-sm font-medium text-gray-600 uppercase tracking-wider"
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
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 text-gray-700 text-sm"
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
