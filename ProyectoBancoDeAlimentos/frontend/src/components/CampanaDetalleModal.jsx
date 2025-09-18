// CampanaDetalleModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { getPromocionById, actualizarPromocion } from "../api/PromocionesApi";

const tipoToLabel = (t) => (Number(t) === 1 ? "Porcentaje" : Number(t) === 2 ? "Fijo" : "—");
const labelToTipoId = (labelOrId) => {
  const v = Number(labelOrId);
  if (v === 1 || v === 2) return v;
  const s = String(labelOrId || "").toLowerCase();
  if (s.includes("porcentaje")) return 1;
  if (s.includes("fijo")) return 2;
  return null;
};

export default function CampanaDetalleModal({ id, mode = "view", onClose, onSaved }) {
  const readOnly = mode !== "edit";
  const [form, setForm] = useState({
    nombre_promocion: "", descripción: "",
    valor_fijo: null, valor_porcentaje: null,
    compra_min: null, fecha_inicio: "", fecha_termina: "",
    id_tipo_promo: null, banner_url: "", activa: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await getPromocionById(id);
        if (!alive) return;
        setForm({
          nombre_promocion: data?.nombre_promocion ?? "",
          descripción: data?.descripción ?? data?.descripcion ?? "",
          valor_fijo: data?.valor_fijo ?? null,
          valor_porcentaje: data?.valor_porcentaje ?? null,
          compra_min: data?.compra_min ?? null,
          fecha_inicio: data?.fecha_inicio ?? "",
          fecha_termina: data?.fecha_termina ?? "",
          id_tipo_promo: data?.id_tipo_promo ?? null,
          banner_url: data?.banner_url ?? "",
          activa: data?.activa ?? true,
        });
      } catch (e) {
        console.error("Error cargando campaña:", e);
        alert("No se pudo cargar la campaña.");
        onClose?.();
      } finally {
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id, onClose]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };
  const onChangeNumber = (e) => {
    const { name, value } = e.target;
    const num = value === "" ? "" : Number(value);
    setForm((s) => ({ ...s, [name]: Number.isFinite(num) ? num : s[name] }));
  };
  const onChangeTipo = (e) => {
    setForm((s) => ({ ...s, id_tipo_promo: labelToTipoId(e.target.value) }));
  };

  const canSave = useMemo(() => {
    if (readOnly) return false;
    if (!form.nombre_promocion?.trim()) return false;
    if (!form.descripción?.trim()) return false;
    if (!form.fecha_inicio || !form.fecha_termina) return false;
    if (![1,2].includes(Number(form.id_tipo_promo))) return false;
    if (Number(form.id_tipo_promo) === 1 && !(Number(form.valor_porcentaje) > 0)) return false;
    if (Number(form.id_tipo_promo) === 2 && !(Number(form.valor_fijo) > 0)) return false;
    return true;
  }, [form, readOnly]);

  const guardar = async () => {
    try {
      setSaving(true);
      const payload = {
        nombre_promocion: String(form.nombre_promocion).trim(),
        descripción: String(form.descripción).trim(),
        valor_fijo: Number(form.id_tipo_promo) === 2 ? Number(form.valor_fijo) : null,
        valor_porcentaje: Number(form.id_tipo_promo) === 1 ? Number(form.valor_porcentaje) : null,
        compra_min: form.compra_min != null ? Number(form.compra_min) : null,
        fecha_inicio: form.fecha_inicio,
        fecha_termina: form.fecha_termina,
        id_tipo_promo: Number(form.id_tipo_promo),
        banner_url: form.banner_url || null,
        activa: !!form.activa,
      };
      await actualizarPromocion(id, payload);
      alert("Campaña actualizada correctamente.");
      onSaved?.();
    } catch (e) {
      console.error("No se pudo actualizar la campaña:", e);
      alert(e?.response?.data?.error || "No se pudo actualizar.");
    } finally {
      setSaving(false);
    }
  };

  // cerrar al click fuera
  const onOverlayMouseDown = (e) => {
    if (e.target.classList.contains("cp-modal-overlay")) onClose?.();
  };

  return (
    <div className="cp-modal-overlay" onMouseDown={onOverlayMouseDown}>
      <div className="cp-modal" role="dialog" aria-modal="true" aria-labelledby="cp-modal-title">
        <div className="cp-modal-header">
          <h2 id="cp-modal-title" className="cp-modal-title">Campaña promocional</h2>
          <div className="cp-modal-actions">
           
          </div>
        </div>

        <div className="cp-divider" />

        <div className="cp-modal-body">
          {loading ? (
            <p className="cp-loading">Cargando…</p>
          ) : (
            <div className="cp-section">
              <div className="cp-form-grid">
                <div className="cp-field">
                  <label className="cp-label">Nombre</label>
                  <input className="cp-input" name="nombre_promocion" value={form.nombre_promocion}
                         onChange={onChange} disabled={readOnly} type="text" />
                </div>

                <div className="cp-field">
                  <label className="cp-label">Descripción</label>
                  <input className="cp-input" name="descripción" value={form.descripción}
                         onChange={onChange} disabled={readOnly} type="text" />
                </div>

                <div className="cp-field">
                  <label className="cp-label">Tipo</label>
                  <select className="cp-input" value={tipoToLabel(form.id_tipo_promo)}
                          onChange={onChangeTipo} disabled={readOnly}>
                    <option value="—">Seleccione…</option>
                    <option value="Porcentaje">Porcentaje</option>
                    <option value="Fijo">Fijo</option>
                  </select>
                </div>

                {Number(form.id_tipo_promo) === 1 && (
                  <div className="cp-field">
                    <label className="cp-label">% Descuento</label>
                    <input className="cp-input" name="valor_porcentaje" value={form.valor_porcentaje ?? ""}
                           onChange={onChangeNumber} disabled={readOnly} type="number" min={1} max={100} />
                  </div>
                )}
                {Number(form.id_tipo_promo) === 2 && (
                  <div className="cp-field">
                    <label className="cp-label">Valor fijo</label>
                    <input className="cp-input" name="valor_fijo" value={form.valor_fijo ?? ""}
                           onChange={onChangeNumber} disabled={readOnly} type="number" min={1} />
                  </div>
                )}

                <div className="cp-field">
                  <label className="cp-label">Compra mínima</label>
                  <input className="cp-input" name="compra_min" value={form.compra_min ?? ""}
                         onChange={onChangeNumber} disabled={readOnly} type="number" min={0} />
                </div>

                <div className="cp-field">
                  <label className="cp-label">Válido desde</label>
                  <input className="cp-input" name="fecha_inicio" value={form.fecha_inicio || ""}
                         onChange={onChange} disabled={readOnly} type="date" />
                </div>
                <div className="cp-field">
                  <label className="cp-label">Hasta</label>
                  <input className="cp-input" name="fecha_termina" value={form.fecha_termina || ""}
                         onChange={onChange} disabled={readOnly} type="date" />
                </div>

                <div className="cp-field cp-col-span">
                  <label className="cp-label">Banner URL</label>
                  <input className="cp-input" name="banner_url" value={form.banner_url || ""}
                         onChange={onChange} disabled={readOnly} type="text" placeholder="https://…" />
                </div>

                <div className="cp-field">
                  <label className="cp-label">Activa</label>
                  <input type="checkbox" checked={!!form.activa}
                         onChange={(e) => setForm((s) => ({ ...s, activa: e.target.checked }))}
                         disabled={readOnly} style={{ width: 18, height: 18 }} />
                </div>
              </div>

              <div className="cp-modal-footer">
                <button className="cp-btn cp-btn--ghost" onClick={onClose}>
                  <Icon icon="mdi:close" /> Cerrar
                </button>
                {!readOnly && (
                  <button className="cp-btn--primaryy" onClick={guardar} disabled={!canSave || saving}>
                    <Icon icon="mdi:content-save" /> {saving ? "Guardando…" : "Guardar"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
