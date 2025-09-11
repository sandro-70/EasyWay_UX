import React from "react";
import { getDescuentosAplicadosPorUsuario } from "./api/PromocionesApi";
import "./descuentos_aplicados.css";
import { InformacionUser } from "./api/Usuario.Route";

function mapApiToRow(p) {
  // el include de pedido puede venir como p.pedido o p.pedidos[0]
  const ped = Array.isArray(p.pedidos) ? p.pedidos[0] : p.pedido || {};
  const fecha =
    ped.fecha ||
    p.fecha_aplicacion ||
    p.fecha_inicio ||
    p.createdAt ||
    p.updatedAt;
  const descuento = p.monto_descuento ?? p.valor_descuento ?? p.descuento ?? 0;

  return {
    fecha,
    factura: ped.numero_factura || ped.factura || "-",
    descuento: Number(descuento) || 0,
  };
}

const PAGE_SIZE = 8;

export default class DescuentosAplicados extends React.Component {
  state = {
    loadingUser: true,
    userId: null,
    loading: true,
    error: null,
    rows: [],
    page: 1,
  };

  async componentDidMount() {
    await this.resolveUserId();
  }

  async resolveUserId() {
    try {
      // Tu compañero dijo que puedes mandar cualquier cosa y devuelve el id
      const { data } = await InformacionUser(2);
      const userId =
        data?.id_usuario ?? data?.id ?? data?.user?.id_usuario ?? null;
      console.log("userId que voy a usar:", userId);
      if (!userId) {
        this.setState({
          loadingUser: false,
          loading: false,
          error: "No se pudo identificar al usuario.",
        });
        return;
      }

      this.setState({ userId, loadingUser: false }, this.load);
    } catch (e) {
      console.error("Error obteniendo usuario:", e);
      this.setState({
        loadingUser: false,
        loading: false,
        error: "No se pudo identificar al usuario.",
      });
    }
  }

  load = async () => {
    try {
      const { userId } = this.state;
      this.setState({ loading: true, error: null });

      const { data } = await getDescuentosAplicadosPorUsuario(userId);
      const rows = Array.isArray(data) ? data.map(mapApiToRow) : [];

      this.setState({ rows, loading: false });
    } catch (err) {
      console.error("Error cargando descuentos:", err);
      this.setState({ error: "No se pudo cargar descuentos", loading: false });
    }
  };

  setPage = (next) => {
    const total = Math.max(1, Math.ceil(this.state.rows.length / PAGE_SIZE));
    this.setState({ page: Math.min(Math.max(1, next), total) });
  };

  render() {
    const { loadingUser, loading, error, rows, page } = this.state;

    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const start = (page - 1) * PAGE_SIZE;
    const pageRows = rows.slice(start, start + PAGE_SIZE);

    return (
      <section className="discounts">
        {/* Cabecera compacta */}
        <header className="discounts__header">
          <h2 className="discounts__title">Descuentos</h2>
          <div className="h-0.5 w-full bg-[#f0833e] mt-3" />
        </header>

        {/* La línea va sobre la tabla, del mismo ancho del wrap (se dibuja con ::before en CSS) */}
        <div className="discounts__tableWrap">
          <table className="discounts__table">
            <colgroup>
              <col style={{ width: "36%" }} />
              <col style={{ width: "34%" }} />
              <col style={{ width: "30%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>#Factura</th>
                <th className="num">Descuento</th>
              </tr>
            </thead>
            <tbody>
              {loadingUser || loading ? (
                <tr>
                  <td className="empty" colSpan={3}>
                    Cargando…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="empty" colSpan={3}>
                    {error}
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td className="empty" colSpan={3}>
                    Sin descuentos aplicados.
                  </td>
                </tr>
              ) : (
                pageRows.map((r, i) => (
                  <tr key={i}>
                    <td>{new Date(r.fecha).toLocaleDateString("es-HN")}</td>
                    <td>{r.factura}</td>
                    <td className="num">
                      L.{" "}
                      {r.descuento.toLocaleString("es-HN", {
                        maximumFractionDigits: 0,
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación redonda compacta */}
        <nav className="discounts__pager" aria-label="Paginación">
          <button
            className="pager__btn"
            onClick={() => this.setPage(page - 1)}
            disabled={page === 1}
            title="Anterior"
          >
            ‹
          </button>
          <span className="pager__page is-active">{page}</span>
          <button
            className="pager__btn"
            onClick={() => this.setPage(page + 1)}
            disabled={page === totalPages}
            title="Siguiente"
          >
            ›
          </button>
        </nav>
      </section>
    );
  }
}
