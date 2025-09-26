import React, { useState, useEffect } from "react";

import { getInfoUsuario } from "../api/reporteusuarioApi.js";
import { getPedidosConDetalles } from "../api/PedidoApi.js";

const DetallePedido = ({ order, onClose }) => {
  const [infoUsuario, setInfoUsuario] = useState(null);
  const [detallesPedido, setDetallesPedido] = useState(null);

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

        console.log("Detalles de todos los pedidos en modal:", response.data);
        console.log("ID del pedido que estamos buscando:", order.id);

        // Filtrar para encontrar el pedido específico
        const pedidoEspecifico = response.data.find(
          (p) =>
            p.id_pedido === order.id ||
            p.id_pedido === parseInt(order.id) ||
            p.id_pedido.toString() === order.id.toString()
        );

        console.log("Pedido específico encontrado:", pedidoEspecifico);

        if (pedidoEspecifico) {
          setDetallesPedido(pedidoEspecifico);
          console.log("Detalles del pedido guardados:", pedidoEspecifico);
        } else {
          console.log("No se encontró el pedido con ID:", order.id);
          console.log(
            "IDs disponibles:",
            response.data.map((p) => p.id_pedido)
          );
        }
      } catch (error) {
        console.error("Error al obtener los detalles del pedido:", error);
      }
    };

    fetchUsuarioInfo();
    fetchPedidoDetalles();
  }, [order]);

  if (!order) return null;

  // Agregar logs de debug para ver el estado actual
  console.log("Estado actual detallesPedido:", detallesPedido);
  console.log("Prop order recibida:", order);

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
            <label className="block text-sm font-medium mb-1 text-left mt-1">
              Fecha de Pedido
            </label>
            <input
              className="p-1 rounded w-full text-sm text-left border"
              style={{ borderColor: "#80838A", backgroundColor: "#F5F5F5" }}
              value={order.fechaPedido}
              readOnly
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium mb-1 text-left mt-1">
              Estado
            </label>
            <input
              className="p-1 rounded w-full text-sm text-left border"
              style={{ borderColor: "#80838A", backgroundColor: "#F5F5F5" }}
              value={order.estado}
              readOnly
            />
          </div>

          {/* Subtotal */}
          <div>
            <label className="block text-sm font-medium mb-1 text-left mt-2">
              Subtotal
            </label>
            <input
              className="p-1 rounded w-full text-sm text-left border"
              style={{ borderColor: "#80838A", backgroundColor: "#F5F5F5" }}
              value={
                detallesPedido?.factura?.factura_detalles
                  ? `L. ${detallesPedido.factura.factura_detalles
                      .reduce(
                        (sum, detalle) =>
                          sum + parseFloat(detalle.subtotal_producto || 0),
                        0
                      )
                      .toFixed(2)}`
                  : order.subtotal || "L. 0.00"
              }
              readOnly
            />
          </div>

          {/* Descuento */}
          <div>
            <label className="block text-sm font-medium mb-1 text-left mt-2">
              Descuento
            </label>
            <input
              className="p-1 rounded w-full text-sm text-left border"
              style={{ borderColor: "#80838A", backgroundColor: "#F5F5F5" }}
              value={
                detallesPedido?.descuento !== undefined
                  ? `L. ${parseFloat(detallesPedido.descuento || 0).toFixed(2)}`
                  : order.descuento || "L. 0.00"
              }
              readOnly
            />
          </div>
          {/* Impuesto */}
          <div>
            <label className="block text-sm font-medium mb-1 text-left mt-2">
              Impuesto
            </label>
            <input
              className="p-1 rounded w-full text-sm text-left border"
              style={{ borderColor: "#80838A", backgroundColor: "#F5F5F5" }}
              value={
                // fallback: aceptar varios nombres que pueda devolver la API
                (() => {
                  const imp =
                    detallesPedido?.factura?.impuestos ?? order.impuesto ?? 0;
                  return `L. ${parseFloat(imp || 0).toFixed(2)}`;
                })()
              }
              readOnly
            />
          </div>
          {/* Costo De Envío */}
          <div>
            <label className="block text-sm font-medium mb-1 text-left mt-2">
              Costo De Envío
            </label>
            <input
              className="p-1 rounded w-full text-sm text-left border"
              style={{ borderColor: "#80838A", backgroundColor: "#F5F5F5" }}
              value={
                // fallback: aceptar factura.costo_evio o campo directo costoEnvio
                (() => {
                  const envio =
                    detallesPedido?.factura?.costo_evio ??
                    order.costoEnvio ??
                    0;
                  return `L. ${parseFloat(envio || 0).toFixed(2)}`;
                })()
              }
              readOnly
            />
          </div>

          {/* Total */}
          <div>
            <label className="block text-sm font-medium mb-1 text-left mt-2">
              Total
            </label>
            <input
              className="p-1 rounded w-full text-sm text-left border"
              style={{ borderColor: "#80838A", backgroundColor: "#F5F5F5" }}
              value={
                detallesPedido?.factura?.total
                  ? `L. ${parseFloat(detallesPedido.factura.total).toFixed(2)}`
                  : order.total || "L. 0.00"
              }
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetallePedido;
