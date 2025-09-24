import "./tablaReportesPromociones.css";
import React, { useState, useEffect, use } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  getPromocionesConDetallesURL,
  getPromociones,
  getReportePromociones,
  productosPorPromocion,
  getReportePromocionZ,
} from "./api/PromocionesApi";

import { ListarCategoria } from "./api/CategoriaApi";

const Icon = {
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
  ChevronDown: (props) => (
    <svg
      viewBox="0 0 24 24"
      className={"w-4 h-4 inline ml-1 " + (props.className || "")}
    >
      <path
        d="M6 9l6 6 6-6"
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
    <div className="promocion-pagination">
      <button
        onClick={() => handlePage(page - 1)}
        disabled={page === 1}
        className="promocion-pagination-btn"
      >
        <Icon.ChevronLeft />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => handlePage(p)}
          className={`w-9 h-9 rounded-full border border-[#d8dadc] ${
            p === page ? "ring-2 ring-[#d8572f] text-[#d8572f]" : ""
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => handlePage(page + 1)}
        disabled={page === pageCount}
        className="promocion-pagination-btn"
      >
        <Icon.ChevronRight />
      </button>
    </div>
  );
}

function TablaReportesPromociones() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [showCategoria, setShowCategoria] = useState([]);
  const [orderDesc, setOrderDesc] = useState(true);
  const [nombreFilter, setNombreFilter] = useState("");
  const [productos, setProductos] = useState([]);
  const itemsPerPage = 8;

  // Cargar datos desde la API
  useEffect(() => {
    async function fetchPromociones() {
      try {
        // 🔥 Usando la nueva función que ya calcula cupones usados y categorías
        const response = await getReportePromociones();
        const promociones = await getPromociones();
        console.log("Respuesta de getReportePromociones:", response.data);
        console.log("Respuesta de getPromociones:", promociones.data);

        // Mapear a formato que espera la tabla
        const promos = await Promise.all(
          response.data.map(async (p) => {
            let totalProductos = 0;

            try {
              const reporteZ = await getReportePromocionZ(p.id_promocion);
              console.log(
                `ReporteZ para promoción ${p.id_promocion}:`,
                reporteZ.data
              );
              totalProductos = reporteZ.data?.total_productos || 0;
            } catch (error) {
              console.log(
                `Error obteniendo productos para promoción ${p.id_promocion}:`,
                error.message
              );
            }

            return {
              id: p.id_promocion,
              nombre: p.nombre_promocion || "Sin nombre",
              tipo: p.tipo_promocion,
              categoria: p.nombre || "Sin categoría",
              descuento: p.descuento || "0",
              productos: totalProductos,
            };
          })
        );
        setData(promos);
      } catch (error) {
        console.error("Error cargando promociones:", error);
        // Si falla, usar la API original como fallback
        try {
          const promociones = await getPromociones();
          const promos = promociones.data.map((p) => ({
            id: p.id_promocion,
            nombre: p.nombre_promocion || p.nombre || "Sin nombre",
            tipo: p.valor_fijo > 0 ? "Descuento" : "Monto",
            categoria: p.categoria_promocion || "Sin categoría",
            descuento:
              p.valor_porcentaje > 0 ? p.valor_porcentaje : p.valor_fijo,
            cuponesUsados: "N/A",
          }));
          setData(promos);
        } catch (fallbackError) {
          console.error("Error con ambas APIs:", fallbackError);
        }
      }
    }
    fetchPromociones();
  }, []);

  //categorias para filtrar:

  useEffect(() => {
    async function fetchCategorias() {
      try {
        const response = await ListarCategoria();
        setShowCategoria(response.data);
      } catch (error) {
        console.error("Error cargando categorías:", error);
      }
    }
    fetchCategorias();
  }, []);

  // 🔥 FILTRADO Y ORDENAMIENTO CORREGIDO
  const filteredAndSortedData = data
    .filter((item) => {
      // Filtro por categoría
      const categoriaMatch = categoriaFilter
        ? item.categoria === categoriaFilter
        : true;
      // Filtro por nombre (búsqueda parcial, case insensitive)
      const nombreMatch = nombreFilter
        ? item.nombre.toLowerCase().includes(nombreFilter.toLowerCase())
        : true;

      return categoriaMatch && nombreMatch;
    })
    // Ordenamiento por ID
    .sort((a, b) => (orderDesc ? b.id - a.id : a.id - b.id));

  // Usar los datos filtrados y ordenados para la paginación
  const paginatedData = filteredAndSortedData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages =
    Math.ceil(filteredAndSortedData.length / itemsPerPage) || 1;

  const exportToExcel = () => {
    // 🔥 Preparar datos para exportación con todas las columnas
    const dataForExport = filteredAndSortedData.map((item) => ({
      "ID Promoción": item.id,
      "Nombre Promoción": item.nombre,
      Tipo: item.tipo,
      Categoría: item.categoria,
      Descuento: item.descuento,
      "Total de Productos": item.productos,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExport);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ReportePromociones");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "Reporte_Promociones_Completo.xlsx");
  };

  const toggleOrder = () => {
    setOrderDesc(!orderDesc);
    setPage(1);
  };

  // 🔥 FUNCIÓN PARA LIMPIAR FILTROS
  const clearFilters = () => {
    setNombreFilter("");
    setCategoriaFilter("");
    setPage(1);
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
      }}
    >
      <div className="promocion-container">
        <header className="page-header">
          <h1 className="promocion-title">
            <span>Reporte de Promociones y Descuentos</span>
          </h1>
          <button onClick={exportToExcel} className="ventas-export-btn">
            📊 Exportar a Excel
          </button>
        </header>
        <div className="divider" />

        <div
          className="promocion-filters-unified"
          style={{
            display: "flex",
            alignItems: "center",
            borderRadius: "8px",
            gap: "1rem",
          }}
        >
          {/* Filtros en una sola fila */}
          <div
            className="promocion-filtros"
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {/* Filtro por nombre */}
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <label
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#374151",
                  whiteSpace: "nowrap",
                }}
              >
                Promoción:
              </label>
              <input
                type="text"
                value={nombreFilter}
                onChange={(e) => {
                  setNombreFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por nombre Prom..."
                style={{
                  padding: "0.5rem 0.75rem",
                  border: "2px solid #e5e7eb",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  minWidth: "180px",
                  transition: "border-color 0.2s",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#a3908bff")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>

            {/* Botón limpiar filtros */}
            {(nombreFilter || categoriaFilter) && (
              <button
                onClick={clearFilters}
                style={{
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "#b6adadff",
                  border: "2px solid #c0a8a8ff",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  color: "white",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                  display: "flex",
                  gap: "0.25rem",
                  alignItems: "center",
                  fontWeight: "500",
                }}
              >
                ✕ Limpiar filtros
              </button>
            )}
          </div>

          {/* Contador de promociones */}
          <div className="promocion-count">
            <span>Total de promociones:</span>
            <span>{filteredAndSortedData.length}</span>
          </div>
        </div>
        <div className="promocion-table-wrap">
          <table className="promocion-table">
            <thead className="promocion-thead">
              <tr>
                <th
                  style={{
                    cursor: "pointer",
                    position: "relative",
                    userSelect: "none",
                  }}
                  onClick={toggleOrder}
                  title="Hacer clic para cambiar ordenamiento"
                >
                  <span>ID</span>
                  {orderDesc ? "↓" : "↑"}
                </th>
                <th style={{ position: "relative" }}>
                  <div>
                    <span>Nombre Promoción</span>
                  </div>
                </th>
                <th>
                  <span>Tipo</span>
                </th>
                <th>
                  <span style={{ fontSize: "0.875rem" }}>Descuento</span>
                </th>
                <th>
                  <span style={{ fontSize: "0.875rem" }}>
                    Total De Productos
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    style={{ textAlign: "center", padding: "2rem" }}
                  >
                    {nombreFilter || categoriaFilter ? (
                      <div>
                        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
                          🔍
                        </div>
                        <div
                          style={{ fontWeight: "600", marginBottom: "0.5rem" }}
                        >
                          No se encontraron promociones
                        </div>
                        <div
                          style={{
                            fontSize: "0.875rem",
                            color: "#6b7280",
                            marginBottom: "1rem",
                          }}
                        >
                          {nombreFilter && (
                            <div>• Buscando: "{nombreFilter}"</div>
                          )}
                          {categoriaFilter && (
                            <div>• Categoría: "{categoriaFilter}"</div>
                          )}
                        </div>
                        <div style={{ fontSize: "0.875rem" }}>
                          Intenta ajustar los filtros de búsqueda
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
                          📋
                        </div>
                        <div>No hay promociones disponibles</div>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>
                      <span style={{ fontWeight: "500" }}>{row.nombre}</span>
                    </td>
                    <td>
                      <span>{row.tipo}</span>
                    </td>
                    <td>
                      <span>
                        {row.tipo === "Monto" ? "L." : ""}
                        {row.descuento}
                        {row.tipo === "Descuento" ? "%" : ""}
                      </span>
                    </td>
                    <td>
                      <div>
                        <span>{row.productos}</span>
                      </div>
                    </td>
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
