import "./pedidoEmergente.css";

const PedidoEmergente = ({ pedido, cerrarModal }) => {
  return (
    <div className="overlay">
      <div className="modal">
        <h3>Pedido #{pedido.id}</h3>

        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre del producto</th>
              <th>Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {pedido.productos.map((prod) => (
              <tr key={prod.codigo}>
                <td>{prod.codigo}</td>
                <td>{prod.nombre}</td>
                <td>{prod.cantidad}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="botones">
          <button className="btn-reordenar">Reordenar</button>
          <button className="btn-volver" onClick={cerrarModal}>
            Volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default PedidoEmergente;
