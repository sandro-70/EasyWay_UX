import "./tablaReportesPromociones.css";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getPromocionesConDetallesURL } from "./api/PromocionesApi";

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
  ChevronDown: (props) => (
    <svg viewBox="0 0 24 24" className={"w-4 h-4 inline ml-1 " + (props.className || "")}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
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

function TablaReportesPromociones() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [showCategoria, setShowCategoria] = useState(false);

  const itemsPerPage = 8;

  // Cargar datos desde la API
  useEffect(() => {
    async function fetchPromociones() {
      try {
        const response = await getPromocionesConDetallesURL();
        // Mapear a formato que espera la tabla
        const promos = response.data.map((p) => ({
          id: p.id_promocion,
          nombre: p.nombre_promocion || p.nombre || "Sin nombre",
          tipo: p.valor_porcentaje > 0 ? "Descuento" : "Monto",
          categoria: "Sin categoría", // Ajusta si tienes categoría en tu DB
          descuento: p.valor_porcentaje > 0 ? p.valor_porcentaje : p.valor_fijo,
          cuponesUsados: p.cuponesUsados || 0, // Si no lo tienes, dejar 0
        }));
        setData(promos);
      } catch (error) {
        console.error("Error cargando promociones:", error);
      }
    }
    fetchPromociones();
  }, []);

  const filteredData = data.filter((item) =>
    categoriaFilter ? item.categoria === categoriaFilter : true
  );

  const paginatedData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    XLSX.utils.sheet_add_aoa(worksheet, [["ID Promoción", "Nombre Promoción", "Tipo", "Categoría", "Descuento", "Cupones Usados"]], { origin: "A1" });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ReportePromociones");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "Reporte_Promociones.xlsx");
  };

  return (
    <div className="px-4" style={{ position: "absolute", left: 0, right: 0, width: "100%", display: "flex", flexDirection: "column" }}>
      <div className="promocion-container">
        <header className="page-header">
          <h1 className="promocion-title"><span>Reporte de Promociones y Descuentos</span></h1>
          <button onClick={exportToExcel} className="ventas-export-btn">📊 Exportar a Excel</button>
        </header>
        <div className="divider" />
        
        <div className="promocion-count">
          <span>Total Promociones: </span>
          <span className="count-bubble">{filteredData.length}</span>
        </div>
        <div className="promocion-table-wrap">
          <table className="promocion-table">
            <thead className="promocion-thead">
              <tr>
                <th>ID Promoción</th>
                <th>Nombre Promoción</th>
                <th>Tipo</th>
                <th>
                  Categoría{" "}
                  <span className="categoria-icon" onClick={() => setShowCategoria(!showCategoria)}>
                    <Icon.ChevronDown />
                  </span>
                  {showCategoria && (
                    <select
                      value={categoriaFilter}
                      onChange={(e) => {
                        setCategoriaFilter(e.target.value);
                        setPage(1);
                        setShowCategoria(false);
                      }}
                      className="categoria-select-inline"
                    >
                      <option value="">Todas</option>
                      <option value="Granos">Granos</option>
                      <option value="Lácteos">Lácteos</option>
                      <option value="Bebidas">Bebidas</option>
                      <option value="Dulces">Dulces</option>
                      <option value="Condimentos">Condimentos</option>
                    </select>
                  )}
                </th>
                <th>Descuento</th>
                <th>Cupones Usados</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="promocion-table-empty">⚠ Sin resultados</td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.nombre}</td>
                    <td>{row.tipo}</td>
                    <td>{row.categoria}</td>
                    <td>{row.tipo === "Monto" ? "L." : ""}{row.descuento}{row.tipo === "Descuento" ? "%" : ""}</td>
                    <td>{row.cuponesUsados}</td>
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
