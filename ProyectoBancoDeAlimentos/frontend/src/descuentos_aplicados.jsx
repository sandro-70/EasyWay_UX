import React from "react";
import { getDescuentosAplicadosPorUsuario } from "./api/PromocionesApi";
import "./descuentos_aplicados.css";
import { InformacionUser } from "./api/Usuario.Route";

function parseDbDate(input) {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input) ? null : input;
  if (typeof input !== "string") return null;

  const tryNative = new Date(input);
  if (!isNaN(tryNative)) return tryNative;

  const m = input
    .trim()
    .match(
      /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?)\s+([+-]\d{2})(\d{2})$/
    );
  if (m) {
    const [, d, t, tzH, tzM] = m;
    const iso = `${d}T${t}${tzH}:${tzM}`;
    const dt = new Date(iso);
    if (!isNaN(dt)) return dt;
  }
  return null;
}
const fmtHN = (date) =>
  date
    ? date.toLocaleDateString("es-HN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "-";

/* ---- Normalizador específico de TU controller ---- */
function mapApiToRow(row) {
  const fecha = parseDbDate(row.fecha_pedido);
  return {
    fecha, // Date ya válido
    factura: row.id_factura ? `#${row.id_factura}` : "-", // string
    descuento: Number(row.descuento_total) || 0, // número
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
      const { data } = await InformacionUser("me"); // puede ser cualquier valor
      const userId =
        data?.id_usuario ?? data?.id ?? data?.user?.id_usuario ?? null;

      if (!userId) {
        this.setState({
          loadingUser: false,
          loading: false,
          error: "Usuario no identificado",
        });
        return;
      }
      this.setState({ userId, loadingUser: false }, this.load);
    } catch (e) {
      console.error("Error obteniendo usuario:", e);
      this.setState({
        loadingUser: false,
        loading: false,
        error: "Usuario no identificado",
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
        <header className="discounts__header">
          <h2 className="discounts__title">Descuentos</h2>
        </header>

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
                    <td>{fmtHN(r.fecha)}</td>
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
