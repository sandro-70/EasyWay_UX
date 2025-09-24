import React, { useState, useEffect } from "react";

import { getInfoUsuario } from "../api/reporteusuarioApi.js";
import { getPedidosConDetalles } from "../api/PedidoApi.js";

const DetallePedido = ({ order, onClose }) => {
  const [infoUsuario, setInfoUsuario] = useState(null);
  const [detallesPedido, setDetallesPedido] = useState([]);

  useEffect(() => {
    if (!order) return;
    // obtener info del usuario usando el id del pedido
    const fetchUsuarioInfo = async () => {
      try {
        const userInfoResponse = await getInfoUsuario(order.id);
        setInfoUsuario(userInfoResponse.data);
      } catch (error) {
        console.error("Error al obtener la información del usuario:", error);
      }
    };

    // obtener detalles del pedido
    const fetchPedidoDetalles = async () => {
      try {
        const response = await getPedidosConDetalles();
        // Filtrar para encontrar el pedido específico
        const pedidoEspecifico = response.data.find(
          (p) => p.id_pedido === order.id
        );
        if (pedidoEspecifico) {
          setDetallesPedido(pedidoEspecifico);
        }
      } catch (error) {
        console.error("Error al obtener los detalles del pedido:", error);
      }
    };

    fetchUsuarioInfo();
    fetchPedidoDetalles();
  }, [order]);

  if (!order) return null;

  return (
    <div className="fixed inset-0 flex items-start justify-center pt-48 bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg w-[400px] p-0 relative shadow-lg">
        {/* Encabezado */}
        <div className="flex justify-between items-center bg-[#2B6DAF] p-3 rounded-t w-full">
          <h2 className="text-white font-bold text-base flex-1">
            Detalle de Pedido
          </h2>
          <button className="text-white font-bold text-lg" onClick={onClose}>
            X
          </button>
        </div>

        {/* Contenido */}
        <div className="p-3 grid grid-cols-2 gap-2 mt-2">
          {/* ID del Pedido */}
          <div>
            <label className="block text-sm font-medium mb-1 text-left">
              ID del Pedido
            </label>
            <input
              className="p-1 rounded w-full text-sm text-left border"
              style={{ borderColor: "#80838A", backgroundColor: "#F5F5F5" }}
              value={order.id}
              readOnly
            />
          </div>

          {/* Nombre del Cliente */}
          <div>
            <label className="block text-sm font-medium mb-1 text-left">
              Nombre Cliente
            </label>
            <input
              className="p-1 rounded w-full text-sm text-left border"
              style={{ borderColor: "#80838A", backgroundColor: "#F5F5F5" }}
              value={
                infoUsuario
                  ? `${infoUsuario.nombre} ${infoUsuario.apellido}`
                  : order.nombreCliente
              }
              readOnly
            />
          </div>

          {/* Metodo de pago */}
          <div>
            <label className="block text-sm font-medium mb-1 text-left">
              Método de Pago
            </label>
            <input
              className="p-1 rounded w-full text-sm text-left border"
              style={{ borderColor: "#80838A", backgroundColor: "#F5F5F5" }}
              value={
                infoUsuario && infoUsuario.ultimos_cuatro
                  ? `****${infoUsuario.ultimos_cuatro}`
                  : "No disponible"
              }
              readOnly
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium mb-1 text-left">
              Estado
            </label>
            <input
              className="p-1 rounded w-full text-sm text-left border"
              style={{ borderColor: "#80838A", backgroundColor: "#F5F5F5" }}
              value={order.estado}
              readOnly
            />
          </div>

          {/* Fecha de Pedido */}
          <div>
            <label className="block text-sm font-medium mb-1 text-left">
              Fecha de Pedido
            </label>
            <input
              className="p-1 rounded w-full text-sm text-left border"
              style={{ borderColor: "#80838A", backgroundColor: "#F5F5F5" }}
              value={order.fechaPedido}
              readOnly
            />
          </div>

          {/* Fecha de Entrega */}
          <div>
            <label className="block text-sm font-medium mb-1 text-left">
              Frecuencia de Compra
            </label>
            <input
              className="p-1 rounded w-full text-sm text-left border"
              style={{ borderColor: "#80838A", backgroundColor: "#F5F5F5" }}
              value={order.frecuenciaCompra}
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetallePedido;
