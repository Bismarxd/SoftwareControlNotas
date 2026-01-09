"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import SidebarLayout from "@/components/Sidebar/SidebarLayout";
import { PencilIcon, TrashIcon, BookOpenIcon, PlusCircle } from "lucide-react";
import ModalAsignatura from "@/components/configuracion/ModalAsignatura";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { Asignaturas } from "@/types/semestre";
import { Semestre } from "@/types/semestre";
import { useAlert } from "@/components/ui/Alert";

export default function DetalleSemestre() {
  const router = useRouter();
  const { id } = useParams();
  const { showConfirm } = useConfirm();
  const { showAlert } = useAlert();

  const [semestre, setSemestre] = useState<Semestre>();
  const [asignaturas, setAsignaturas] = useState<Asignaturas[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [asignaturaEditar, setAsignaturaEditar] = useState<Asignaturas | null>(
    null
  );

  // Cargar datos del semestre
  useEffect(() => {
    if (id) {
      axios
        .get(`/api/semestres/${id}`)
        .then((res) => setSemestre(res.data.semestre || res.data))
        .catch((err) => console.error("Error al cargar semestre:", err));
    }
  }, [id]);

  // Cargar asignaturas del semestre
  useEffect(() => {
    if (!id) return;
    const fetchMaterias = async () => {
      try {
        await axios.get(`/api/asignaturas/${id}`).then((res) => {
          const data = res.data;
          if (data.status) {
            setAsignaturas(data.asignaturas);
          } else {
            console.log(data.message, data.error);
          }
        });
      } catch (error) {
        console.error("Error al cargar asignaturas:", error);
      }
    };
    fetchMaterias();
  }, [id]);

  //Espera hasta que cargen los datos del semestre
  if (!semestre) {
    return (
      <SidebarLayout>
        <div className="flex justify-center items-center h-full">
          <p className="text-gray-600">Cargando datos del semestre...</p>
        </div>
      </SidebarLayout>
    );
  }

  // Edita el semestre

  // Para editar la asignatura
  const handleEdit = (id: number) => {
    const asignatura = asignaturas.find((s) => s.id === id);
    if (!asignatura) return;

    setAsignaturaEditar(asignatura);
    setShowModal(true);
  };

  //Borrar la asignatura
  const handleDeleteAsignatura = async (id: number) => {
    showConfirm("¿Esta Seguro que Desea Eliminar la asignatura?", async () => {
      try {
        await axios.delete(`/api/asignaturas/${id}`).then((res) => {
          const data = res.data;
          if (data) {
            showAlert("Eliminado correctamente", "success");
            setAsignaturas((prev) => prev.filter((s) => s.id !== id));
          } else {
            showAlert(data.error);
          }
        });
      } catch (err) {
        console.error(err);
      }
    });
  };

  // Borrar el semestre
  const handleDeleteSemestre = async () => {
    showConfirm("¿Esta Seguro que Desea Eliminar el Semestre?", async () => {
      try {
        await axios.delete(`/api/semestres/${id}`).then((res) => {
          const data = res.data;
          if (data) {
            showAlert("Eliminado correctamente", "success");
          } else {
            showAlert(data.error);
          }
        });
      } catch (err) {
        console.error(err);
      }
    });
    // if (confirm("¿Seguro que deseas eliminar este semestre?")) {
    //   setSemestres((prev) => prev.filter((s) => s.id !== id));
    // }
  };

  return (
    <SidebarLayout>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold text-teal-700">{semestre.nombre}</h1>
        {/* Datos del semestre */}
        <div className="bg-white shadow-md rounded-lg p-4 border-l-4 border-teal-600">
          <p>
            <strong>Inicio:</strong>{" "}
            {new Date(semestre.fechaInicio).toLocaleDateString()}
          </p>
          <p>
            <strong>Fin:</strong>{" "}
            {new Date(semestre.fechaFin).toLocaleDateString()}
          </p>
          <p>
            <strong>Estado:</strong> {semestre.estado ? "Activo" : "Finalizado"}
          </p>
        </div>

        {/* Para agregar nueva asignatura */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => {
              setShowModal(true), setAsignaturaEditar(null);
            }}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg shadow-md transition"
          >
            <PlusCircle size={20} />
            Agregar Asignatura
          </button>
        </div>

        {/* Listado de las asignaturas */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Asignaturas
          </h2>

          {asignaturas.length === 0 ? (
            <p className="text-gray-500 italic">
              No hay asignaturas registradas.
            </p>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {asignaturas.map((asignatura) => (
                <div
                  key={asignatura.id}
                  className="bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpenIcon className="text-teal-600" size={22} />
                    <h3 className="text-lg font-semibold text-gray-800">
                      {asignatura.nombre}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>Sigla:</strong> {asignatura.sigla}
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(asignatura.id!)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition hover:cursor-pointer"
                    >
                      <PencilIcon size={16} /> Editar
                    </button>
                    <button
                      onClick={() => handleDeleteAsignatura(asignatura.id!)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-800 transition hover:cursor-pointer"
                    >
                      <TrashIcon size={16} /> Eliminar
                    </button>
                    {/* <button className="flex items-center gap-1 text-green-600 hover:text-green-800 transition">
                      <Eye size={16} /> Ver
                    </button> */}
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={handleDeleteSemestre}
            className="p-2 bg-red-400 w-[40%] mt-4 rounded-2xl text-white hover:cursor-pointer hover:bg-red-700"
          >
            Eliminar Semestre
          </button>
        </div>

        {showModal && (
          <ModalAsignatura
            setShowModal={setShowModal}
            setAsignaturas={setAsignaturas}
            asignaturaEditar={asignaturaEditar}
          />
        )}
      </div>
    </SidebarLayout>
  );
}
