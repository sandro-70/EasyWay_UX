import React, { useState } from "react";
import ExcelIcon from "../images/excel.png";
import InfoIcon from "../images/info.png";
import LupaIcon from "../images/lupa.png";
import AbajoIcon from "../images/abajo.png";
import IzqIcon from "../images/izq.png";
import DerIcon from "../images/der.png";
import DetallePedido from "../components/DetallePedido";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./ReportesPedidos.css";

// 📌 Generamos 49 registros de ejemplo
const ordersData = Array.from({ length: 49 }, (_, i) => {
  const id = (i + 1).toString().padStart(3, "0");
  const fechaPedido = new Date(2025, i % 12, (i % 28) + 1);
  const fechaEntrega = new Date(fechaPedido);
  fechaEntrega.setDate(fechaPedido.getDate() + ((i % 5) + 1));

  // Función para formatear fecha a dd/mm/yyyy
  const formatoFecha = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return {
    id,
    estado: i % 2 === 0 ? "En preparación" : "Entregado",
    fechaPedido: formatoFecha(fechaPedido), // fecha completa
    fechaEntrega: formatoFecha(fechaEntrega), // fecha completa
    tiempoPromedio: (i % 5) + 1,
    metodoPago: i % 2 === 0 ? "Tarjeta" : "Efectivo",
  };
});

const ReportesPedidos = () => {
  const [mes, setMes] = useState("");
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const pedidosPorPagina = 8;

  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const pedidosFiltrados = mes
    ? ordersData.filter((order) => {
        const [day, month, year] = order.fechaPedido.split("/");
        return meses[parseInt(month) - 1].toLowerCase() === mes.toLowerCase();
      })
    : ordersData;

  const totalPaginas = Math.ceil(pedidosFiltrados.length / pedidosPorPagina);
  const indiceInicio = (paginaActual - 1) * pedidosPorPagina;
  const indiceFinal = indiceInicio + pedidosPorPagina;
  const pedidosPaginados = pedidosFiltrados.slice(indiceInicio, indiceFinal);

  const exportToExcel = () => {
    const exportData = pedidosFiltrados.map((order) => ({
      "ID de Pedido": order.id,
      Estado: order.estado,
      "Fecha de Pedido": order.fechaPedido,
      "Fecha de Entrega": order.fechaEntrega,
      "Tiempo Promedio de Entrega (días)": order.tiempoPromedio,
      "Método de Pago": order.metodoPago,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      `ReportePedidos_${mes || "Todos"}.xlsx`
    );
  };

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
  };

  function Pagination({ page, pageCount, onPage }) {
    const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
    const handlePage = (p) => {
      if (p < 1 || p > pageCount) return;
      onPage(p);
    };

    return (
      <div className="pedido-pagination">
        <button
          onClick={() => handlePage(page - 1)}
          className="pedido-pagination-btn"
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
          className="pedido-pagination-btn"
          disabled={page === pageCount}
        >
          <Icon.ChevronRight />
        </button>
      </div>
    );
  }
  return (
    <div
      className="content"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
      <div className="content-container">
        <header className="page-header">
          <h1 className="pedido-title"><span>Reportes de Pedidos</span></h1>

          <button onClick={exportToExcel} className="ventas-export-btn">
                📊 Exportar a Excel
          </button>
        </header>
        <div className="divider" />

        {/* Filtros y número de pedidos */}
        <div className="filtros-container">
          <label>Filtrar Mes de Pedido:</label>
          <select
            value={mes}
            onChange={(e) => {
              setMes(e.target.value);
              setPaginaActual(1);
            }}
            className="font-14px border rounded px-3 py-1 bg-[#E6E6E6]"
          >
            <option value="">Todos</option>
            {meses.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <div className="pedido-count">
            <span>Total de pedidos: </span>
            <span className="count-bubble">{pedidosFiltrados.length}</span>
          </div>
        </div>

        {/* Tabla de pedidos */}
        <div className="promocion-table-wrap">
          <table className="promocion-table">
            <thead>
              <tr>
                {/** Encabezados con líneas verticales blancas separadas */}
                {[
                  { title: "ID" }, //icon: LupaIcon
                  { title: "Estado" }, //icon: AbajoIcon
                  { title: "Fecha de\nPedido" },
                  { title: "Fecha de\nEntrega" },
                  { title: "Tiempo promedio\n de entrega (días)" },
                  { title: "Método\n de Pago" },
                ].map((col, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-3 text-white text-center bg-[#2B6DAF] relative"
                  >
                    <div className="flex items-center justify-center">
                      <span className="whitespace-pre-line">{col.title}</span>
                      {col.icon && (
                        <img
                          src={col.icon}
                          alt="icono"
                          className="w-4 h-4 ml-2"
                        />
                      )}
                    </div>
                    <div className="absolute inset-y-0 right-0 w-[1px]"></div>
                  </th>
                ))}
                <th className="px-4 py-3 text-white text-center bg-[#2B6DAF]">
                  Más Información
                </th>
              </tr>
            </thead>

            <tbody>
              {pedidosPaginados.map((order) => (
                <tr
                  key={order.id}
                  className="text-center"
                >
                  <td className="text-center">
                    {order.id}
                  </td>
                  <td className="text-center">
                    {order.estado}
                  </td>
                  <td className="text-center">
                    {order.fechaPedido}
                  </td>
                  <td className="text-center">
                    {order.fechaEntrega}
                  </td>
                  <td className="text-center">
                    {order.tiempoPromedio}
                  </td>
                  <td className="text-center">
                    {order.metodoPago}
                  </td>
                  <td className="text-center">
                    <button
                      className="flex items-center justify-center w-6 h-6 mx-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPedidoSeleccionado(order);
                      }}
                    >
                      <img src={InfoIcon} alt="info" className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {pedidosPaginados.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="py-4 text-black border-black text-center"
                  >
                    No hay pedidos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación centrada con íconos funcionales */}
        <div className="pedido-pagination-wrapper">
          <Pagination
            page={paginaActual}
            pageCount={totalPaginas}
            onPage={setPaginaActual}
          />
        </div>
      </div>

      {pedidoSeleccionado && (
        <DetallePedido
          order={pedidoSeleccionado}
          onClose={() => setPedidoSeleccionado(null)}
        />
      )}
    </div>
  );
};

export default ReportesPedidos;
