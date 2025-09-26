import React, { useState, useEffect } from "react";
import InfoIcon from "../images/info.png";
import DetallePedido from "../components/DetallePedido";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  getPedidosConDetalles,
  getHistorialComprasProductos,
} from "../api/PedidoApi";
import { getInfoUsuario } from "../api/reporteusuarioApi";
import "./ReportesPedidos.css";

const meses = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

const Icon = {
  ChevronLeft: (props) => (
    <svg viewBox="0 0 24 24" className={"w-6 h-6 " + (props.className||"")}>
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  ChevronRight: (props) => (
    <svg viewBox="0 0 24 24" className={"w-6 h-6 " + (props.className||"")}>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  ),
};

const ReportesPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [mes, setMes] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [estadosDisponibles, setEstadosDisponibles] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [usuariosPorPedido, setUsuariosPorPedido] = useState({});
  const [paginaActual, setPaginaActual] = useState(1);
  const [orderDesc, setOrderDesc] = useState(true);
  const pedidosPorPagina = 8;

  useEffect(() => {
    getPedidosConDetalles()
      .then((res) => {
        const formatted = res.data.map((p) => {
          const fechaPedido = p.fecha_pedido ? new Date(p.fecha_pedido).toLocaleDateString("es-HN") : "-";
          const fechaEntrega = p.fecha_entrega ? new Date(p.fecha_entrega).toLocaleDateString("es-HN") : "-";
          return {
            id: p.id_pedido.toString().padStart(3, "0"),
            idPedido: p.id_pedido,
            estado: p.estado_pedido?.nombre_pedido || "Sin estado",
            fechaPedido,
            fechaEntrega,
            tiempoPromedio: p.tiempo_promedio || "-",
            metodoPago: p.metodo_pago || "",
            detalles: p.factura?.factura_detalles || [],
          };
        });
        setPedidos(formatted);
        const estadosUnicos = [...new Set(formatted.map((p) => p.estado).filter(Boolean))].sort();
        setEstadosDisponibles(estadosUnicos);

        const usuariosPromises = formatted.map((pedido) =>
          getInfoUsuario(pedido.idPedido)
            .then((res) => ({
              idPedido: pedido.idPedido,
              ultimos_cuatro: res.data?.ultimos_cuatro || null,
            }))
            .catch(() => ({ idPedido: pedido.idPedido, ultimos_cuatro: null }))
        );
        Promise.all(usuariosPromises).then((usuariosData) => {
          const map = {};
          usuariosData.forEach((d) => (map[d.idPedido] = d));
          setUsuariosPorPedido(map);
        });
      })
      .catch((err) => console.error("Error al obtener pedidos:", err));
  }, []);

  const formatearMetodoPago = (pedido) => {
    const infoUsuario = usuariosPorPedido[pedido.idPedido];
    return infoUsuario?.ultimos_cuatro ? `${pedido.metodoPago} ****${infoUsuario.ultimos_cuatro}` : pedido.metodoPago;
  };

  const pedidosFiltrados = pedidos.filter((order) => {
    const mesMatch = mes
      ? (() => {
          const [, month] = order.fechaPedido.split("/");
          return meses[parseInt(month) - 1]?.toLowerCase() === mes.toLowerCase();
        })()
      : true;
    const estadoMatch = estadoFilter ? order.estado === estadoFilter : true;
    return mesMatch && estadoMatch;
  });

  const pedidosOrdenados = [...pedidosFiltrados].sort((a, b) => {
    const idA = parseInt(a.id);
    const idB = parseInt(b.id);
    return orderDesc ? idB - idA : idA - idB;
  });

  const totalPaginas = Math.ceil(pedidosOrdenados.length / pedidosPorPagina) || 1;
  const indiceInicio = (paginaActual - 1) * pedidosPorPagina;
  const pedidosPaginados = pedidosOrdenados.slice(indiceInicio, indiceInicio + pedidosPorPagina);

  const computeColWidths = (ws, headers, lastRow) =>
    headers.map((h, c) => {
      let maxLen = String(h).length;
      for (let r = 2; r <= lastRow; r++) {
        const cell = ws[XLSX.utils.encode_cell({ c, r: r - 1 })];
        if (cell && cell.v != null) {
          const str = typeof cell.v === "string" ? cell.v : String(cell.v);
          maxLen = Math.max(maxLen, str.length);
        }
      }
      return { wch: Math.min(Math.max(maxLen + 2, 12), 50) };
    });

const exportToExcel = () => {
  // 👉 Solo la página visible en la tabla
  const rows = pedidosOrdenados.map((order) => ({
    "ID de Pedido": order.id,
    "Estado": order.estado,
    "Fecha de Pedido": order.fechaPedido, // igual que en la tabla (texto es-HN)
  }));

  const headers = ["ID de Pedido", "Estado", "Fecha de Pedido"];

  const ws = XLSX.utils.json_to_sheet([], { skipHeader: true });
  XLSX.utils.sheet_add_aoa(ws, [headers], { origin: "A1" });
  XLSX.utils.sheet_add_json(ws, rows, { origin: "A2", skipHeader: true });

  const lastRow = rows.length + 1;

  ws["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: lastRow - 1, c: headers.length - 1 },
    }),
  };

  // Anchos auto (espaciado cómodo)
  const computeColWidths = (sheet, headers, lastRow) =>
    headers.map((h, c) => {
      let maxLen = String(h).length;
      for (let r = 2; r <= lastRow; r++) {
        const cell = sheet[XLSX.utils.encode_cell({ c, r: r - 1 })];
        if (cell && cell.v != null) {
          const str = typeof cell.v === "string" ? cell.v : String(cell.v);
          maxLen = Math.max(maxLen, str.length);
        }
      }
      return { wch: Math.min(Math.max(maxLen + 2, 12), 50) };
    });
  ws["!cols"] = computeColWidths(ws, headers, lastRow);

  // Encabezado congelado
  ws["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft", state: "frozen" };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pedidos");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });

  // Nombre deja claro que es la página visible
  let nombreArchivo = `Reporte_Pedidos`;
  if (mes) nombreArchivo += `_${mes}`;
  if (estadoFilter) nombreArchivo += `_${estadoFilter.replace(/\s+/g, "")}`;
  nombreArchivo += ".xlsx";

  saveAs(blob, nombreArchivo);
};


function Pagination({ page, pageCount, onPage }) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  const handlePage = (p) => { if (p < 1 || p > pageCount) return; onPage(p); };
  return (
    <div className="pedido-pagination">
      <button onClick={() => handlePage(page - 1)} disabled={page === 1} className="pedido-pagination-btn">
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
      <button onClick={() => handlePage(page + 1)} disabled={page === pageCount} className="pedido-pagination-btn">
        <Icon.ChevronRight />
      </button>
    </div>
  );
}

  return (
    <div className="px-4" style={{ position: "absolute", left: 0, right: 0, width: "100%", display: "flex", flexDirection: "column" }}>
      <div className="content-container">
        <header className="page-header">
          <h1 className="promocion-title"><span>Reportes de Pedidos</span></h1>
          <button onClick={exportToExcel} className="ventas-export-btn">📊 Exportar a Excel</button>
        </header>
        <div className="divider" />

        <div className="filtros-container">
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <label>Filtrar Mes de Pedido:</label>
              <select
                value={mes}
                onChange={(e) => { setMes(e.target.value); setPaginaActual(1); }}
                className="font-14px border rounded px-3 py-1 bg-[#E6E6E6]"
              >
                <option value="">Todos</option>
                {meses.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <label>Filtrar por Estado:</label>
              <select
                value={estadoFilter}
                onChange={(e) => { setEstadoFilter(e.target.value); setPaginaActual(1); }}
                className="font-14px border rounded px-3 py-1 bg-[#E6E6E6]"
              >
                <option value="">Todos los estados</option>
                {estadosDisponibles.map((estado) => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </div>

            {(mes || estadoFilter) && (
              <button
                onClick={() => { setMes(""); setEstadoFilter(""); setPaginaActual(1); }}
                style={{ padding: "0.5rem 0.75rem", backgroundColor: "#b6adadff", border: "2px solid #c0a8a8ff", borderRadius: "6px", fontSize: "0.75rem", color: "white", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap", display: "flex", gap: "0.25rem", alignItems: "center", fontWeight: "500" }}
              >
                ✕ Limpiar filtros
              </button>
            )}
          </div>

          <div className="pedido-count">
            <span>Total de pedidos: </span>
            <span className="count-bubble">{pedidosOrdenados.length}</span>
          </div>
        </div>

        <div className="promocion-table-wrap">
          <table className="promocion-table">
            <thead>
              <tr>
                <th
                  className="px-4 py-3 text-white text-center bg-[#2B6DAF] cursor-pointer hover:bg-[#1e5a9a] transition-colors"
                  onClick={() => { setOrderDesc(!orderDesc); setPaginaActual(1); }}
                  title="Ordenar por ID"
                >
                  ID de Pedido {orderDesc ? "↓" : "↑"}
                </th>
                {["Estado", "Fecha de Pedido", "Más Información"].map((col) => (
                  <th key={col} className="px-4 py-3 text-white text-center bg-[#2B6DAF]">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pedidosPaginados.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.estado}</td>
                  <td>{order.fechaPedido}</td>
                  <td>
                    <button className="flex items-center justify-center w-6 h-6 mx-auto" onClick={(e) => { e.stopPropagation(); setPedidoSeleccionado(order); }}>
                      <img src={InfoIcon} alt="info" className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {pedidosPaginados.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-4 text-black border-black text-center">
                    {mes || estadoFilter ? (
                      <div>
                        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔍</div>
                        <div style={{ fontWeight: "600", marginBottom: "0.5rem" }}>No se encontraron pedidos</div>
                        <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1rem" }}>
                          {mes && <div>• Mes: "{mes}"</div>}
                          {estadoFilter && <div>• Estado: "{estadoFilter}"</div>}
                        </div>
                        <div style={{ fontSize: "0.875rem" }}>Intenta ajustar los filtros de búsqueda</div>
                      </div>
                    ) : "No hay pedidos"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pedido-pagination-wrapper">
          <Pagination page={paginaActual} pageCount={totalPaginas} onPage={setPaginaActual} />
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
