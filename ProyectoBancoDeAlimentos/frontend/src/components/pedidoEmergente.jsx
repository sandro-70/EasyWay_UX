import "./pedidoEmergente.css";
import { useTranslation } from "react-i18next";

const PedidoEmergente = ({ pedido, cerrarModal }) => {
  const { t } = useTranslation();

  return (
    <div className="overlay">
      <div className="modal">
        <h3>
          {t("pedido")} #{pedido.id_pedido}
        </h3>

        <table>
          <thead>
            <tr>
              <th>{t("codigo")}</th>
              <th>{t("nombre_producto")}</th>
              <th>{t("cantidad")}</th>
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
          <button className="btn-volver" onClick={cerrarModal}>
            {t("volver")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PedidoEmergente;
