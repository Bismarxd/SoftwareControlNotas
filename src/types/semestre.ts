export interface Semestre {
  id: number;
  usuarioId: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  estado: "Activo" | "Finalizado";
  seleccionado: boolean;
}

export interface Asignaturas {
  id?: number;
  semestreId: number;
  nombre: string;
  sigla: string;
  nivel: string;
  prerequisito: string;
  area: string;
  hp: string | number;
  hc: string | number;
  haa: string | number;
  hip: string | number;
  he: string | number;
  creditos: string | number;
  justificacion: string;
  seleccionado: boolean;
  createdAt: Date;
  competencia: Competencia[];
  estudiante: Estudiante[];
}

export interface Objetivo {
  id: number;
  descripcion: string;
  tipo: string;
}

export interface Estrategia {
  id: number;
  descripcion: string;
  tipo: string;
}

export interface Recursos {
  id: number;
  descripcion: string;
  tipo: string;
}

export interface Competencia {
  id: number;
  descripcion: string;
  asignaturaId: number;
  tipo: string;
  porcentaje: number;
  createdAt: Date;
  criterioevaluacion: Criterio[];
}

export interface Criterio {
  id: number;
  descripcion: string;
  nombre: string;
  porcentaje: number;
  createdAt: Date;
  evidencia: Evidencia[];
}

export interface Estudiante {
  id: number;
  nombre: string;
  ci: string;
  email: string;
  registro: number;
  porcentajeAsistencia?: number;
  notas?: Record<number, number>;
  notaactividad: NotaActividad[];
  promedioparcial: PromedioParcial[];
  asistencias?: Asistencia[];
  celular?: number;
}
export interface PromedioParcial {
  id: number;
  estudianteId?: number;
  asignaturaId?: number;
  competenciaId?: number;
  criterioId?: number;
  evidenciaId?: number;
  promedio: number;
  notaSegundoTurno: number;
  competencia: Competencia;
  criterio: Criterio;
  evidencia: Evidencia;
}

export interface Clase {
  id: number;
  asignaturaId: number;
  fecha: string;
  asistencia: Asistencia;
}

export interface Asistencia {
  id: number;
  estudianteId?: number;
  claseId?: number;
  fecha: Date;
  presente: boolean;
}

export interface Evidencia {
  id: number;
  criterioId?: number;
  nombre?: string;
  tipo: string;
  actividad?: Actividad[];
}

export interface Actividad {
  id: number;
  evidenciaId?: number;
  nombre: string;
  fecha: string;
  puntajeMaximo?: number;
  notaActividad?: NotaActividad;
}

export interface NotaActividad {
  id: number;
  actividadId?: number;
  estudianteId: string;
  puntaje: string;
  observacion?: number;
  actividad?: {
    id: number;
    nombre: string;
    descripcion?: string;
  };
}
