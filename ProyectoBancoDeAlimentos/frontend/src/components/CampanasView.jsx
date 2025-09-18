// CampanasView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
//import "./UserManagementViews.css";
import {
  getPromociones,
  desactivarPromocion,
} from "../api/PromocionesApi";

// Mapear id_tipo_promo (según tu creación: % => 1, fijo => 2)
const tipoToLabel = (id_tipo_promo) => {
  const v = Number(id_tipo_promo);
  if (v === 1) return "Porcentaje";
  if (v === 2) return "Fijo";
  return "—";
};

export default function CampanasView() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");

  const cargar = async () => {
    try {
      const resp = await getPromociones();
      const data = Array.isArray(resp?.data) ? resp.data : [];
      // Normalizamos por si viene "descripcion" o "descripción"
      
      const ui = data.map((p) => ({
        id: p.id_promocion,
        nombre: p.nombre_promocion ?? "",
        descripcion: p.descripcion ?? p.descripción ?? "",
        tipo: tipoToLabel(p.id_tipo_promo),
      }));
      setRows(ui);
    } catch (e) {
      console.error("Error listando campañas:", e);
      setRows([]);
    }
  };

  useEffect(() => { cargar(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.id, r.nombre, r.descripcion, r.tipo].join(" ").toLowerCase().includes(q)
    );
  }, [rows, query]);

  const onEliminar = async (id) => {
    if (!id) return;
    if (!window.confirm("¿Eliminar (desactivar) esta campaña?")) return;
    try {
      await desactivarPromocion(id);
      await cargar();
      alert("Campaña eliminada (desactivada).");
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar la campaña.");
    }
  };

  const onVer = (id) => {
    navigate(`/campanapromocional?id=${id}&mode=view`);
  };
  const onEditar = (id) => {
    navigate(`/campana-promocional?id=${id}&mode=edit`);
  };

  return (
    <div className="page-container">
      <div className="main-content">
        {/* Encabezado idéntico */}
        <div className="page-header">
          <h1>Campaña promocional</h1>
          <div style={{ display: "flex", gap: 8 }}>

            <button className="btn-secondary" onClick={() => cargar()}>
              <Icon icon="mdi:refresh" width={18} height={18} />
              Recargar
            </button>
            <button
              className="btn-primary"
              onClick={() => navigate("/campanaPromocional")}
            >
              <Icon icon="mdi:plus" width={18} height={18} />
              Nueva campaña
            </button>
          </div>
        </div>

        <div className="divider" />

        {/* Buscador igual al patrón */}
        <div className="search-bar">
          <div className="search-input">
            <Icon className="search-icon" icon="mdi:magnify" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por id / nombre / tipo…"
            />
          </div>
          <span className="user-count">
            <Icon icon="mdi:percent" />
            {filtered.length} campañas
          </span>
        </div>

        {/* Tabla con mismo formato */}
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th className="col-id">ID</th>
                <th className="col-name">Nombre</th>
                <th>Descripción</th>
                <th className="col-role">Tipo</th>
                <th className="col-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 16 }}>
                    No hay campañas.
                  </td>
                </tr>
              ) : (
                
                filtered.map((r) => (
                  <tr key={r.id}>
                  
                    <td style={{ textAlign: "center" }}>{r.id}</td>
                    <td>{r.nombre}</td>
                    <td>{r.descripcion}</td>
                    <td style={{ textAlign: "center" }}>{r.tipo}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="icon-btn icon-btn--view"
                          title="Ver"
                          onClick={() => onVer(r.id)}
                        >
                          <Icon icon="mdi:eye-outline" className="icon--view" />
                        </button>
                        <button
                          className="icon-btn"
                          title="Editar"
                          onClick={() => onEditar(r.id)}
                        >
                          <Icon icon="mdi:pencil-outline" className="icon--edit" />
                        </button>
                        <button
                          className="icon-btn"
                          title="Eliminar"
                          onClick={() => onEliminar(r.id)}
                        >
                          <Icon icon="mdi:trash-can-outline" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
