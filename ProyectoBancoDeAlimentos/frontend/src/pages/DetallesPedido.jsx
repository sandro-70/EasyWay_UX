import React, { useState } from "react";
import "./DetallePedido.css";

const DetallePedido = () => {
  const [estado, setEstado] = useState("Pendiente");

  return (
    <div className="detalle-pedido">
      <div className="detalle-header">
        <h3>Detalle del Pedido</h3>
        <button className="cerrar-btn">✕</button>
      </div>

      {/* Listado de productos */}
      <div className="productos-lista">
        <div className="producto-card">
          <img src="https://via.placeholder.com/60" alt="Leche" />
          <p>Leche</p>
          <span>Cantidad 2 und</span>
        </div>
        <div className="producto-card">
          <img src="https://via.placeholder.com/60" alt="Yogurt" />
          <p>Yogurt</p>
          <span>Cantidad 3 und</span>
        </div>
        <div className="producto-card">
          <img src="https://via.placeholder.com/60" alt="Bananas" />
          <p>Bananas</p>
          <span>Cantidad 2 lbs</span>
        </div>
      </div>

      {/* Totales */}
      <div className="pedido-info">
        <label>Descuento</label>
        <input type="text" value="L.150" readOnly />
        <label>Subtotal</label>
        <input type="text" value="L.650" readOnly />
        <label>Total</label>
        <input type="text" value="L.500" readOnly />
        <label>Dirección de entrega</label>
        <input type="text" placeholder="Ingresar dirección" />
        <label>Método de Pago</label>
        <input type="text" placeholder="Ingresar método" />
      </div>

      {/* Estado */}
      <div className="estado-pedido">
        <p>Estado</p>
        <div className="estado-lista">
          {["Pendiente", "En Preparación", "En Camino", "Entregado"].map(
            (item) => (
              <label key={item} className="estado-opcion">
                <input
                  type="radio"
                  name="estado"
                  value={item}
                  checked={estado === item}
                  onChange={() => setEstado(item)}
                />
                <span>{item}</span>
              </label>
            )
          )}
        </div>
      </div>

      {/* Botones */}
      <div className="acciones">
        <button className="btn-cambiar">Cambiar Estado</button>
        <button className="btn-cancelar">Cancelar Pedido</button>
        <button className="btn-guardar">Guardar</button>
      </div>
    </div>
  );
};

export default DetallePedido;
