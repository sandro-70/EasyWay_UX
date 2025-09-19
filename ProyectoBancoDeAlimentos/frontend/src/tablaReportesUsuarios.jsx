import "./tablaReportesUsuarios.css";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// ======= Mock Data =======
const mockUsuarios = [
  {
    id: 1,
    nombre: "Juan Pérez",
    estado: "Activo",
    productoEstrella: "Arroz Premium",
    cantidadCompras: 12,
    totalComprado: 3500,
  },
  {
    id: 2,
    nombre: "María López",
    estado: "Inactivo",
    productoEstrella: "Leche Entera",
    cantidadCompras: 5,
    totalComprado: 1200,
  },
  {
    id: 3,
    nombre: "Carlos Rodríguez",
    estado: "Activo",
    productoEstrella: "Aceite de Oliva",
    cantidadCompras: 20,
    totalComprado: 8700,
  },
  {
    id: 4,
    nombre: "Ana Torres",
    estado: "Activo",
    productoEstrella: "Azúcar Refinada",
    cantidadCompras: 8,
    totalComprado: 2100,
  },
  {
    id: 5,
    nombre: "Luis Fernández",
    estado: "Inactivo",
    productoEstrella: "Harina de Trigo",
    cantidadCompras: 3,
    totalComprado: 750,
  },
];

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
    <div className="usuario-pagination">
      <button
        onClick={() => handlePage(page - 1)}
        className="usuario-pagination-btn"
        disabled={page === 1}
        title="Anterior"
      >
        <Icon.ChevronLeft />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => handlePage(p)}
          className={`usuario-page-btn ${
            p === page ? "usuario-page-btn-active" : ""
          }`}
          title={`Página ${p}`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => handlePage(page + 1)}
        className="usuario-pagination-btn"
        disabled={page === pageCount}
        title="Siguiente"
      >
        <Icon.ChevronRight />
      </button>
    </div>
  );
}

function TablaReportesUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [appliedFilter, setAppliedFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("Todos");
  const [orderDesc, setOrderDesc] = useState(true);

  const itemsPerPage = 8;

  // Traer los datos (mock)
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const formatted = mockUsuarios.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        estado: u.estado,
        productoEstrella: u.productoEstrella,
        cantidadCompras: u.cantidadCompras,
        totalComprado: u.totalComprado,
      }));
      setUsuarios(formatted);
      setLoading(false);
    }, 500);
  }, []);

  // Ordenar
  const sortedData = [...usuarios].sort((a, b) =>
    orderDesc ? b.id - a.id : a.id - b.id
  );

  // Filtrar
  const filteredData = sortedData.filter((item) => {
    const matchesNombre = appliedFilter
      ? item.nombre.toLowerCase().includes(appliedFilter.toLowerCase())
      : true;

    const matchesEstado =
      estadoFilter === "Todos" ? true : item.estado === estadoFilter;

    return matchesNombre && matchesEstado;
  });

  // Paginación
  const paginatedData = filteredData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

  // Exportar Excel
  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(usuarios);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");
    const excelBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(blob, "Reporte_Usuarios.xlsx");
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
      <div className="usuario-container" style={{ maxWidth: "1200px" }}>
        <header className="page-header">
          <h1 className="usuario-title">Reportes De Usuarios</h1>
          <button onClick={handleExportExcel} className="usuario-export-btn">
            📊 Exportar a Excel
          </button>
        </header>
        <div className="divider" />
        <div className="usuario-toolbar">
          <div className="usuario-count">
            <span>Total Usuarios (Clientes): </span>
            <span className="count-bubble">{filteredData.length}</span>
          </div>

          {/* Filtro por estado */}
          <div className="usuario-filtros">
            <label htmlFor="estadoFilter">Filtrar por estado:</label>
            <select
              id="estadoFilter"
              value={estadoFilter}
              onChange={(e) => {
                setEstadoFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="Todos">Todos</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="usuario-loading">Cargando...</div>
        ) : (
          <div className="usuario-table-wrap">
            <table className="usuario-table">
              <thead className="usuario-thead">
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
                        className="usuario-search-icon ml-1 cursor-pointer"
                        onClick={() => setShowFilter(true)}
                        title="Filtrar usuario"
                      >
                        <Icon.Search />
                      </span>
                    </div>
                  </th>
                  <th>Estado</th>
                  <th>Producto Estrella</th>
                  <th>Cantidad de Compras</th>
                  <th>Total Comprado</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="usuario-table-empty">
                      ⚠ Sin resultados para "{appliedFilter}"
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.nombre}</td>
                      <td>
                        <span
                          style={{
                            backgroundColor:
                              row.estado === "Activo"
                                ? "rgba(0, 200, 0, 0.15)"
                                : "rgba(200, 0, 0, 0.15)",
                            color: row.estado === "Activo" ? "green" : "red",
                            padding: "4px 8px",
                            borderRadius: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          {row.estado}
                        </span>
                      </td>
                      <td>{row.productoEstrella}</td>
                      <td>{row.cantidadCompras}</td>
                      <td>L. {row.totalComprado}</td>
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
              <h3>Filtrar por nombre</h3>
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

export default TablaReportesUsuarios;