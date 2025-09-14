import React from "react";

export default function DetallePedido({ open, onClose, pedido }) {
  if (!open) return null;

  const productos = [
    { nombre: "Arroz", cantidad: 2, precio: 120 },
    { nombre: "Leche", cantidad: 1, precio: 80 },
  ];

  return (
    <div className="mini-modal">
      <div className="detalle-pedido">
        <div className="detalle-header">
          <strong>Detalle Pedido #{pedido?.id}</strong>
          <button className="cerrar-btn" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="pedido-info">
          <label>Usuario</label>
          <input readOnly value={pedido?.usuario || "-"} />
          <label>Fecha</label>
          <input readOnly value={pedido?.fecha || "-"} />
        </div>

        <div className="productos-lista">
          {productos.map((p, i) => (
            <div key={i} className="producto-card">
              <div style={{ fontWeight: 700 }}>{p.nombre}</div>
              <div>Cantidad: {p.cantidad}</div>
              <div>Precio: L. {p.precio}</div>
            </div>
          ))}
        </div>

        <div className="estado-pedido">
          <label>Estado</label>
          <div className="estado-lista">
            <div className="estado-opcion">{pedido?.estado || "-"}</div>
          </div>
        </div>

        <div className="acciones">
          <button className="btn-cambiar">Cambiar estado</button>
          <div>
            <button className="btn-cancelar" onClick={onClose}>
              Cerrar
            </button>
            <button className="btn-guardar" style={{ marginLeft: 8 }}>
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
