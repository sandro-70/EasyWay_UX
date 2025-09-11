import React, { useState } from "react";
import DetallePedido from "./DetallePedido";

const OrdersData = () => {
  const nombresClientes = [
    "Ana", "Luis", "Carla", "José", "María", "Pedro", "Lucía", "Juan",
    "Sofía", "Miguel", "Elena", "Carlos", "Valeria", "David", "Camila"
  ];

  const ordersData = Array.from({ length: 49 }, (_, i) => {
    const id = String(i + 1).padStart(3, "0");

    const fechaPedido = new Date(2025, i % 12, (i % 28) + 1);
    const fechaEntrega = new Date(fechaPedido.getTime());
    fechaEntrega.setDate(fechaPedido.getDate() + ((i % 5) + 1));

    return {
      id,
      estado: i % 2 === 0 ? "En preparación" : "Entregado",
      fechaPedido: fechaPedido.toLocaleDateString("es-ES", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      fechaEntrega: fechaEntrega.toLocaleDateString("es-ES", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      tiempoPromedio: (i % 5) + 1,
      metodoPago: i % 2 === 0 ? "Tarjeta" : "Efectivo",
      nombreCliente: nombresClientes[i % nombresClientes.length],
      frecuenciaCompra: i % 3 === 0 ? "Frecuente" : "No frecuente",
      motivoCancelacion: i % 7 === 0 ? "Cliente canceló" : "",
    };
  });

  const [selectedOrder, setSelectedOrder] = useState(null);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Pedidos</h1>

      <div className="grid grid-cols-3 gap-2">
        {ordersData.map((order) => (
          <button
            key={order.id}
            className="p-3 bg-blue-500 text-white rounded hover:bg-blue-600 text-left break-words"
            onClick={() => setSelectedOrder(order)}
          >
            <span className="font-bold">{order.nombreCliente}</span>
            <br />
            <span className="text-sm">{order.frecuenciaCompra}</span>
          </button>
        ))}
      </div>

      {selectedOrder && (
        <DetallePedido order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
};

export default OrdersData;
