import React, { useState, useEffect } from "react";
import ExcelIcon from "../images/excel.png";
import InfoIcon from "../images/info.png";
import DetallePedido from "../components/DetallePedido";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getPedidosConDetalles } from "../api/PedidoApi";
import "./ReportesPedidos.css";

const meses = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

const ReportesPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [mes, setMes] = useState("");
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const pedidosPorPagina = 8;

  useEffect(() => {
    getPedidosConDetalles()
      .then((res) => {
        const formatted = res.data.map((p) => {
          // Formatear fecha de pedido
          const fechaPedido = p.fecha_pedido
            ? new Date(p.fecha_pedido).toLocaleDateString("es-HN")
            : "-";
          const fechaEntrega = p.fecha_entrega
            ? new Date(p.fecha_entrega).toLocaleDateString("es-HN")
            : "-";

          return {
            id: p.id_pedido.toString().padStart(3, "0"),
            estado: p.estado_pedido?.nombre_pedido || "Sin estado",
            fechaPedido,
            fechaEntrega,
            tiempoPromedio: p.tiempo_promedio || "-",
            metodoPago: p.metodo_pago || "-",
            detalles: p.factura?.factura_detalles || [],
          };
        });
        setPedidos(formatted);
      })
      .catch((err) => console.error("Error al obtener pedidos:", err));
  }, []);

  // Filtrado por mes
  const pedidosFiltrados = mes
    ? pedidos.filter((order) => {
        const [day, month, year] = order.fechaPedido.split("/");
        return meses[parseInt(month) - 1].toLowerCase() === mes.toLowerCase();
      })
    : pedidos;

  // Paginación
  const totalPaginas = Math.ceil(pedidosFiltrados.length / pedidosPorPagina);
  const indiceInicio = (paginaActual - 1) * pedidosPorPagina;
  const indiceFinal = indiceInicio + pedidosPorPagina;
  const pedidosPaginados = pedidosFiltrados.slice(indiceInicio, indiceFinal);

  // Exportar a Excel
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

  // Componente de Paginación
  const Pagination = ({ page, pageCount, onPage }) => {
    const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
    const handlePage = (p) => {
      if (p < 1 || p > pageCount) return;
      onPage(p);
    };
    return (
      <div className="pedido-pagination">
        <button onClick={() => handlePage(page - 1)} disabled={page === 1}>{"<"}</button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => handlePage(p)}
            className={p === page ? "active-page" : ""}
          >
            {p}
          </button>
        ))}
        <button onClick={() => handlePage(page + 1)} disabled={page === pageCount}>{">"}</button>
      </div>
    );
  };

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

        {/* Filtros */}
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

        {/* Tabla */}
        <div className="promocion-table-wrap">
          <table className="promocion-table">
            <thead>
              <tr>
                {["ID","Estado","Fecha de Pedido","Fecha de Entrega","Tiempo promedio de entrega (días)","Método de Pago","Más Información"]
                  .map((col, idx) => (
                  <th key={idx} className="px-4 py-3 text-white text-center bg-[#2B6DAF]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pedidosPaginados.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.estado}</td>
                  <td>{order.fechaPedido}</td>
                  <td>{order.fechaEntrega}</td>
                  <td>{order.tiempoPromedio}</td>
                  <td>{order.metodoPago}</td>
                  <td>
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
                  <td colSpan="7" className="py-4 text-black border-black text-center">
                    No hay pedidos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="pedido-pagination-wrapper">
          <Pagination
            page={paginaActual}
            pageCount={totalPaginas}
            onPage={setPaginaActual}
          />
        </div>
      </div>

      {/* Detalle del pedido */}
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
