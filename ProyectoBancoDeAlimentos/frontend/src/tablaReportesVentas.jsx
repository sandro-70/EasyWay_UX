import "./tablaReportesVentas.css";
import React, { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import {
  getVentasConFiltros,
  exportVentasExcel,
} from "./api/reporteusuarioApi";
// 👇 añade esta import
import * as XLSX from "xlsx";

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
  const [showFilter, setShowFilter] = useState(null); // null | 'producto' | 'categoria' | 'sucursal'
  const [filterText, setFilterText] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    producto: "",
    categoria: "",
  });
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
          categoria: v.categoria || "-",
          sucursal: v.sucursal || "Sucursal no definida",
          cantidad: v.total_vendido,
          precioVenta: v.producto.precio_base,
          total: v.total_vendido * v.producto.precio_base,
          // ✅ Extraer fecha directamente desde la API
          fecha: v.ultima_fecha_venta ? new Date(v.ultima_fecha_venta) : null,
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
    const matchProducto = appliedFilters.producto
      ? item.producto.toLowerCase().includes(appliedFilters.producto.toLowerCase())
      : true;
    const matchCategoria = appliedFilters.categoria
      ? item.categoria.toLowerCase().includes(appliedFilters.categoria.toLowerCase())
      : true;

    let matchTrimestre = true;
    if (trimestre && item.fecha) {
      const mes = item.fecha.getMonth() + 1;
      const trimestreCalculado = Math.ceil(mes / 3);
      matchTrimestre = trimestreCalculado === parseInt(trimestre);
    }

    return matchProducto && matchCategoria && matchTrimestre;
  });

  // Paginación
  const paginatedData = filteredData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

const handleExportExcel = () => {
  // Exporta lo visible (página actual). Cambia a `filteredData` si quieres todo lo filtrado.
  // const dataToExport = filteredData;
  const dataToExport = filteredData;

  // ✅ Mismos campos/orden que la tabla y FECHA como se ve en la tabla (texto es-HN)
  const rows = dataToExport.map((row) => ({
    ID: row.id,
    Nombre: row.producto,
    Categoría: row.categoria,
    Cantidad: row.cantidad,
    "Precio Venta": row.precioVenta,
    "Total Vendido": row.total,
    // 👇 FECHA EXACTA COMO EN LA TABLA (texto)
    Fecha: row.fecha ? row.fecha.toLocaleDateString("es-HN") : "-",
  }));

  const ws = XLSX.utils.json_to_sheet(rows, { origin: "A1" });

  const headers = [
    "ID",
    "Nombre",
    "Categoría",
    "Cantidad",
    "Precio Venta",
    "Total Vendido",
    "Fecha",
  ];
  XLSX.utils.sheet_add_aoa(ws, [headers], { origin: "A1" });

  // Autofiltro A1:G{n}
  const lastRow = rows.length + 1;
  ws["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: lastRow - 1, c: headers.length - 1 },
    }),
  };

  // Formato numérico para moneda (E y F). La fecha queda como TEXTO (igual que la tabla).
  for (let r = 2; r <= lastRow; r++) {
    const precioCell = ws[`E${r}`];
    if (precioCell && typeof precioCell.v === "number") {
      precioCell.t = "n";
      precioCell.z = '"L." #,##0.00';
    }
    const totalCell = ws[`F${r}`];
    if (totalCell && typeof totalCell.v === "number") {
      totalCell.t = "n";
      totalCell.z = '"L." #,##0.00';
    }
    // ❌ Quitamos la conversión de Fecha a serial de Excel (columna G).
  }

  // Auto-anchos
  const computeColWidths = (ws, headers, lastRow) => {
    const colWidths = headers.map((h, c) => {
      let maxLen = String(h).length;
      for (let r = 2; r <= lastRow; r++) {
        const cell = ws[XLSX.utils.encode_cell({ c, r: r - 1 })];
        if (cell && cell.v != null) {
          const str = typeof cell.v === "string" ? cell.v : String(cell.v);
          maxLen = Math.max(maxLen, str.length);
        }
      }
      return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
    });
    return colWidths;
  };
  ws["!cols"] = computeColWidths(ws, headers, lastRow);

  // Congelar encabezado
  ws["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft", state: "frozen" };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reporte de Ventas");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });
  saveAs(blob, "Reporte_Ventas.xlsx");
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
                        onClick={() => setShowFilter("producto")}
                        title="Filtrar producto"
                      >
                        <Icon.Search />
                      </span>
                    </div>
                  </th>
                  <th>
                    <div className="flex items-center justify-center">
                      <span>Categoría</span>
                      <span
                        className="ventas-search-icon ml-1 cursor-pointer"
                        onClick={() => setShowFilter("categoria")}
                        title="Filtrar categoría"
                      >
                        <Icon.Search />
                      </span>
                    </div>
                  </th>
                  <th>Cantidad</th>
                  <th>Precio Venta</th>
                  <th>Total Vendido</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="ventas-table-empty">
                      ⚠ Sin resultados
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.producto}</td>
                      <td>{row.categoria}</td>
                      <td>{row.cantidad}</td>
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
                    setAppliedFilters({
                      ...appliedFilters,
                      [showFilter]: filterText,
                    });
                    setShowFilter(null);
                    setFilterText("");
                    setPage(1);
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
};

export default TablaReportesVentas;