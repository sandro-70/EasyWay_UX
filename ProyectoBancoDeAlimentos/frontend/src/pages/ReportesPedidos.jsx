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
  const pedidosPorPagina = 7;

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
      <div className="w-full max-w-6xl mt-7 mb-10">
        <h1 className="border-b-4 border-[#f0833e] text-[#f0833e] font-bold text-[30px] mb-4 text-left ml-10">
          Reportes de Pedidos
        </h1>

        {/* Filtros y número de pedidos */}
        <div className="flex items-center mb-4 flex-wrap w-full">
          <div className="flex items-center space-x-2 ml-11">
            <label className="font-medium">Filtrar Mes de Pedido:</label>
            <select
              value={mes}
              onChange={(e) => {
                setMes(e.target.value);
                setPaginaActual(1);
              }}
              className="border rounded px-3 py-1 bg-[#E6E6E6]"
            >
              <option value="">Todos</option>
              {meses.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2 ml-6 font-medium">
            <span>N° de pedidos:</span>
            <div className="w-8 h-8 rounded-full bg-[#2B6DAF] text-white flex items-center justify-center">
              {pedidosFiltrados.length}
            </div>
          </div>
        </div>

        {/* Tabla de pedidos */}
        <div className="w-full flex items-center justify-between">
          <button
            className="p-2 disabled:opacity-50"
            onClick={(e) => {
              e.stopPropagation();
              setPaginaActual((prev) => Math.max(prev - 1, 1));
            }}
            disabled={paginaActual === 1}
          >
            <ChevronLeft size={28} className="text-[#2B6DAF]" />
          </button>

          <div className="w-full overflow-x-auto">
            <table
              className="table-auto w-full border border-black rounded-lg border-separate"
              style={{ borderSpacing: "0" }}
            >
              <thead>
                <tr>
                  {/** Encabezados con líneas verticales blancas separadas */}
                  {[
                    { title: "ID de\nPedido" }, //icon: LupaIcon
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
                      <div className="absolute inset-y-0 right-0 w-[1px] bg-white"></div>
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
                    className="border-b border-black text-center"
                  >
                    <td className="px-4 py-2 border-black text-center">
                      {order.id}
                    </td>
                    <td className="px-4 py-2 border-black text-center">
                      {order.estado}
                    </td>
                    <td className="px-4 py-2 border-black text-center">
                      {order.fechaPedido}
                    </td>
                    <td className="px-4 py-2 border-black text-center">
                      {order.fechaEntrega}
                    </td>
                    <td className="px-4 py-2 border-black text-center">
                      {order.tiempoPromedio}
                    </td>
                    <td className="px-4 py-2 border-black text-center">
                      {order.metodoPago}
                    </td>
                    <td className="px-4 py-2 border-black text-center">
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

          <button
            className="p-2 disabled:opacity-50"
            onClick={() =>
              setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))
            }
            disabled={paginaActual === totalPaginas || totalPaginas === 0}
          >
            <ChevronRight size={28} className="text-[#2B6DAF]" />
          </button>
        </div>

        {/* Paginación centrada con íconos funcionales */}
        <div className="flex flex-col items-center mt-4 w-full reportes-pagination-wrapper">
          <div className="flex justify-center items-center space-x-3 mb-3 reportes-pagination">
            {Array.from({ length: totalPaginas }, (_, i) => {
              const page = i + 1;
              return (
                <React.Fragment key={page}>
                  {/* Genera un desbordamiento
                  {page === 1 && (
                    <img
                      src={IzqIcon}
                      alt="izq"
                      className="page-arrow-icon mr-2 cursor-pointer"
                      onClick={() =>
                        setPaginaActual((prev) => Math.max(prev - 1, 1))
                      }
                    />
                  )}
                  */}

                  <button
                    onClick={() => setPaginaActual(page)}
                    className={`page-number-btn flex items-center justify-center rounded-full border px-2 py-1 text-sm select-none 
                      ${page === paginaActual ? "active-page" : "inactive-page"}
                    `}
                  >
                    {page}
                  </button>

                  {/* Genera un desbordamiento 
                  {page === totalPaginas && (
                    <img
                      src={DerIcon}
                      alt="der"
                      className="page-arrow-icon ml-2 cursor-pointer"
                      onClick={() =>
                        setPaginaActual((prev) =>
                          Math.min(prev + 1, totalPaginas)
                        )
                      }
                    />
                    
                  )}
                    */}
                </React.Fragment>
              );
            })}
          </div>

          {/* Botón exportar alineado debajo de la tabla */}
          <div className="w-full flex justify-end mt-2 pr-6 reportes-export-wrapper">
            <button
              onClick={exportToExcel}
              className="bg-[#009900] text-white px-4 py-2 rounded flex items-center space-x-2"
            >
              <img src={ExcelIcon} alt="Excel" className="w-5 h-5" />
              <span>EXPORTAR</span>
            </button>
          </div>
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
