import React from "react";

const DetallePedido = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 flex items-start justify-center pt-48 bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg w-[400px] p-3 relative shadow-lg">
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-3 bg-[#2B6DAF] p-2 rounded-t">
          <h2 className="text-white font-bold text-base text-left w-full">Detalle de Pedido</h2>
          <button
            className="text-white font-bold text-lg"
            onClick={onClose}
          >
            X
          </button>
        </div>

        {/* Contenido */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          {/* ID del Pedido */}
          <div>
            <label className="block text-sm font-medium mb-1 text-left">ID del Pedido</label>
            <input
              className="p-1 rounded w-full text-sm text-left border"
              style={{ borderColor: "#80838A", backgroundColor: "#F5F5F5" }}
              value={order.id}
              readOnly
            />
          </div>

          {/* Nombre del Cliente */}
          <div>
            <label className="block text-sm font-medium mb-1 text-left">Nombre Cliente</label>
            <input
              className="p-1 rounded w-full text-sm text-left border"
              style={{ borderColor: "#80838A", backgroundColor: "#F5F5F5" }}
              value={order.nombreCliente || "N/A"}
              readOnly
            />
          </div>

          {/* Tiempo de Entrega */}
          <div>
            <label className="block text-sm font-medium mb-1 text-left">Tiempo de Entrega</label>
            <input
              className="p-1 rounded w-full text-sm text-left border"
              style={{ borderColor: "#80838A", backgroundColor: "#F5F5F5" }}
              value={`${order.tiempoPromedio} días`}
              readOnly
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium mb-1 text-left">Estado</label>
            <input
              className="p-1 rounded w-full text-sm text-left border"
              style={{ borderColor: "#80838A", backgroundColor: "#F5F5F5" }}
              value={order.estado}
              readOnly
            />
          </div>

          {/* Método de Pago */}
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1 text-left">Método de Pago</label>
            <input
              className="p-1 rounded w-full text-sm text-left border"
              style={{ borderColor: "#80838A", backgroundColor: "#F5F5F5" }}
              value={order.metodoPago}
              readOnly
            />
          </div>

          {/* Fecha de Pedido */}
          <div>
            <label className="block text-sm font-medium mb-1 text-left">Fecha de Pedido</label>
            <input
              className="p-1 rounded w-full text-sm text-left border"
              style={{ borderColor: "#80838A", backgroundColor: "#F5F5F5" }}
              value={order.fechaPedido}
              readOnly
            />
          </div>

          {/* Fecha de Entrega */}
          <div>
            <label className="block text-sm font-medium mb-1 text-left">Fecha de Entrega</label>
            <input
              className="p-1 rounded w-full text-sm text-left border"
              style={{ borderColor: "#80838A", backgroundColor: "#F5F5F5" }}
              value={order.fechaEntrega}
              readOnly
            />
          </div>

          {/* Frecuencia de Compra */}
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1 text-left">Frecuencia de Compra</label>
            <input
              className="p-1 rounded w-full text-sm text-left border"
              style={{ borderColor: "#80838A", backgroundColor: "#F5F5F5" }}
              value={order.frecuenciaCompra || "N/A"}
              readOnly
            />
          </div>

          {/* Motivo de Cancelación */}
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1 text-left">Motivo de Cancelación</label>
            <textarea
              className="p-1 rounded w-full text-sm text-left border"
              style={{ borderColor: "#80838A", backgroundColor: "#F5F5F5" }}
              value={order.motivoCancelacion || "N/A"}
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetallePedido;
