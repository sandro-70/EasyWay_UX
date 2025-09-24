//Agregar conexion con reportes administrador

import "./tablaReportesVentas.css";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  getVentasConFiltros,
  exportVentasExcel,
} from "./api/reporteusuarioApi";

const Icon = {
  Search: (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={"w-4 h-4 " + (props.className || "")}
    >
      <path
        d="M11 19a8 8 0 1 1 5.29-14.03A8 8 0 0 1 11 19Zm10 2-5.4-5.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  ChevronLeft: (props) => (
    <svg viewBox="0 0 24 24" className={"w-6 h-6 " + (props.className || "")}>
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  ),
  ChevronRight: (props) => (
    <svg viewBox="0 0 24 24" className={"w-6 h-6 " + (props.className || "")}>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  ),
};

function Pagination({ page, pageCount, onPage }) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  const handlePage = (p) => {
    if (p < 1 || p > pageCount) return;
    onPage(p);
  };

  return (
    <div className="ventas-pagination">
      <button
        onClick={() => handlePage(page - 1)}
        className="ventas-pagination-btn"
        disabled={page === 1}
        title="Anterior"
      >
        <Icon.ChevronLeft />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => handlePage(p)}
          className={`ventas-page-btn ${
            p === page ? "ventas-page-btn-active" : ""
          }`}
          title={`Página ${p}`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => handlePage(page + 1)}
        className="ventas-pagination-btn"
        disabled={page === pageCount}
        title="Siguiente"
      >
        <Icon.ChevronRight />
      </button>
    </div>
  );
}

function TablaReportesVentas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [appliedFilter, setAppliedFilter] = useState("");
  const [orderDesc, setOrderDesc] = useState(true);
  const [trimestre, setTrimestre] = useState(""); // filtro por trimestre

  const itemsPerPage = 8;

  // Traer los datos del backend
  useEffect(() => {
    setLoading(true);
    getVentasConFiltros()
      .then((res) => {
        const formatted = res.data.map((v, index) => ({
          id: index + 1,
          producto: v.producto.nombre,
          categoria: v.producto.categoria || "-",
          sucursal: v.sucursal?.nombre || "Sucursal no definida",
          cantidad: v.total_vendido,
          precioVenta: v.producto.precio_base,
          total: v.total_vendido * v.producto.precio_base,
          fecha: v.fecha ? new Date(v.fecha) : null, // Aseguramos que sea Date
        }));
        setVentas(formatted);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Ordenar
  const sortedData = [...ventas].sort((a, b) =>
    orderDesc ? b.id - a.id : a.id - b.id
  );

  // Filtrar
  const filteredData = sortedData.filter((item) => {
    // filtro por texto (producto)
    const matchProducto = appliedFilter
      ? item.producto.toLowerCase().includes(appliedFilter.toLowerCase())
      : true;

    // filtro por trimestre
    let matchTrimestre = true;
    if (trimestre && item.fecha) {
      const mes = item.fecha.getMonth() + 1;
      const trimestreCalculado = Math.ceil(mes / 3);
      matchTrimestre = trimestreCalculado === parseInt(trimestre);
    }

    return matchProducto && matchTrimestre;
  });

  // Paginación
  const paginatedData = filteredData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

  // Exportar Excel usando API
  const handleExportExcel = () => {
    exportVentasExcel()
      .then((res) => {
        const blob = new Blob([res.data], { type: "application/octet-stream" });
        saveAs(blob, "Reporte_Ventas.xlsx");
      })
      .catch((err) => console.error(err));
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
      <div className="ventas-container" style={{ maxWidth: "1200px" }}>
        <header className="page-header">
          <h1 className="ventas-title">Reportes De Ventas</h1>
          <button onClick={handleExportExcel} className="ventas-export-btn">
            📊 Exportar a Excel
          </button>
        </header>
        <div className="divider" />

        {/* Filtro por trimestre */}
        <div className="filtros-container">
            <label>Filtrar por trimestre:</label>
            <select
              value={trimestre}
              onChange={(e) => {
                setTrimestre(e.target.value);
                setPage(1);
              }}
              className="font-14px border rounded px-3 py-1 bg-[#E6E6E6]"
            >
              
              <option value="">Todos</option>
              <option value="1">1er Trimestre (Ene - Mar)</option>
              <option value="2">2do Trimestre (Abr - Jun)</option>
              <option value="3">3er Trimestre (Jul - Sep)</option>
              <option value="4">4to Trimestre (Oct - Dic)</option>
            </select>
        </div>

        {loading ? (
          <div className="ventas-loading">Cargando...</div>
        ) : (
          <div className="ventas-table-wrap">
            <table className="ventas-table">
              <thead className="ventas-thead">
                <tr>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => setOrderDesc(!orderDesc)}
                    title="Ordenar por ID"
                  >
                    ID {orderDesc ? "↓" : "↑"}
                  </th>
                  <th>
                    <div className="flex items-center justify-center">
                      <span>Nombre</span>
                      <span
                        className="ventas-search-icon ml-1 cursor-pointer"
                        onClick={() => setShowFilter(true)}
                        title="Filtrar producto"
                      >
                        <Icon.Search />
                      </span>
                    </div>
                  </th>
                  <th>Categoría</th>
                  <th>Cantidad</th>
                  <th>Sucursal</th>
                  <th>Precio Venta</th>
                  <th>Total Vendido</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="ventas-table-empty">
                      ⚠ Sin resultados para "{appliedFilter}"
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.producto}</td>
                      <td>{row.categoria}</td>
                      <td>{row.cantidad}</td>
                      <td>{row.sucursal}</td>
                      <td>L. {row.precioVenta}</td>
                      <td>L. {row.total}</td>
                      <td>
                        {row.fecha
                          ? row.fecha.toLocaleDateString("es-HN")
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} pageCount={totalPages} onPage={setPage} />

        {/* Mini ventana emergente */}
        {showFilter && (
          <div className="mini-modal">
            <div className="mini-modal-content">
              <h3>Filtrar por producto</h3>
              <input
                type="text"
                placeholder="Escriba un nombre..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
              <div className="mini-modal-actions">
                <button
                  onClick={() => {
                    setAppliedFilter(filterText);
                    setShowFilter(false);
                    setPage(1);
                  }}
                  className="btn-apply"
                >
                  Aplicar
                </button>
                <button
                  onClick={() => {
                    setShowFilter(false);
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
export default TablaReportesVentas;
