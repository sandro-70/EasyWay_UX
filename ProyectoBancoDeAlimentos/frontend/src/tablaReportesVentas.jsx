import "./tablaReportesVentas.css";
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const mockData = [
  {
    id: 1,
    producto: "Arroz",
    categoria: "Granos",
    subcategoria: "Arroz Blanco",
    CantidadVendida: 120,
    precioBase: 1500,
    precioVenta: 1800,
    Descuento: 100,
    Total: 1700,
  },
  {
    id: 2,
    producto: "Frijol",
    categoria: "Granos",
    subcategoria: "Frijol Rojo",
    CantidadVendida: 80,
    precioBase: 2000,
    precioVenta: 2300,
    Descuento: 200,
    Total: 2100,
  },
  {
    id: 3,
    producto: "Aceite",
    categoria: "Aceites",
    subcategoria: "Vegetal",
    CantidadVendida: 50,
    precioBase: 3500,
    precioVenta: 4000,
    Descuento: 300,
    Total: 3700,
  },
  {
    id: 4,
    producto: "Azúcar",
    categoria: "Dulces",
    subcategoria: "Azúcar Morena",
    CantidadVendida: 60,
    precioBase: 1200,
    precioVenta: 1400,
    Descuento: 50,
    Total: 1350,
  },
  {
    id: 5,
    producto: "Sal",
    categoria: "Condimentos",
    subcategoria: "Sal Fina",
    CantidadVendida: 90,
    precioBase: 800,
    precioVenta: 950,
    Descuento: 30,
    Total: 920,
  },
  {
    id: 6,
    producto: "Leche",
    categoria: "Lácteos",
    subcategoria: "Entera",
    CantidadVendida: 110,
    precioBase: 2500,
    precioVenta: 2800,
    Descuento: 150,
    Total: 2650,
  },
  {
    id: 7,
    producto: "Pan",
    categoria: "Panadería",
    subcategoria: "Integral",
    CantidadVendida: 70,
    precioBase: 1000,
    precioVenta: 1200,
    Descuento: 80,
    Total: 1120,
  },
  {
    id: 8,
    producto: "Café",
    categoria: "Bebidas",
    subcategoria: "Molido",
    CantidadVendida: 40,
    precioBase: 3000,
    precioVenta: 3500,
    Descuento: 250,
    Total: 3250,
  },
  {
    id: 9,
    producto: "Jugo",
    categoria: "Bebidas",
    subcategoria: "Naranja",
    CantidadVendida: 100,
    precioBase: 1800,
    precioVenta: 2100,
    Descuento: 120,
    Total: 1980,
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
    <div className="inventario-pagination ">
      <button
        onClick={() => handlePage(page - 1)}
        className="inventario-pagination-btn"
        disabled={page === 1}
        title="Anterior"
      >
        <span>
          <Icon.ChevronLeft />
        </span>
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => handlePage(p)}
          className={`w-9 h-9 rounded-full border border-[#d8dadc] ${
            p === page ? "ring-2 ring-[#d8572f] text-[#d8572f]" : ""
          }`}
          title={`Página ${p}`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => handlePage(page + 1)}
        className="inventario-pagination-btn"
        disabled={page === pageCount}
        title="Siguiente"
      >
        <span>
          <Icon.ChevronRight />
        </span>
      </button>
    </div>
  );
}

function TablaReportesVentas() {
  const [page, setPage] = useState(1);
  const [orderDesc, setOrderDesc] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [appliedFilter, setAppliedFilter] = useState("");

  const itemsPerPage = 6;

  // Ordenar por ID
  const sortedData = [...mockData].sort((a, b) =>
    orderDesc ? b.id - a.id : a.id - b.id
  );

  // Filtrar datos
  const filteredData = appliedFilter
    ? sortedData.filter((item) =>
        item.producto.toLowerCase().includes(appliedFilter.toLowerCase())
      )
    : sortedData;

  const paginatedData = filteredData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData); // Exporta los datos filtrados
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ReporteVentas");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "Reporte_Ventas.xlsx");
  };

  return (
    <div
      className="inventario-container "
      style={{
        position: "absolute",
        top: "145px",
        left: 0,
        right: 0,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h1 className="inventario-title">Tabla de Reportes De Ventas</h1>
      <div className="Button-Back-Inventario">
        <button
          className="Back-Inventario"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          Volver al Inicio 🏠
        </button>
      </div>
      <div className="inventario-filter">
        <div className="inventario-actions">
          <button
            onClick={() => setOrderDesc(!orderDesc)}
            className="inventario-filter-btn"
          >
            Ordenar por ID {orderDesc ? "↓" : "↑"}
          </button>
          <button onClick={exportToExcel} className="inventario-export-btn">
            📊 Exportar a Excel
          </button>
        </div>
      </div>

      <table
        className="inventario-table"
        style={{
          width: "100%",
        }}
      >
        <thead className="inventario-thead">
          <tr>
            <th>ID de Producto</th>
            <th>
              Producto{" "}
              <span
                style={{
                  display: "inline-block",
                  marginLeft: "4px",
                  cursor: "pointer",
                }}
                onClick={() => setShowFilter(true)}
              >
                <Icon.Search />
              </span>
            </th>
            <th>Categoría</th>
            <th>Subcategoría</th>
            <th>Cantidad Vendida</th>
            <th>Precio Base</th>
            <th>Precio Venta</th>
            <th>Descuento</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td
                colSpan={9}
                className="inventario-table-empty"
                style={{ minWidth: "100%", whiteSpace: "nowrap" }}
              >
                <div style={{ width: "100%", textAlign: "center" }}>
                  ⚠ Sin resultados para "{appliedFilter}"
                </div>
              </td>
            </tr>
          ) : (
            paginatedData.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.producto}</td>
                <td>{row.categoria}</td>
                <td>{row.subcategoria}</td>
                <td>{row.CantidadVendida}</td>
                <td>{row.precioBase}</td>
                <td>{row.precioVenta}</td>
                <td>{row.Descuento}</td>
                <td>{row.Total}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="inventario-pagination">
        <Pagination page={page} pageCount={totalPages} onPage={setPage} />
      </div>

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
  );
}

export default TablaReportesVentas;
