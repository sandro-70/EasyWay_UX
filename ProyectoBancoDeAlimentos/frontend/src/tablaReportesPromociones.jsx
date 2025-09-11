import "./tablaReportesPromociones.css";
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const mockData = [
  {
    id: 1,
    nombre: "Promo Arroz",
    tipo: "Descuento",
    categoria: "Granos",
    descuento: 10,
    cuponesUsados: 50,
  },
  {
    id: 2,
    nombre: "Promo Leche",
    tipo: "Monto",
    categoria: "Lácteos",
    descuento: 200,
    cuponesUsados: 30,
  },
  {
    id: 3,
    nombre: "Promo Café",
    tipo: "Descuento",
    categoria: "Bebidas",
    descuento: 15,
    cuponesUsados: 20,
  },
  {
    id: 4,
    nombre: "Promo Azúcar",
    tipo: "Monto",
    categoria: "Dulces",
    descuento: 100,
    cuponesUsados: 15,
  },
  {
    id: 5,
    nombre: "Promo Sal",
    tipo: "Descuento",
    categoria: "Condimentos",
    descuento: 5,
    cuponesUsados: 10,
  },
  {
    id: 6,
    nombre: "Promo Azúcar",
    tipo: "Monto",
    categoria: "Dulces",
    descuento: 100,
    cuponesUsados: 15,
  },
  {
    id: 7,
    nombre: "Promo Azúcar",
    tipo: "Monto",
    categoria: "Dulces",
    descuento: 100,
    cuponesUsados: 15,
  },
  {
    id: 8,
    nombre: "Promo Azúcar",
    tipo: "Monto",
    categoria: "Dulces",
    descuento: 100,
    cuponesUsados: 15,
  },
  {
    id: 9,
    nombre: "Promo Azúcar",
    tipo: "Monto",
    categoria: "Dulces",
    descuento: 100,
    cuponesUsados: 15,
  },
  {
    id: 10,
    nombre: "Promo Azúcar",
    tipo: "Monto",
    categoria: "Dulces",
    descuento: 100,
    cuponesUsados: 15,
  },
  {
    id: 11,
    nombre: "Promo Azúcar",
    tipo: "Monto",
    categoria: "Dulces",
    descuento: 100,
    cuponesUsados: 15,
  },
  {
    id: 12,
    nombre: "Promo Azúcar",
    tipo: "Monto",
    categoria: "Dulces",
    descuento: 100,
    cuponesUsados: 15,
  },
  {
    id: 13,
    nombre: "Promo Azúcar",
    tipo: "Monto",
    categoria: "Dulces",
    descuento: 100,
    cuponesUsados: 15,
  },
  {
    id: 14,
    nombre: "Promo Azúcar",
    tipo: "Monto",
    categoria: "Dulces",
    descuento: 100,
    cuponesUsados: 15,
  },
  {
    id: 15,
    nombre: "Promo Azúcar",
    tipo: "Monto",
    categoria: "Dulces",
    descuento: 100,
    cuponesUsados: 15,
  },
  {
    id: 16,
    nombre: "Promo Azúcar",
    tipo: "Monto",
    categoria: "Dulces",
    descuento: 100,
    cuponesUsados: 15,
  },
];

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
    <div className="inventario-pagination">
      <button
        onClick={() => handlePage(page - 1)}
        className="inventario-pagination-btn"
        disabled={page === 1}
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
        className="inventario-pagination-btn"
        disabled={page === pageCount}
      >
        <Icon.ChevronRight />
      </button>
    </div>
  );
}

function TablaReportesPromociones() {
  const [page, setPage] = useState(1);
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [showCategoria, setShowCategoria] = useState(false);

  const itemsPerPage = 10;

  const filteredData = mockData.filter((item) =>
    categoriaFilter ? item.categoria === categoriaFilter : true
  );

  const paginatedData = filteredData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData, {
      header: [
        "id",
        "nombre",
        "tipo",
        "categoria",
        "descuento",
        "cuponesUsados",
      ],
    });

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [
          "ID Promoción",
          "Nombre Promoción",
          "Tipo",
          "Categoría",
          "Descuento",
          "Cupones Usados",
        ],
      ],
      { origin: "A1" }
    );

    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxLength = 10;
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cellAddress = { c: C, r: R };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        const cell = worksheet[cellRef];
        if (cell && cell.v) {
          maxLength = Math.max(maxLength, cell.v.toString().length + 2);
        }
      }
      if (!worksheet["!cols"]) worksheet["!cols"] = [];
      worksheet["!cols"][C] = { wch: maxLength };
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ReportePromociones");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "Reporte_Promociones.xlsx");
  };

  return (
    <div
      className="inventario-container"
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
      <h1 className="inventario-title">Reporte de Promociones y Descuentos</h1>

      <table className="inventario-table">
        <thead className="inventario-thead">
          <tr>
            <th>ID Promoción</th>
            <th>Nombre Promoción</th>
            <th>Tipo</th>
            <th>
              Categoría{" "}
              <span
                className="categoria-icon"
                onClick={() => setShowCategoria(!showCategoria)}
              >
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
              <td colSpan={6} className="inventario-table-empty">
                ⚠ Sin resultados
              </td>
            </tr>
          ) : (
            paginatedData.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.nombre}</td>
                <td>{row.tipo}</td>
                <td>{row.categoria}</td>
                <td>
                  {row.tipo === "Monto" ? "L." : ""}
                  {row.descuento}
                  {row.tipo === "Descuento" ? "%" : ""}
                </td>

                <td>{row.cuponesUsados}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="inventario-footer">
        <span>Total Promociones: {filteredData.length}</span>
        <button onClick={exportToExcel} className="inventario-export-btn-green">
          📊 Exportar a Excel
        </button>
      </div>

      <div className="inventario-pagination mt-4">
        <Pagination page={page} pageCount={totalPages} onPage={setPage} />
      </div>
    </div>
  );
}

export default TablaReportesPromociones;
