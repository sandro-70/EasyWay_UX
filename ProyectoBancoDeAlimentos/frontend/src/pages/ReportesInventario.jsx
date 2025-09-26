import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  listarAuditorias,
  filtrarCantidadMayor,
  filtrarCantidadMenor,
} from "../api/auditoriaApi";
import { listarProductosl } from "../api/InventarioApi";
import "./ReportesInventario.css";

export default function ReportesInventario() {
  const [filas, setFilas] = useState([]);
  const [valorInventario, setValorInventario] = useState(0);
  const [filtro, setFiltro] = useState("Todos");
  const [paginaActual, setPaginaActual] = useState(1);
  const [showFilter, setShowFilter] = useState(null);
  const [filterText, setFilterText] = useState("");
  const filasPorPagina = 8;

  const [appliedFilters, setAppliedFilters] = useState({
    producto: "",
    categoria: "",
    subcategoria: "",
    operacion: "",
    estado: "",
  });

  const Icon = {
    Search: (props) => (
      <svg viewBox="0 0 24 24" fill="none" className={"w-4 h-4 " + (props.className || "")}>
        <path d="M11 19a8 8 0 1 1 5.29-14.03A8 8 0 0 1 11 19Zm10 2-5.4-5.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    ChevronLeft: (props) => (
      <svg viewBox="0 0 24 24" className={"w-6 h-6 " + (props.className || "")}>
        <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      </svg>
    ),
    ChevronRight: (props) => (
      <svg viewBox="0 0 24 24" className={"w-6 h-6 " + (props.className || "")}>
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      </svg>
    ),
  };

  const [sortConfig, setSortConfig] = useState({ key: "id_producto", direction: "asc" });
  const toggleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key ? { key, direction: prev.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" }
    );
  };

  const fetchAuditorias = async () => {
    try {
      let response;
      if (filtro === "Todos") response = await listarAuditorias();
      else if (filtro === "Más vendidos") response = await filtrarCantidadMayor();
      else if (filtro === "Menos vendidos") response = await filtrarCantidadMenor();
      else response = await listarAuditorias();
      setFilas(response.data);
      setPaginaActual(1);
    } catch (error) {
      console.error("Error al traer auditorías:", error);
    }
  };

  const fetchValorInventario = async () => {
    try {
      const { data } = await listarProductosl();
      const total = data.reduce((acc, prod) => acc + Number(prod.precio_venta || 0), 0);
      setValorInventario(total);
    } catch (error) {
      console.error("Error al traer valor de inventario:", error);
    }
  };

  useEffect(() => {
    fetchAuditorias();
    fetchValorInventario();
  }, [filtro]);

  const openFilter = (key) => {
    setShowFilter(key);
    setFilterText(appliedFilters[key] || "");
  };

  const filteredRows = filas.filter((r) =>
    r.nombre_producto.toLowerCase().includes(appliedFilters.producto.toLowerCase()) &&
    r.categoria.toLowerCase().includes(appliedFilters.categoria.toLowerCase()) &&
    r.subcategoria.toLowerCase().includes(appliedFilters.subcategoria.toLowerCase()) &&
    r.operacion.toLowerCase().includes(appliedFilters.operacion.toLowerCase()) &&
    r.estado_producto.toLowerCase().includes(appliedFilters.estado.toLowerCase())
  );

  const sortedRows = [...filteredRows].sort((a, b) => {
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
    }
    return sortConfig.direction === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const totalPaginas = Math.ceil(sortedRows.length / filasPorPagina) || 1;
  const indiceInicio = (paginaActual - 1) * filasPorPagina;
  const filasPagina = sortedRows.slice(indiceInicio, indiceInicio + filasPorPagina);

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

  const StatusBadge = ({ value }) => {
    if (!value) return null;
    const val = String(value).toLowerCase();
    const clase = val === "activo" ? "estado-activo" : val === "inactivo" ? "estado-inactivo" : "";
    return <span className={`estado-badge ${clase}`}>{val.charAt(0).toUpperCase() + val.slice(1)}</span>;
  };

  const computeColWidths = (ws, headers, lastRow) =>
    headers.map((h, c) => {
      let maxLen = String(h).length;
      for (let r = 2; r <= lastRow; r++) {
        const cell = ws[XLSX.utils.encode_cell({ c, r: r - 1 })];
        if (cell && cell.v != null) {
          const str = typeof cell.v === "string" ? cell.v : String(cell.v);
          maxLen = Math.max(maxLen, str.length);
        }
      }
      return { wch: Math.min(Math.max(maxLen + 2, 12), 50) };
    });

  const exportToExcel = () => {
    const rows = sortedRows.map((r) => ({
      "ID de Producto": r.id_producto,
      "Producto": r.nombre_producto,
      "Categoría": r.categoria,
      "Subcategoría": r.subcategoria,
      "Cantidad": r.cantidad,
      "Entrada/Salida": r.operacion?.toUpperCase() || "",
      "Estado": r.estado_producto ? (String(r.estado_producto).charAt(0).toUpperCase() + String(r.estado_producto).slice(1).toLowerCase()) : "",
    }));

    const headers = ["ID de Producto", "Producto", "Categoría", "Subcategoría", "Cantidad", "Entrada/Salida", "Estado"];

    const ws = XLSX.utils.json_to_sheet([], { skipHeader: true });
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: "A1" });
    XLSX.utils.sheet_add_json(ws, rows, { origin: "A2", skipHeader: true });

    const lastRow = rows.length + 1;

    ws["!autofilter"] = {
      ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: lastRow - 1, c: headers.length - 1 } }),
    };
    ws["!cols"] = computeColWidths(ws, headers, lastRow);
    ws["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft", state: "frozen" };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    saveAs(blob, `Reporte_Inventario.xlsx`);
  };

  return (
    <div
      className="px-4"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div className="inventario-container">
        <header className="page-header">
          <h1 className="inventario-title">Reportes de Inventario</h1>
          <button onClick={exportToExcel} className="ventas-export-btn">📊 Exportar a Excel</button>
        </header>

        <div className="divider" />

        <div className="filtros-container">

          <div className="inventario-count">
            <span>Valor total de inventario: L.</span>
            <span className="count-bubble ml-1">{valorInventario.toLocaleString()}</span>
          </div>
        </div>

        <div className="inventario-table-wrap">
          <table className="inventario-table">
            <thead>
              <tr>
                <th
                  className="px-4 py-3 text-white text-center bg-[#2B6DAF]"
                  style={{ cursor: "pointer" }}
                  onClick={() => { toggleSort("id_producto"); setPaginaActual(1); }}
                  title="Ordenar por ID de Producto"
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    <span>ID de Producto</span>
                    <span style={{ display: "inline-block", transform: sortConfig.direction === "asc" ? "rotate(0deg)" : "rotate(180deg)" }}>↓</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-white text-center bg-[#2B6DAF]">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    <span>Producto</span>
                    <span style={{ cursor: "pointer" }} onClick={() => openFilter("producto")}><Icon.Search /></span>
                  </div>
                </th>
                <th className="px-4 py-3 text-white text-center bg-[#2B6DAF]">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    <span>Categoría</span>
                    <span style={{ cursor: "pointer" }} onClick={() => openFilter("categoria")}><Icon.Search /></span>
                  </div>
                </th>
                <th className="px-4 py-3 text-white text-center bg-[#2B6DAF]">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    <span>Subcategoría</span>
                    <span style={{ cursor: "pointer" }} onClick={() => openFilter("subcategoria")}><Icon.Search /></span>
                  </div>
                </th>
                <th className="px-4 py-3 text-white text-center bg-[#2B6DAF]">Cantidad</th>
                <th className="px-4 py-3 text-white text-center bg-[#2B6DAF]">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    <span>Entrada/Salida</span>
                    <span style={{ cursor: "pointer" }} onClick={() => openFilter("operacion")}><Icon.Search /></span>
                  </div>
                </th>
                <th className="px-4 py-3 text-white text-center bg-[#2B6DAF]">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    <span>Estado</span>
                    <span style={{ cursor: "pointer" }} onClick={() => openFilter("estado")}><Icon.Search /></span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filasPagina.length > 0 ? (
                filasPagina.map((r, idx) => (
                  <tr key={idx} className="text-center border-b border-gray-300 last:border-b-0">
                    <td>{r.id_producto}</td>
                    <td>{r.nombre_producto}</td>
                    <td>{r.categoria}</td>
                    <td>{r.subcategoria}</td>
                    <td>{r.cantidad}</td>
                    <td>{(r.operacion || "").toUpperCase()}</td>
                    <td><StatusBadge value={r.estado_producto} /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-4 text-black text-center">No hay registros de auditoría</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pedido-pagination-wrapper">
          <Pagination page={paginaActual} pageCount={totalPaginas} onPage={setPaginaActual} />
        </div>

        {showFilter && (
          <div className="mini-modal">
            <div className="mini-modal-content">
              <h3>Filtrar por {showFilter}</h3>
              <input
                type="text"
                placeholder={`Escriba un ${showFilter}...`}
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
              <div className="mini-modal-actions">
                <button
                  onClick={() => {
                    setAppliedFilters({ ...appliedFilters, [showFilter]: filterText });
                    setShowFilter(null);
                    setFilterText("");
                    setPaginaActual(1);
                  }}
                  className="btn-apply"
                >
                  Aplicar
                </button>
                <button
                  onClick={() => {
                    setShowFilter(null);
                    setFilterText("");
                  }}
                  className="btn-cancel"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
