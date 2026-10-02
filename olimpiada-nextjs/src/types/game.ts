export type GradoNombre =
  "Primero" | "Segundo" | "Tercero" | "Cuarto" | "Quinto";

export interface ParametrosEvento {
  nombre_institucion: string;
  nombre_evento: string;
  subtitulo_evento: string;
  texto_bienvenida: string;
  texto_unirse: string;
  texto_join_ayuda: string;
  texto_panel_docente: string;
  texto_unirme_estudiante: string;
  texto_pin_label: string;
  texto_ronda_completada: string;
  retos_habilitados?: string;
  modo_quiz?: string;
  preguntas_por_sesion?: string;
  vidas_habilitadas?: string;
  vidas_por_sesion?: string;
  sonido_habilitado?: string;
  mostrar_duelos?: string;
  mostrar_enfrentamiento?: string;
  grado_1?: string;
  grado_2?: string;
  grado_3?: string;
  grado_4?: string;
  grado_5?: string;
  clave_admin?: string;
  [clave: string]: string | undefined;
}

export type EstadoSesion =
  | "borrador"
  | "lobby"
  | "pregunta"
  | "resultado"
  | "reto"
  | "reto_podium"
  | "podium"
  | "final";

export type TipoPregunta = "opcion-multiple" | "abierta";
export type SesionNumero = "1" | "2";
export type TipoReto = "individual" | "grupal";

export interface Grado {
  id: string;
  nombre: GradoNombre;
  orden: number;
  puntos_sesion1: Record<string, number>;
  puntos_sesion2: Record<string, number>;
  creado_en: string;
  actualizado_en: string;
}

export interface Colegio {
  id: string;
  nombre: string;
  codigo: string;
  creado_en: string;
}

export interface Alumno {
  id: string;
  colegio_id: string;
  grado_id: string;
  nombre: string;
  creado_en: string;
}

export interface TablaColegio {
  puesto: number;
  colegio_id: string;
  nombre: string;
  puntos_total: number;
  es_colegio: boolean;
}

export interface SesionJuego {
  id: string;
  pin: string;
  grado_id: string;
  tipo: "oficial" | "prueba";
  colegio_id: string | null;
  alumno_a_id: string | null;
  alumno_b_id: string | null;
  estado: EstadoSesion;
  pregunta_activa_id: string | null;
  reto_activo_id: string | null;
  cronometro_inicio: string | null;
  cronometro_segundos: number;
  ronda_ganador_num: number | null;
  creado_en: string;
  actualizado_en: string;
}

export interface InfoRondas {
  ronda_size: number;
  asignadas: number;
  disponibles: number;
  banco: number;
  ronda_actual: number;
  total_rondas: number;
  ronda_ganador_num: number | null;
  agregadas?: number;
}

export interface GanadorRondaEntry {
  puesto: number;
  nombre: string;
  aciertos: number;
  puntos: number;
}

export interface GanadorRonda {
  ronda: number;
  total_preguntas: number;
  ranking: GanadorRondaEntry[];
}

export interface Pregunta {
  id: string;
  grado_id: string;
  sesion: SesionNumero;
  tipo: TipoPregunta;
  enunciado: string;
  opciones: string[] | null;
  respuesta_correcta: string | null;
  tiempo_limite: number;
  puntos_por_puesto: Record<string, number>;
  orden: number;
  activa: boolean;
  creado_en: string;
  actualizado_en: string;
  imagen_actualizado_en?: string | null;
}

export interface Reto {
  id: string;
  grado_id: string;
  nombre: string;
  instrucciones: string | null;
  tipo: TipoReto;
  puntos_por_puesto: Record<string, number>;
  orden: number;
  creado_en: string;
}

export interface Jugador {
  id: string;
  sesion_id: string;
  nombre: string;
  colegio_id: string | null;
  alumno_id: string | null;
  conectado: boolean;
  ultima_conexion: string | null;
  creado_en: string;
}

export interface Respuesta {
  id: string;
  pregunta_id: string;
  jugador_id: string;
  opcion_seleccionada: string | null;
  texto_respuesta: string | null;
  correcta: boolean | null;
  enviado_en: string;
  numero_orden: number | null;
  puntos: number;
  creado_en: string;
  jugador_nombre?: string;
  vidas_restantes?: number;
  errores?: number;
  eliminado?: boolean;
}

export interface EstadoVida {
  jugador_id: string;
  nombre: string;
  conectado: boolean;
  aciertos: number;
  errores: number;
  vidas_restantes: number;
  vidas_max: number;
  eliminado: boolean;
}

export interface PuntajeReto {
  id: string;
  reto_id: string;
  jugador_id: string | null;
  colegio_id: string | null;
  puesto: number;
  puntos: number;
  nombre?: string;
  creado_en: string;
}

export interface PodiumEntry {
  puesto: number;
  nombre: string;
  puntos_total: number;
  es_colegio: boolean;
  entity_id: string;
  aciertos?: number;
  respondidas?: number;
}

export type EventoWS =
  | { tipo: "jugador_unido"; data: Jugador; ts: string }
  | { tipo: "jugador_cambio"; data: Jugador; ts: string }
  | { tipo: "jugador_desconectado"; data: { jugador_id: string }; ts: string }
  | { tipo: "sesion_cambio"; data: SesionJuego; ts: string }
  | {
      tipo: "respuesta_recibida";
      data: Respuesta & { jugador_nombre?: string };
      ts: string;
    }
  | {
      tipo: "resultado_pregunta";
      data: {
        pregunta_id: string;
        respuestas: Respuesta[];
        estados?: EstadoVida[];
      };
      ts: string;
    }
  | { tipo: "reto_lanzado"; data: Reto; ts: string }
  | { tipo: "podium_actualizado"; data: PodiumEntry[]; ts: string }
  | { tipo: "cronometro"; data: { segundos_restantes: number }; ts: string }
  | { tipo: "vidas_cambio"; data: EstadoVida; ts: string };
