import React, { useState } from "react";
import "../components/GestionPedido.css";

const mockPedidos = Array.from({ length: 5 }).map((_, i) => ({
  id: String(1000 + i),
  usuario: `Usuario ${i + 1}`,
  fecha: `2025-09-${(i % 30) + 1}`,
  estado: ["Pendiente", "En Preparación", "En Camino", "Entregado"][i % 4],
  total: (Math.floor(Math.random() * 5000) + 100).toFixed(2),
  metodoPago: ["Efectivo", "Tarjeta", "Transferencia"][i % 3],
  direccion: `Colonia Ejemplo ${i + 1}, Ciudad`,
  descuento: 150,
  subtotal: 650,
  productos: [
    {
      nombre: "Leche",
      cantidad: "2 und",
      img: "https://via.placeholder.com/60?text=Leche",
    },
    {
      nombre: "Yogurt",
      cantidad: "3 und",
      img: "https://via.placeholder.com/60?text=Yogurt",
    },
    {
      nombre: "Bananas",
      cantidad: "2 lbs",
      img: "https://via.placeholder.com/60?text=Bananas",
    },
  ],
}));

function PaginationSmall({ page, pageCount, onPage }) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <div className="pedido-pagination">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        className="pedido-pagination-btn"
        disabled={page === 1}
      >
        ◀
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className={`w-9 h-9 rounded-full border border-[#d8dadc] ${
            p === page ? "ring-2 ring-[#d8572f] text-[#d8572f]" : ""
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPage(Math.min(pageCount, page + 1))}
        className="pedido-pagination-btn"
        disabled={page === pageCount}
      >
        ▶
      </button>
    </div>
  );
}

const GestionPedidos = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(mockPedidos.length / itemsPerPage));

  const visible = mockPedidos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const [detalleOpen, setDetalleOpen] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [estadoActual, setEstadoActual] = useState("Pendiente");
  const [nuevoEstado, setNuevoEstado] = useState("Pendiente");

  return (
    <div
      className="px-4"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div className="pedido-container">
        <h2 className="pedido-title">Gestión de Pedidos</h2>

        <div className="pedido-table-wrap">
          <table className="pedido-table">
            <thead className="pedido-thead">
              <tr>
                <th>ID Pedido</th>
                <th>Usuario</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Más información</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.usuario}</td>
                  <td>{p.fecha}</td>
                  <td>{p.estado}</td>
                  <td>L. {p.total}</td>
                  <td>
                    <button
                      className="pedido-export-btn"
                      onClick={() => {
                        setPedidoSeleccionado(p);
                        setEstadoActual(p.estado);
                        setNuevoEstado(p.estado);
                        setDetalleOpen(true);
                      }}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="pedido-footer">
          <span>Total Pedidos: {mockPedidos.length}</span>
          <PaginationSmall
            page={currentPage}
            pageCount={totalPages}
            onPage={setCurrentPage}
          />
        </div>

        {/* Modal de detalle */}
        {detalleOpen && pedidoSeleccionado && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Detalle del Pedido</h3>
                <button
                  className="modal-close"
                  onClick={() => setDetalleOpen(false)}
                >
                  ✕
                </button>
              </div>

              {/* Productos */}
              <div className="productos-lista">
                {pedidoSeleccionado.productos.map((prod, i) => (
                  <div className="producto-card" key={i}>
                    <img src={prod.img} alt={prod.nombre} />
                    <p>{prod.nombre}</p>
                    <span>{prod.cantidad}</span>
                  </div>
                ))}
              </div>

              {/* Info del pedido */}
              <div className="pedido-info">
                <label>Descuento</label>
                <input value={`L. ${pedidoSeleccionado.descuento}`} readOnly />
                <label>Subtotal</label>
                <input value={`L. ${pedidoSeleccionado.subtotal}`} readOnly />
                <label>Total</label>
                <input value={`L. ${pedidoSeleccionado.total}`} readOnly />
                <label>Dirección de entrega</label>
                <input value={pedidoSeleccionado.direccion} readOnly />
                <label>Método de Pago</label>
                <input value={pedidoSeleccionado.metodoPago} readOnly />
              </div>

              {/* Estado actual y cambio */}
              <div className="estado-pedido">
                <label>Estado actual</label>
                <input type="text" value={estadoActual} readOnly disabled />

                <label>Nuevo estado</label>
                <select
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Preparación">En Preparación</option>
                  <option value="En Camino">En Camino</option>
                  <option value="Entregado">Entregado</option>
                </select>
              </div>

              {/* Acciones */}
              <div className="acciones">
                <button
                  className="btn-cambiar"
                  onClick={() => setEstadoActual(nuevoEstado)}
                >
                  Cambiar Estado
                </button>
                <button
                  className="btn-cancelar"
                  onClick={() => alert("Pedido cancelado")}
                >
                  Cancelar Pedido
                </button>
                <button
                  className="btn-guardar"
                  onClick={() => {
                    alert("Cambios guardados");
                    setDetalleOpen(false);
                  }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionPedidos;
