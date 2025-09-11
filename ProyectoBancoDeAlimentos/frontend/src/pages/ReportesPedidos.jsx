import React, { useState } from "react";
import ExcelIcon from "../images/excel.png";
import InfoIcon from "../images/info.png";
import LupaIcon from "../images/lupa.png";
import AbajoIcon from "../images/abajo.png";
import DetallePedido from "../components/DetallePedido";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


const ordersData = [
  { id: "001", estado: "En preparación", fechaPedido: "4/7/2025", fechaEntrega: "8/7/2025", tiempoPromedio: 4, metodoPago: "Tarjeta" },
  { id: "002", estado: "En preparación", fechaPedido: "4/7/2025", fechaEntrega: "8/7/2025", tiempoPromedio: 4, metodoPago: "Tarjeta" },
  { id: "003", estado: "En preparación", fechaPedido: "4/7/2025", fechaEntrega: "8/7/2025", tiempoPromedio: 4, metodoPago: "Tarjeta" },
  { id: "004", estado: "En preparación", fechaPedido: "4/7/2025", fechaEntrega: "8/7/2025", tiempoPromedio: 4, metodoPago: "Tarjeta" },
  { id: "005", estado: "En preparación", fechaPedido: "4/7/2025", fechaEntrega: "8/7/2025", tiempoPromedio: 4, metodoPago: "Tarjeta" },
  { id: "006", estado: "En preparación", fechaPedido: "4/7/2025", fechaEntrega: "8/7/2025", tiempoPromedio: 4, metodoPago: "Tarjeta" },
  { id: "007", estado: "En preparación", fechaPedido: "4/7/2025", fechaEntrega: "8/7/2025", tiempoPromedio: 4, metodoPago: "Tarjeta" },
];

const ReportesPedidos = () => {
  const [mes, setMes] = useState("Enero");
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null); // <--- Estado para DetallePedido

  // Función para exportar Excel
  const exportToExcel = () => {
    const exportData = ordersData.map(order => ({
      "ID de Pedido": order.id,
      "Estado": order.estado,
      "Fecha de Pedido": order.fechaPedido,
      "Fecha de Entrega": order.fechaEntrega,
      "Tiempo Promedio de Entrega (días)": order.tiempoPromedio,
      "Método de Pago": order.metodoPago
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `ReportePedidos_${mes}.xlsx`);
  };

  return (
    <div className="w-screen min-h-screen bg-white p-6 flex justify-center">
      <div className="w-full max-w-[1200px]">
        {/* Título */}
        <h1 className="text-2xl font-semibold text-orange-400 mb-4 border-b border-orange-400 pb-2 text-left">
          Reportes de Pedidos
        </h1>

        {/* Filtros y N° de pedidos */}
        <div className="flex items-center mb-4 flex-wrap">
          <div className="flex items-center space-x-2">
            <label className="font-medium">Filtrar Mes de Pedido:</label>
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="border rounded px-3 py-1 bg-[#E6E6E6]"
            >
              {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 ml-6 font-medium">
            <span>N° de pedidos:</span>
            <div className="w-8 h-8 rounded-full bg-[#2B6DAF] text-white flex items-center justify-center">
              12
            </div>
          </div>
        </div>

        {/* Tabla de pedidos */}
        <div className="w-full overflow-x-auto">
          <table className="table-auto w-full border border-gray-300 rounded border-collapse">
            <thead>
              <tr>
                <th className="px-4 py-3 text-white text-left" style={{ backgroundColor: "#2B6DAF" }}>
                  <div className="flex items-center">
                    <span>ID de<br />Pedido</span>
                    <img src={LupaIcon} alt="lupa" className="w-4 h-4 ml-2"/>
                  </div>
                </th>
                <th className="px-4 py-3 text-white text-left" style={{ backgroundColor: "#2B6DAF" }}>
                  <div className="flex items-center">
                    <span>Estado</span>
                    <img src={AbajoIcon} alt="abajo" className="w-4 h-4 ml-2"/>
                  </div>
                </th>
                <th className="px-4 py-3 text-white text-left" style={{ backgroundColor: "#2B6DAF" }}>
                  Fecha de<br />Pedido
                </th>
                <th className="px-4 py-3 text-white text-left" style={{ backgroundColor: "#2B6DAF" }}>
                  Fecha de<br />Entrega
                </th>
                <th className="px-4 py-3 text-white text-left" style={{ backgroundColor: "#2B6DAF" }}>
                  Tiempo promedio<br />de entrega(días)
                </th>
                <th className="px-4 py-3 text-white text-left" style={{ backgroundColor: "#2B6DAF" }}>
                  Método<br />de Pago
                </th>
                <th className="px-4 py-3 text-white text-left" style={{ backgroundColor: "#2B6DAF" }}>
                  Más<br />Información
                </th>
              </tr>
            </thead>
            <tbody>
              {ordersData.map((order) => (
                <tr key={order.id} className="text-center border-b">
                  <td className="px-4 py-2 text-left">{order.id}</td>
                  <td className="px-4 py-2 text-left">{order.estado}</td>
                  <td className="px-4 py-2 text-left">{order.fechaPedido}</td>
                  <td className="px-4 py-2 text-left">{order.fechaEntrega}</td>
                  <td className="px-4 py-2 text-left">{order.tiempoPromedio}</td>
                  <td className="px-4 py-2 text-left">{order.metodoPago}</td>
                  <td className="px-4 py-2">
                    <button
                      className="flex items-center justify-center w-6 h-6"
                      onClick={() => setPedidoSeleccionado(order)} // <--- Abrir detalle
                    >
                      <img src={InfoIcon} alt="info" className="w-4 h-4"/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación y exportar */}
        <div className="flex items-center justify-between mt-4 flex-wrap">
          <div className="flex items-center space-x-2 mb-2 md:mb-0">
            {[1, 2, 3, 4].map((page) => (
              <button
                key={page}
                className="px-3 py-1 border rounded-full border-gray-300"
              >
                {page}
              </button>
            ))}
            <span className="px-2">...</span>
            <button
              className="px-3 py-1 border rounded-full border-orange-400 text-orange-400 bg-white"
            >
              7
            </button>
          </div>

          <button
            onClick={exportToExcel}
            className="bg-[#009900] text-white px-4 py-1 rounded flex items-center space-x-2"
          >
            <img src={ExcelIcon} alt="Excel" className="w-5 h-5" />
            <span>EXPORTAR</span>
          </button>
        </div>
      </div>

      {/* Componente DetallePedido */}
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