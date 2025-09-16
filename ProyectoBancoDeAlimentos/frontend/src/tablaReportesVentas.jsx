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
    <div className="ventas-pagination">
      <button
        onClick={() => handlePage(page - 1)}
        className="ventas-pagination-btn"
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
        <span>
          <Icon.ChevronRight />
        </span>
      </button>
    </div>
  );
}

function TablaReportesVentas() {
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [appliedFilter, setAppliedFilter] = useState("");
  const [orderDesc, setOrderDesc] = useState(true);

  const itemsPerPage = 8;

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
    // Crear la hoja a partir de los datos
    const worksheet = XLSX.utils.json_to_sheet(filteredData);

    // Aplicar negrita a los encabezados
    const headerRange = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
        font: { bold: true },
        alignment: { horizontal: "center" },
      };
    }

    // Ajustar ancho de columnas automáticamente
    const cols = [];
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      let maxLength = 10; // ancho mínimo
      for (let R = headerRange.s.r; R <= headerRange.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellAddress];
        if (cell && cell.v) {
          const cellLength = cell.v.toString().length;
          if (cellLength > maxLength) maxLength = cellLength;
        }
      }
      cols.push({ wch: maxLength + 2 }); // +2 para margen
    }
    worksheet["!cols"] = cols;

    // Crear libro y agregar hoja
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ReporteVentas");

    // Generar archivo Excel
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "Reporte_Ventas.xlsx");
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
          <button onClick={exportToExcel} className="ventas-export-btn">
              📊 Exportar a Excel
          </button>
        </header>
        <div className="divider" />
        <div className="ventas-table-wrap">
        <table className="ventas-table">
          <thead className="ventas-thead">
            <tr>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => setOrderDesc(!orderDesc)}
                title="Ordenar por ID"
              >
                ID de Producto {orderDesc ? "↓" : "↑"}
              </th>
              <th>
                <div className="flex items-center justify-center">
                  <span>Producto</span>
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
                <td colSpan={9} className="ventas-table-empty">
                  ⚠ Sin resultados para "{appliedFilter}"
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
        </div>

        {/* Botón Excel */}
        <div
          className="ventas-footer"
          style={{ textAlign: "right", marginTop: "10px" }}
        ></div>

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
