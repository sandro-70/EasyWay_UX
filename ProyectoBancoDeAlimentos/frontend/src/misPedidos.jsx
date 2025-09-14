import React, { useState, useEffect } from "react";
import "./misPedidos.css";
import calendarIcon from "./images/calendar.png";
import PedidoEmergente from "./components/pedidoEmergente";
import PerfilSidebar from "./components/perfilSidebar";
import { jwtDecode } from "jwt-decode";
import { getPedidosConDetallesUsuario, listarPedido } from "./api/PedidoApi";

const MisPedidos = () => {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [filtro, setFiltro] = useState("recientes");
  const [fechaExacta, setFechaExacta] = useState("");
  const [limite, setLimite] = useState(10);
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Mapeo de estados a clases CSS
  const estadoClases = {
    'Pendiente': 'estado-pendiente',
    'Procesando': 'estado-procesando',
    'Enviado': 'estado-enviado',
    'Entregado': 'estado-entregado',
    'Cancelado': 'estado-cancelado'
  };

  // ✨ Función para obtener el ID del usuario del token JWT
  const getUserId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      return decoded.id;
    } catch {
      console.error("Token JWT inválido");
      return null;
    }
  };

  useEffect(() => {
    const idUsuarioActual = getUserId();

    if (!idUsuarioActual) {
      console.error("Usuario no autenticado, no se pueden cargar los pedidos.");
      setCargando(false);
      setPedidos([]);
      return;
    }

    const cargarPedidos = async () => {
      try {
        const response = await getPedidosConDetallesUsuario(idUsuarioActual);
        const formattedPedidos = response.data.map((p) => ({
          id_pedido: p.id_pedido,
          fecha: p.fecha_pedido ? p.fecha_pedido.split('T')[0] : 'Sin fecha',
          estado: p.estado_pedido?.nombre_pedido || "Desconocido",
        }));
        setPedidos(formattedPedidos);
        setCargando(false);
      } catch (error) {
        console.error("Error al obtener los pedidos:", error);
        setCargando(false);
      }
    };
    cargarPedidos();
  }, []);

  let pedidosFiltrados = [...pedidos];

  if (filtro === "recientes") {
    pedidosFiltrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  } else if (filtro === "antiguos") {
    pedidosFiltrados.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  } else if (filtro === "exacta" && fechaExacta) {
    pedidosFiltrados = pedidosFiltrados.filter((p) => p.fecha === fechaExacta);
  }

  const pedidosMostrados = pedidosFiltrados.slice(0, limite);

  const abrirModal = async (pedido) => {
    try {
      const response = await listarPedido(pedido.id_pedido);
      setPedidoSeleccionado(response.data);
      setModalAbierto(true);
    } catch (error) {
      console.error("Error al obtener los detalles del pedido:", error);
    }
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
                  className="filtro-fecha-input" // <--- NUEVA CLASE AQUÍ
                />
              )}
              <img
                src={calendarIcon}
                alt="Calendario"
                className="icono-calendario"
              />
            </div>
            <div className="historial-list">
              {cargando ? (
                <p>Cargando pedidos...</p>
              ) : pedidosMostrados.length > 0 ? (
                pedidosMostrados.map((pedido) => (
                  <div
                    key={pedido.id_pedido}
                    className="pedido-item"
                    onClick={() => abrirModal(pedido)}
                  >
                    <div className="pedido-info clickable">
                      <p className="pedido-id">Pedido #{pedido.id_pedido}</p>
                      <p className="pedido-fecha">{pedido.fecha}</p>
                    </div>
                    <span
                      className={`pedido-estado ${estadoClases[pedido.estado]}`}
                    >
                      {pedido.estado}
                    </span>
                  </div>
                ))
              ) : (
                <p>No se encontraron pedidos.</p>
              )}
            </div>
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