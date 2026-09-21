"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, imagenPreguntaUrl } from "@/lib/api";
import type { Grado, Pregunta, SesionNumero, TipoPregunta } from "@/types/game";

const LETRAS = ["A", "B", "C", "D"] as const;
const MAX_LADO = 1280;
const CALIDAD = 0.75;

interface FormState {
  id: string | null;
  sesion: SesionNumero;
  tipo: TipoPregunta;
  enunciado: string;
  opciones: string[];
  respuesta_correcta: string;
  tiempo_limite: number;
  puntos: string[];
  activa: boolean;
}

const FORM_VACIO: FormState = {
  id: null,
  sesion: "1",
  tipo: "opcion-multiple",
  enunciado: "",
  opciones: ["", "", "", ""],
  respuesta_correcta: "A",
  tiempo_limite: 30,
  puntos: ["", "", ""],
  activa: true,
};

interface ImagenPendiente {
  blob: Blob;
  ancho: number;
  alto: number;
}

/** Reduce la imagen en el navegador para no subir originales de varios MB. */
async function comprimirImagen(file: File): Promise<ImagenPendiente> {
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, MAX_LADO / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.max(1, Math.round(bitmap.width * escala));
  const alto = Math.max(1, Math.round(bitmap.height * escala));

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen");

  // Fondo blanco: los PNG con transparencia se ven bien en el proyector.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, ancho, alto);
  ctx.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", CALIDAD),
  );
  if (!blob) throw new Error("No se pudo comprimir la imagen");
  return { blob, ancho, alto };
}

function puntosDesdePregunta(p: Pregunta): string[] {
  const ppt = p.puntos_por_puesto ?? {};
  return [1, 2, 3].map((n) => {
    const v = ppt[String(n)];
    return v != null ? String(v) : "";
  });
}

export default function PreguntasPanel() {
  const router = useRouter();
  const [grados, setGrados] = useState<Grado[]>([]);
  const [gradoId, setGradoId] = useState("");
  const [sesion, setSesion] = useState<SesionNumero>("1");
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [editando, setEditando] = useState<Pregunta | null>(null);
  const [pendiente, setPendiente] = useState<ImagenPendiente | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const inputArchivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let activo = true;
    (async () => {
      const { esTokenDocente } = await import("@/lib/session");
      if (!esTokenDocente()) {
        router.push("/admin");
        return;
      }
      try {
        const g = await api.grados();
        if (!activo) return;
        setGrados(g);
        if (g.length) setGradoId(g[0].id);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
    return () => {
      activo = false;
    };
  }, [router]);

  const cargarPreguntas = useCallback(() => {
    if (!gradoId) return Promise.resolve();
    return api
      .preguntas(gradoId, true)
      .then((todas) => {
        setPreguntas(
          todas
            .filter((p) => p.sesion === sesion)
            .sort((a, b) => a.orden - b.orden),
        );
        setError("");
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }, [gradoId, sesion]);

  useEffect(() => {
    void cargarPreguntas();
  }, [cargarPreguntas]);

  function limpiarPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPendiente(null);
  }

  function abrirCrear() {
    setEditando(null);
    limpiarPreview();
    setForm({ ...FORM_VACIO, sesion });
    setError("");
    setModalAbierto(true);
  }

  function abrirEditar(p: Pregunta) {
    setEditando(p);
    limpiarPreview();
    setForm({
      id: p.id,
      sesion: p.sesion,
      tipo: p.tipo,
      enunciado: p.enunciado,
      opciones: [...(p.opciones ?? ["", "", "", ""])].slice(0, 4),
      respuesta_correcta: p.respuesta_correcta ?? "A",
      tiempo_limite: p.tiempo_limite,
      puntos: puntosDesdePregunta(p),
      activa: p.activa,
    });
    setError("");
    setModalAbierto(true);
  }

  function cerrarModal() {
    limpiarPreview();
    setModalAbierto(false);
    setEditando(null);
  }

  async function elegirArchivo(file: File) {
    try {
      setError("");
      const comprimida = await comprimirImagen(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPendiente(comprimida);
      setPreviewUrl(URL.createObjectURL(comprimida.blob));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function guardar() {
    if (!gradoId) return;
    if (!form.enunciado.trim()) {
      setError("Escribe el enunciado");
      return;
    }

    let opciones: string[] | null = null;
    if (form.tipo === "opcion-multiple") {
      opciones = form.opciones.map((o) => o.trim());
      if (opciones.some((o) => !o)) {
        setError("Completa las 4 opciones");
        return;
      }
    }

    const puntos: Record<string, number> = {};
    form.puntos.forEach((valor, i) => {
      const n = Number.parseInt(valor, 10);
      if (!Number.isNaN(n) && n > 0) puntos[String(i + 1)] = n;
    });

    const comun = {
      sesion: form.sesion,
      tipo: form.tipo,
      enunciado: form.enunciado.trim(),
      opciones,
      respuesta_correcta:
        form.tipo === "opcion-multiple" ? form.respuesta_correcta : null,
      tiempo_limite: form.tiempo_limite,
      ...(Object.keys(puntos).length ? { puntos_por_puesto: puntos } : {}),
    };

    setGuardando(true);
    setError("");
    try {
      let pregunta: Pregunta;
      if (form.id) {
        pregunta = await api.actualizarPregunta(form.id, {
          ...comun,
          activa: form.activa,
        });
      } else {
        pregunta = await api.crearPregunta({ grado_id: gradoId, ...comun });
      }
      if (pendiente && pregunta?.id) {
        await api.subirImagenPregunta(
          pregunta.id,
          pendiente.blob,
          pendiente.ancho,
          pendiente.alto,
        );
      }
      cerrarModal();
      await cargarPreguntas();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(p: Pregunta) {
    if (
      !window.confirm(
        "¿Desactivar esta pregunta? No se borran las respuestas ya registradas.",
      )
    )
      return;
    try {
      await api.eliminarPregunta(p.id);
      await cargarPreguntas();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function reactivar(p: Pregunta) {
    try {
      await api.actualizarPregunta(p.id, { activa: true });
      await cargarPreguntas();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function mover(p: Pregunta, delta: number) {
    try {
      await api.moverPregunta(p.id, delta);
      await cargarPreguntas();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function quitarImagen() {
    if (pendiente) {
      limpiarPreview();
      return;
    }
    if (!editando) return;
    if (!window.confirm("¿Quitar la imagen de esta pregunta?")) return;
    try {
      await api.eliminarImagenPregunta(editando.id);
      setEditando({ ...editando, imagen_actualizado_en: null });
      await cargarPreguntas();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const urlExistente = editando ? imagenPreguntaUrl(editando) : null;
  const urlPreview = previewUrl ?? urlExistente;

  return (
    <main className="min-h-screen bg-bg p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
          <div>
            <button
              onClick={() => router.push("/admin/session")}
              className="text-sm text-azul hover:underline mb-1"
            >
              ← Volver al menú
            </button>
            <h1 className="text-3xl font-heading font-extrabold text-azul">
              Banco de preguntas
            </h1>
            <p className="text-texto-light text-sm">
              Crea y edita preguntas, y ponles su imagen
            </p>
          </div>
          <button
            onClick={abrirCrear}
            disabled={!gradoId}
            className="px-4 py-2 bg-verde text-white rounded-lg font-bold hover:bg-verde/80 disabled:opacity-50"
          >
            + Nueva pregunta
          </button>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-5 flex gap-4 flex-wrap items-end">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-texto-light uppercase">
              Grado
            </span>
            <select
              value={gradoId}
              onChange={(e) => setGradoId(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              {grados.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-texto-light uppercase">
              Sesión
            </span>
            <select
              value={sesion}
              onChange={(e) => setSesion(e.target.value as SesionNumero)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="1">Sesión 1</option>
              <option value="2">Sesión 2</option>
            </select>
          </label>
          <span className="text-sm text-texto-light ml-auto">
            {preguntas.length} pregunta{preguntas.length === 1 ? "" : "s"}
          </span>
        </div>

        {error && !modalAbierto && (
          <div className="bg-rojo-error/10 text-rojo-error rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {cargando ? (
          <p className="text-texto-light">Cargando…</p>
        ) : preguntas.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-dashed border-gray-200">
            <p className="text-texto-light">
              No hay preguntas para este grado y sesión.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {preguntas.map((p, i) => {
              const url = imagenPreguntaUrl(p);
              return (
                <li
                  key={p.id}
                  className={`bg-white rounded-xl p-3 shadow-sm border flex gap-3 items-center ${
                    p.activa ? "border-gray-100" : "border-rojo/30 opacity-70"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1 text-texto-light">
                    <button
                      onClick={() => mover(p, -1)}
                      disabled={i === 0}
                      className="px-2 hover:text-azul disabled:opacity-20"
                      title="Subir"
                    >
                      ▲
                    </button>
                    <span className="text-xs font-bold">{p.orden}</span>
                    <button
                      onClick={() => mover(p, 1)}
                      disabled={i === preguntas.length - 1}
                      className="px-2 hover:text-azul disabled:opacity-20"
                      title="Bajar"
                    >
                      ▼
                    </button>
                  </div>

                  <div className="w-20 h-20 rounded-lg bg-bg flex items-center justify-center overflow-hidden shrink-0 border border-gray-100">
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] text-texto-light text-center px-1">
                        sin imagen
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-texto line-clamp-2">
                      {p.enunciado}
                    </p>
                    <div className="flex gap-2 mt-1 flex-wrap items-center text-xs text-texto-light">
                      <span className="px-2 py-0.5 bg-azul/10 text-azul rounded">
                        {p.tipo === "opcion-multiple"
                          ? "Opción múltiple"
                          : "Abierta"}
                      </span>
                      {p.tipo === "opcion-multiple" && p.respuesta_correcta && (
                        <span>Correcta: {p.respuesta_correcta}</span>
                      )}
                      <span>{p.tiempo_limite}s</span>
                      <span>#{p.orden}</span>
                      {!p.activa && (
                        <span className="px-2 py-0.5 bg-rojo/10 text-rojo rounded font-bold">
                          INACTIVA
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => abrirEditar(p)}
                      className="px-3 py-1 text-sm bg-azul/10 text-azul rounded-lg hover:bg-azul/20 font-bold"
                    >
                      Editar
                    </button>
                    {p.activa ? (
                      <button
                        onClick={() => borrar(p)}
                        className="px-3 py-1 text-sm text-rojo hover:underline"
                      >
                        Desactivar
                      </button>
                    ) : (
                      <button
                        onClick={() => reactivar(p)}
                        className="px-3 py-1 text-sm text-verde hover:underline"
                      >
                        Reactivar
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-4 overflow-y-auto z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 p-6 shadow-xl">
            <h2 className="text-2xl font-heading font-bold text-azul mb-4">
              {form.id ? "Editar pregunta" : "Nueva pregunta"}
            </h2>

            {error && (
              <div className="bg-rojo-error/10 text-rojo-error rounded-lg p-3 mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-texto-light uppercase">
                  Sesión
                </span>
                <select
                  value={form.sesion}
                  onChange={(e) =>
                    setForm({ ...form, sesion: e.target.value as SesionNumero })
                  }
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="1">Sesión 1</option>
                  <option value="2">Sesión 2</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-texto-light uppercase">
                  Tipo
                </span>
                <select
                  value={form.tipo}
                  onChange={(e) =>
                    setForm({ ...form, tipo: e.target.value as TipoPregunta })
                  }
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="opcion-multiple">Opción múltiple</option>
                  <option value="abierta">Abierta</option>
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1 mb-4">
              <span className="text-xs font-bold text-texto-light uppercase">
                Enunciado
              </span>
              <textarea
                value={form.enunciado}
                onChange={(e) =>
                  setForm({ ...form, enunciado: e.target.value })
                }
                rows={3}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y"
                placeholder="Escribe la pregunta…"
              />
            </label>

            {form.tipo === "opcion-multiple" && (
              <div className="mb-4">
                <span className="text-xs font-bold text-texto-light uppercase">
                  Opciones (marca la correcta)
                </span>
                <div className="flex flex-col gap-2 mt-2">
                  {form.opciones.map((op, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correcta"
                        checked={form.respuesta_correcta === LETRAS[i]}
                        onChange={() =>
                          setForm({ ...form, respuesta_correcta: LETRAS[i] })
                        }
                        className="accent-verde w-4 h-4"
                      />
                      <span className="font-bold text-azul w-5">
                        {LETRAS[i]}
                      </span>
                      <input
                        value={op}
                        onChange={(e) => {
                          const opciones = [...form.opciones];
                          opciones[i] = e.target.value;
                          setForm({ ...form, opciones });
                        }}
                        placeholder={`Texto de la opción ${LETRAS[i]}`}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 gap-3 mb-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-texto-light uppercase">
                  Tiempo (s)
                </span>
                <input
                  type="number"
                  min={5}
                  max={600}
                  value={form.tiempo_limite}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tiempo_limite: Number(e.target.value) || 30,
                    })
                  }
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </label>
              {[1, 2, 3].map((puesto) => (
                <label key={puesto} className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-texto-light uppercase">
                    Pts {puesto}º
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={form.puntos[puesto - 1]}
                    onChange={(e) => {
                      const puntos = [...form.puntos];
                      puntos[puesto - 1] = e.target.value;
                      setForm({ ...form, puntos });
                    }}
                    placeholder="—"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </label>
              ))}
            </div>

            <div className="mb-5">
              <span className="text-xs font-bold text-texto-light uppercase">
                Imagen de la pregunta
              </span>
              <div className="flex gap-4 items-start mt-2">
                <div className="w-40 h-32 rounded-lg bg-bg border border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                  {urlPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={urlPreview}
                      alt="Vista previa"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-texto-light">Sin imagen</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={inputArchivo}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) elegirArchivo(file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    onClick={() => inputArchivo.current?.click()}
                    className="px-3 py-2 text-sm bg-azul/10 text-azul rounded-lg hover:bg-azul/20 font-bold"
                  >
                    {urlPreview ? "Cambiar imagen" : "Subir imagen"}
                  </button>
                  {urlPreview && (
                    <button
                      onClick={quitarImagen}
                      className="px-3 py-2 text-sm text-rojo hover:underline"
                    >
                      Quitar imagen
                    </button>
                  )}
                  <p className="text-[11px] text-texto-light max-w-[220px]">
                    Se reduce automáticamente (máx {MAX_LADO}px). JPG, PNG o
                    WEBP.
                  </p>
                </div>
              </div>
            </div>

            {form.id && (
              <label className="flex items-center gap-2 mb-5 text-sm">
                <input
                  type="checkbox"
                  checked={form.activa}
                  onChange={(e) =>
                    setForm({ ...form, activa: e.target.checked })
                  }
                  className="accent-verde w-4 h-4"
                />
                Pregunta activa (disponible para lanzar)
              </label>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={cerrarModal}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-bg"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={guardando}
                className="px-5 py-2 text-sm rounded-lg bg-azul text-white font-bold hover:bg-azul-dark disabled:opacity-50"
              >
                {guardando ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
