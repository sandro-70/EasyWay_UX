import React, { useState, useEffect } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { listarAuditorias, filtrarCantidadMayor, filtrarCantidadMenor } from "../api/auditoriaApi";
import { listarProductosl } from "../api/InventarioApi";
import "./ReportesInventario.css";

export default function ReportesInventario() {
  const [filas, setFilas] = useState([]);
  const [valorInventario, setValorInventario] = useState(0);
  const [filtro, setFiltro] = useState("Todos");
  const [paginaActual, setPaginaActual] = useState(1);
  const filasPorPagina = 8;

  // Traer auditorías según filtro
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

      const total = data.reduce((acc, prod) => {
        const precio = Number(prod.precio_venta || 0);
        return acc + precio;
      }, 0);

      setValorInventario(total);
    } catch (error) {
      console.error("Error al traer valor de inventario:", error);
    }
  };

  useEffect(() => {
    fetchAuditorias();
    fetchValorInventario();
  }, [filtro]);

  // Paginación
  const totalPaginas = Math.ceil(filas.length / filasPorPagina);
  const indiceInicio = (paginaActual - 1) * filasPorPagina;
  const filasFiltradas = filas.slice(indiceInicio, indiceInicio + filasPorPagina);

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
    const handlePage = (p) => {
      if (p < 1 || p > pageCount) return;
      onPage(p);
    };

    return (
      <div className="pedido-pagination">
        <button onClick={() => handlePage(page - 1)} className="pedido-pagination-btn" disabled={page === 1}>
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
        <button onClick={() => handlePage(page + 1)} className="pedido-pagination-btn" disabled={page === pageCount}>
          <Icon.ChevronRight />
        </button>
      </div>
    );
  }

  const StatusBadge = ({ value }) => {
    if (!value) return null; // por si viene null

    // Normalizamos: convertimos el enum a minúsculas
    const val = String(value).toLowerCase();

    let clase = "";
    switch (val) {
      case "activo":
        clase = "estado-activo"; // 👈 directo
        break;
      case "inactivo":
        clase = "estado-inactivo";
        break;
      default:
        clase = "";
    }

    const texto = val.charAt(0).toUpperCase() + val.slice(1);

    return <span className={`estado-badge ${clase}`}>{texto}</span>;
  };

  return (
    <div
      className="px-4 "
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
      </header>
      <div className="divider" />

      <div className="filtros-container">
        <label>Filtro</label>
        <select
          className="font-14px border rounded px-3 py-1 bg-[#E6E6E6]"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        >
          <option>Todos</option>
          <option>Más vendidos</option>
          <option>Menos vendidos</option>
        </select>

        <div className="inventario-count">
          <span>Valor total de inventario: L.</span>
          <span className="count-bubble ml-1">{valorInventario.toLocaleString()}</span>
        </div>
      </div>

      {/* Tabla */}
      <div className="inventario-table-wrap">
        <table className="inventario-table">
          <thead>
            <tr>
              {[
                "ID de producto",
                "Producto",
                "Categoría",
                "Subcategoría",
                "Cantidad",
                "Entrada/Salida",
                "Estado",
              ].map((title, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3 text-white text-center bg-[#2B6DAF] ${
                    idx === 0 ? "rounded-tl-lg" : ""
                  } ${idx === 6 ? "rounded-tr-lg" : ""}`}
                >
                  {title}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filasFiltradas.length > 0 ? (
              filasFiltradas.map((r, idx) => (
                <tr key={idx} className="text-center border-b border-gray-300 last:border-b-0">
                  <td>{r.id_producto}</td>
                  <td>{r.nombre_producto}</td>
                  <td>{r.categoria}</td>
                  <td>{r.subcategoria}</td>
                  <td>{r.cantidad}</td>
                  <td>{r.operacion.toUpperCase()}</td>
                  <td><StatusBadge value={r.estado_producto}/></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-4 text-black text-center">
                  No hay registros de auditoría
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pedido-pagination-wrapper">
        <Pagination
          page={paginaActual}
          pageCount={totalPaginas}
          onPage={setPaginaActual}
        />
      </div>
    </div>
    </div>
  );
}
