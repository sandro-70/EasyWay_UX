import "./tablaReportesPromociones.css";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  getPromociones,
  getReportePromociones,
  getReportePromocionZ,
} from "./api/PromocionesApi";
import { ListarCategoria } from "./api/CategoriaApi";

const Icon = {
  ChevronLeft: (props) => (
    <svg viewBox="0 0 24 24" className={"w-6 h-6 " + (props.className || "")}>
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  ),
  ChevronRight: (props) => (
    <svg viewBox="0 0 24 24" className={"w-6 h-6 " + (props.className || "")}>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  ),
};

function Pagination({ page, pageCount, onPage }) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  const handlePage = (p) => { if (p < 1 || p > pageCount) return; onPage(p); };
  return (
    <div className="promocion-pagination">
      <button onClick={() => handlePage(page - 1)} disabled={page === 1} className="promocion-pagination-btn">
        <Icon.ChevronLeft />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => handlePage(p)}
          className={`w-9 h-9 rounded-full border border-[#d8dadc] ${p === page ? "ring-2 ring-[#d8572f] text-[#d8572f]" : ""}`}
        >
          {p}
        </button>
      ))}
      <button onClick={() => handlePage(page + 1)} disabled={page === pageCount} className="promocion-pagination-btn">
        <Icon.ChevronRight />
      </button>
    </div>
  );
}

/* ======== Helpers para tipo/formatos ======== */
const TIPO_PROMO = { PORCENTAJE: 1, MONTO_FIJO: 2 };

const esMonto = (t) => {
  const n = Number(t);
  if (Number.isFinite(n)) return n === TIPO_PROMO.MONTO_FIJO;
  const s = String(t ?? "").toLowerCase();
  return s.includes("monto") || s.includes("fijo") || s.includes("valor");
};
const esPorcentaje = (t) => {
  const n = Number(t);
  if (Number.isFinite(n)) return n === TIPO_PROMO.PORCENTAJE;
  const s = String(t ?? "").toLowerCase();
  return s.includes("porcentaje") || s.includes("descuento");
};
const labelTipo = (t) => (esMonto(t) ? "Monto" : esPorcentaje(t) ? "Descuento" : "Desconocido");
const parseNumero = (x) => {
  const num = Number(String(x ?? "").replace(/[^\d.\-]/g, ""));
  return Number.isFinite(num) ? num : 0;
};
const formatDescuento = (tipo, descuento) => {
  const n = parseNumero(descuento);
  if (esMonto(tipo)) return `L. ${n}`;
  if (esPorcentaje(tipo)) return `${n}%`;
  return n <= 100 ? `${n}%` : `L. ${n}`;
};
/* =========================================== */

function TablaReportesPromociones() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [showCategoria, setShowCategoria] = useState([]);
  const [orderDesc, setOrderDesc] = useState(true);
  const [nombreFilter, setNombreFilter] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [tiposPromociones, setTiposPromociones] = useState([]);
  const itemsPerPage = 8;

  useEffect(() => {
    async function fetchPromociones() {
      try {
        const response = await getReportePromociones();
        const promos = await Promise.all(
          response.data.map(async (p) => {
            let totalProductos = 0;
            try {
              const reporteZ = await getReportePromocionZ(p.id_promocion);
              totalProductos = reporteZ.data?.total_productos || 0;
            } catch {}
            return {
              id: p.id_promocion,
              nombre: p.nombre_promocion || "Sin nombre",
              tipo: p.tipo_promocion,                     // numérico o string
              categoria: p.nombre || "Sin categoría",
              descuento: p.descuento || 0,                // solo número
              productos: totalProductos,
            };
          })
        );
        setData(promos);
        const tiposUnicos = [...new Set(promos.map((p) => labelTipo(p.tipo)))].filter((x) => x !== "Desconocido");
        setTiposPromociones(tiposUnicos.sort());
      } catch {
        try {
          const promociones = await getPromociones();
          const promos = promociones.data.map((p) => ({
            id: p.id_promocion,
            nombre: p.nombre_promocion || p.nombre || "Sin nombre",
            tipo: p.tipo_promocion ?? (p.valor_fijo > 0 ? TIPO_PROMO.MONTO_FIJO : TIPO_PROMO.PORCENTAJE),
            categoria: p.categoria_promocion || "Sin categoría",
            descuento: p.valor_porcentaje > 0 ? p.valor_porcentaje : p.valor_fijo,
            productos: p.total_productos ?? 0,
          }));
          setData(promos);
          const tiposUnicos = [...new Set(promos.map((p) => labelTipo(p.tipo)))].filter((x) => x !== "Desconocido");
          setTiposPromociones(tiposUnicos.sort());
        } catch {}
      }
    }
    fetchPromociones();
  }, []);

  useEffect(() => {
    async function fetchCategorias() {
      try {
        const response = await ListarCategoria();
        setShowCategoria(response.data);
      } catch {}
    }
    fetchCategorias();
  }, []);

  const filteredAndSortedData = data
    .filter((item) => {
      const categoriaMatch = categoriaFilter ? item.categoria === categoriaFilter : true;
      const nombreMatch = nombreFilter ? item.nombre.toLowerCase().includes(nombreFilter.toLowerCase()) : true;
      const tipoMatch = tipoFilter ? labelTipo(item.tipo) === tipoFilter : true;
      return categoriaMatch && nombreMatch && tipoMatch;
    })
    .sort((a, b) => (orderDesc ? b.id - a.id : a.id - b.id));

  const paginatedData = filteredAndSortedData.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage) || 1;

  const exportToExcel = () => {
    const rows = filteredAndSortedData.map((item) => ({
      "ID": item.id,
      "Nombre Promoción": item.nombre,
      "Tipo": labelTipo(item.tipo),
      "Descuento": formatDescuento(item.tipo, item.descuento),
      "Total De Productos": item.productos,
    }));

    const headers = ["ID", "Nombre Promoción", "Tipo", "Descuento", "Total De Productos"];

    const ws = XLSX.utils.json_to_sheet([], { skipHeader: true });
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: "A1" });
    XLSX.utils.sheet_add_json(ws, rows, { origin: "A2", skipHeader: true });

    const lastRow = rows.length + 1;

    ws["!autofilter"] = {
      ref: XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: lastRow - 1, c: headers.length - 1 },
      }),
    };

    const computeColWidths = (sheet, headers, lastRow) =>
      headers.map((h, c) => {
        let maxLen = String(h).length;
        for (let r = 2; r <= lastRow; r++) {
          const cell = sheet[XLSX.utils.encode_cell({ c, r: r - 1 })];
          if (cell && cell.v != null) {
            const str = typeof cell.v === "string" ? cell.v : String(cell.v);
            maxLen = Math.max(maxLen, str.length);
          }
        }
        return { wch: Math.min(Math.max(maxLen + 2, 12), 50) };
      });
    ws["!cols"] = computeColWidths(ws, headers, lastRow);
    ws["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft", state: "frozen" };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ReportePromociones");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    saveAs(blob, "Reporte_Promociones.xlsx");
  };

  const toggleOrder = () => { setOrderDesc(!orderDesc); setPage(1); };
  const clearFilters = () => { setNombreFilter(""); setCategoriaFilter(""); setTipoFilter(""); setPage(1); };

  return (
    <div className="px-4" style={{ position: "absolute", left: 0, right: 0, width: "100%", display: "flex", flexDirection: "column" }}>
      <div className="promocion-container">
        <header className="page-header">
          <h1 className="promocion-title"><span>Reporte de Promociones y Descuentos</span></h1>
          <button onClick={exportToExcel} className="ventas-export-btn">📊 Exportar a Excel</button>
        </header>
        <div className="divider" />

        <div className="promocion-filters-unified" style={{ display: "flex", alignItems: "center", borderRadius: "8px", gap: "1rem" }}>
          <div className="promocion-filtros" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "#374151", whiteSpace: "nowrap" }}>Promoción:</label>
              <input
                type="text"
                value={nombreFilter}
                onChange={(e) => { setNombreFilter(e.target.value); setPage(1); }}
                placeholder="Buscar por nombre Prom..."
                style={{ padding: "0.5rem 0.75rem", border: "2px solid #e5e7eb", borderRadius: "6px", fontSize: "0.875rem", minWidth: "180px", transition: "border-color 0.2s", outline: "none" }}
                onFocus={(e) => (e.target.style.borderColor = "#a3908bff")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: "500", whiteSpace: "nowrap" }}>Tipo:</label>
              <select
                value={tipoFilter}
                onChange={(e) => { setTipoFilter(e.target.value); setPage(1); }}
                style={{ padding: "0.5rem 0.75rem", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "0.875rem", minWidth: "140px", backgroundColor: "#E6E6E6", cursor: "pointer", outline: "none", transition: "border-color 0.2s" }}
                onFocus={(e) => (e.target.style.borderColor = "#a3908bff")}
              >
                <option value="">Todos los tipos</option>
                {tiposPromociones.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            {(nombreFilter || categoriaFilter || tipoFilter) && (
              <button
                onClick={clearFilters}
                style={{ padding: "0.5rem 0.75rem", backgroundColor: "#b6adadff", border: "2px solid #c0a8a8ff", borderRadius: "6px", fontSize: "0.75rem", color: "white", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap", display: "flex", gap: "0.25rem", alignItems: "center", fontWeight: "500" }}
              >
                ✕ Limpiar filtros
              </button>
            )}
          </div>

          <div className="promocion-count">
            <span>Total de promociones:</span>
            <span>{filteredAndSortedData.length}</span>
          </div>
        </div>

        <div className="promocion-table-wrap">
          <table className="promocion-table">
            <thead className="promocion-thead">
              <tr>
                <th style={{ cursor: "pointer", position: "relative", userSelect: "none" }} onClick={toggleOrder} title="Hacer clic para cambiar ordenamiento">
                  <span>ID</span>{orderDesc ? "↓" : "↑"}
                </th>
                <th><span>Nombre Promoción</span></th>
                <th><span>Tipo</span></th>
                <th><span style={{ fontSize: "0.875rem" }}>Descuento</span></th>
                <th><span style={{ fontSize: "0.875rem" }}>Total De Productos</span></th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>
                    <div><div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📋</div><div>No hay promociones disponibles</div></div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td><span style={{ fontWeight: "500" }}>{row.nombre}</span></td>
                    <td><span>{labelTipo(row.tipo)}</span></td>
                    <td><span>{formatDescuento(row.tipo, row.descuento)}</span></td>
                    <td><div><span>{row.productos}</span></div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="promocion-pagination mt-4">
          <Pagination page={page} pageCount={totalPages} onPage={setPage} />
        </div>
      </div>
    </div>
  );
}

export default TablaReportesPromociones;
