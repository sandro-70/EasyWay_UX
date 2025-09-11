import { useState } from "react";
import "./misPedidos.css";
import calendarIcon from "./images/calendar.png";
import PedidoEmergente from "./components/pedidoEmergente";
import PerfilSidebar from "./components/perfilSidebar";

const MisPedidos = () => {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [filtro, setFiltro] = useState("recientes");
  const [fechaExacta, setFechaExacta] = useState("");
  const [limite, setLimite] = useState(10);

  const pedidos = [
    { id: 123456, fecha: "2024-04-12", estado: "En curso", productos: [] },
    { id: 123457, fecha: "2024-04-08", estado: "Entregado", productos: [] },
    { id: 123458, fecha: "2024-04-06", estado: "Entregado", productos: [] },
    { id: 123426, fecha: "2024-04-04", estado: "Entregado", productos: [] },
    { id: 123436, fecha: "2024-04-02", estado: "Entregado", productos: [] },
    { id: 123437, fecha: "2024-03-30", estado: "Entregado", productos: [] },
    { id: 123438, fecha: "2024-03-25", estado: "Entregado", productos: [] },
    { id: 123439, fecha: "2024-03-20", estado: "Entregado", productos: [] },
    { id: 123440, fecha: "2024-03-15", estado: "Entregado", productos: [] },
    { id: 123441, fecha: "2024-03-10", estado: "Entregado", productos: [] },
    { id: 123442, fecha: "2024-03-05", estado: "Entregado", productos: [] },
  ];

  // Aplicar filtro
  let pedidosFiltrados = [...pedidos];

  if (filtro === "recientes") {
    pedidosFiltrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  } else if (filtro === "antiguos") {
    pedidosFiltrados.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  } else if (filtro === "exacta" && fechaExacta) {
    pedidosFiltrados = pedidosFiltrados.filter((p) => p.fecha === fechaExacta);
  }

  // Limitar a 10 (o más si se presiona "Ver más")
  const pedidosMostrados = pedidosFiltrados.slice(0, limite);

  const abrirModal = (pedido) => {
    setPedidoSeleccionado(pedido);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setPedidoSeleccionado(null);
    setModalAbierto(false);
  };

  return (
    <div className="mis-pedidos-container">
      <section className="sidebar">
        <PerfilSidebar />
      </section>

      <div className="content-wrapper">
        <div className="main-content">
          <h2 className="historial-title">Historial de pedidos</h2>
          <hr className="perfil-separator" />

          <div className="historial-box">
            <div className="historial-header">
              <h3>Historial de pedidos</h3>

              <select
                className="filtro-fecha"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              >
                <option value="recientes">Más recientes</option>
                <option value="antiguos">Más antiguos</option>
                <option value="exacta">Fecha exacta</option>
              </select>

              {filtro === "exacta" && (
                <input
                  type="date"
                  value={fechaExacta}
                  onChange={(e) => setFechaExacta(e.target.value)}
                />
              )}

              <img
                src={calendarIcon}
                alt="Calendario"
                className="icono-calendario"
              />
            </div>

            <div className="historial-list">
              {pedidosMostrados.map((pedido) => (
                <div key={pedido.id} className="pedido-item">
                  <div
                    className="pedido-info clickable"
                    onClick={() => abrirModal(pedido)}
                  >
                    <p className="pedido-id">Pedido #{pedido.id}</p>
                    <p className="pedido-fecha">{pedido.fecha}</p>
                  </div>
                  <span
                    className={`pedido-estado ${
                      pedido.estado === "En curso" ? "en-curso" : "entregado"
                    }`}
                  >
                    {pedido.estado}
                  </span>
                </div>
              ))}
            </div>

            {/* Botón ver más si hay más pedidos */}
            {limite < pedidosFiltrados.length && (
              <div className="ver-mas-container">
                <button
                  className="btn-ver-mas"
                  onClick={() => setLimite(limite + 10)}
                >
                  Ver más
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalAbierto && pedidoSeleccionado && (
        <PedidoEmergente
          pedido={pedidoSeleccionado}
          cerrarModal={cerrarModal}
        />
      )}
    </div>
  );
};

export default MisPedidos;
