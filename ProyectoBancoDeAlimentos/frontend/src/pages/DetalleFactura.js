import React, { Component } from "react";
import TablaProductos from "../components/TablaProductos";
import { withRouter } from "../utils/withRouter";
import Logo from "../images/logo2.png";
import LogoExport from "../images/logo3.png";
import PerfilSidebar from "../components/perfilSidebar";
import { getAllFacturasByUserwithDetails } from "../api/FacturaApi";
import { listarPedido } from "../api/PedidoApi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

class DetalleFactura extends Component {
  state = {
    factura: null,
    cargando: false,
    error: null,
  };

  componentDidMount() {
    const id = this.getFacturaId(this.props);
    this.fetchFactura(id);
  }

  componentDidUpdate(prevProps) {
    const prevId = this.getFacturaId(prevProps);
    const currId = this.getFacturaId(this.props);
    if (prevId !== currId) {
      this.fetchFactura(currId);
    }
  }

  /** Lee el id desde: props.facturaId | props.idFactura | props.params.id */
  getFacturaId = (props) => {
    const { facturaId, idFactura, params } = props || {};
    return facturaId ?? idFactura ?? params?.id ?? null;
  };

  fetchFactura = async (id) => {
    if (!id) {
      this.setState({ factura: null, cargando: false, error: null });
      return;
    }
    this.setState({ cargando: true, error: null });
    try {
      const res = await getAllFacturasByUserwithDetails();
      const f = (res.data || []).find(
        (fact) => Number(fact.id_factura) === Number(id)
      );
      if (!f) {
        this.setState({
          factura: null,
          cargando: false,
          error: "Factura no encontrada",
        });
        return;
      }

      // Normaliza a la estructura que espera tu UI/TablaProductos
      const factura = {
        id: f.id_factura,
        numero: f.id_factura,
        fecha: new Date(f.fecha_emision).toLocaleDateString("es-ES"),
        metodo_pago: f.metodo_pago?.nombre || "Sin especificar",
        id_pedido: f.id_pedido || null,
        productos: (f.factura_detalles || []).map((fd) => ({
          codigo: fd.id_producto,
          nombre: fd.producto?.nombre ?? `#${fd.id_producto}`,
          cantidad: Number(fd.cantidad_unidad_medida ?? fd.cantidad ?? 0),
          precio: Number(fd.producto?.precio_base ?? 0),
        })),
      };

      // Fetch descuento from pedido if id_pedido exists
      if (factura.id_pedido) {
        try {
          const resPedido = await listarPedido(factura.id_pedido);
          const pedido = resPedido.data;
          factura.descuento = Number(pedido.descuento || 0);
        } catch (e) {
          console.error("Error fetching pedido:", e);
          factura.descuento = 0;
        }
      } else {
        factura.descuento = 0;
      }

      this.setState({ factura, cargando: false });
    } catch (error) {
      console.error("Error al cargar la factura:", error);
      this.setState({ error: "No se pudo cargar la factura", cargando: false });
    }
  };

  getBase64Image = (url) =>
    new Promise((resolve, reject) => {
      fetch(url)
        .then((res) => res.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
        .catch(reject);
    });

  handleExportar = () => {
    alert("Exportando factura...");
    // Aquí ya tienes jsPDF y autotable importados por si luego quieres exportar de verdad.
  };

  render() {
    const { factura, cargando, error } = this.state;
    const compact = this.props.compact === true; // si se usa en modal

    if (cargando) {
      return <div className="modal__empty">Cargando…</div>;
    }

    if (error) {
      return <div className="modal__empty">{error}</div>;
    }

    if (!factura) {
      return (
        <div
          className={
            compact
              ? "modal__empty"
              : "min-h-screen flex justify-center items-center"
          }
        >
          <div className="text-center">
            <p className="text-gray-700">
              Seleccione una factura para ver el detalle
            </p>
          </div>
        </div>
      );
    }

    const productos = factura.productos || [];
    const subtotal = productos.reduce(
      (acc, prod) => acc + prod.cantidad * prod.precio,
      0
    );
    const isv = subtotal * 0.15;
    const costoEnvio = 10.0;
    const descuento = factura.descuento || 0;
    const totalPagar = subtotal + isv + costoEnvio - descuento;

    // ---- Layout principal ----
    if (compact) {
      // Versión compacta: ideal para el modal
      return (
        <div className="w-full">
          {/* Título y logo */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-black">Factura</h1>
            <img src={Logo} alt="Logo" className="h-8 w-auto" />
          </div>

          {/* Datos básicos y título de la tabla */}
          <div className="flex flex-col items-start mb-3">
            <p className="text-black-800 mb-0.5">
              <span className="font-bold">Supermercado:</span> Easy Way
            </p>
            <p className="text-black-800 mb-0.5">
              <span className="font-bold">No. Factura:</span> #{factura.numero}
            </p>
            <p className="text-black-800 mb-2">
              <span className="font-bold">Fecha:</span> {factura.fecha}
            </p>
            <h2 className="text-base font-bold text-black-800 mb-1">
              Resumen de la Orden
            </h2>
          </div>

          {/* Tabla de productos */}
          <div className="mt-[-8px]">
            <TablaProductos productos={productos} />
          </div>

          {/* Separador */}
          <div className="border-t border-gray-300 my-3 w-full"></div>

          {/* Totales + Exportar */}
          <div className="flex justify-end w-full">
            <div className="w-full md:w-2/5">
              <table className="w-full text-sm mb-3 border-none">
                <tbody>
                  <tr>
                    <td className="border-none p-0">
                      <div className="flex justify-between py-1">
                        <span>Subtotal</span>
                        <span>Lps. {subtotal.toFixed(2)}</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border-none p-0">
                      <div className="flex justify-between py-1">
                        <span>Impuesto sobre Ventas (ISV 15%)</span>
                        <span>Lps. {isv.toFixed(2)}</span>
                      </div>
                    </td>
                  </tr>
                  {descuento > 0 && (
                    <tr>
                      <td className="border-none p-0">
                        <div className="flex justify-between py-1 text-red-600">
                          <span>Descuento</span>
                          <span>-Lps. {descuento.toFixed(2)}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="border-none p-0">
                      <div className="flex justify-between py-1">
                        <span>Costo de envío</span>
                        <span>Lps. {costoEnvio.toFixed(2)}</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border-none p-0">
                      <div className="flex justify-between font-bold pt-2">
                        <span>Total a pagar</span>
                        <span>Lps. {totalPagar.toFixed(2)}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-end">
                <button
                  onClick={this.handleExportar}
                  className="bg-[#2e9fd4] text-white font-semibold px-4 py-1.5 rounded-lg shadow hover:bg-[#16324f] transition-colors flex items-center gap-2"
                >
                  <img src={LogoExport} alt="Exportar" className="h-4 w-4" />
                  Exportar
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Versión completa (la que tenías con sidebar)
    return (
      <div className="min-h-screen bg-gray-100">
        <section className="sidebar">
          <PerfilSidebar />
        </section>

        <div className="min-h-screen flex justify-center items-start pt-4">
          <div className="w-[750px] border border-gray-300 shadow-lg overflow-hidden bg-white p-6 mt-4">
            {/* Título y logo */}
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-4xl font-bold text-black">Factura</h1>
              <img src={Logo} alt="Logo" className="h-10 w-auto" />
            </div>

            {/* Datos básicos */}
            <div className="flex flex-col items-start mb-3">
              <p className="text-black-800 mb-0.5">
                <span className="font-bold">Supermercado:</span> Easy Way
              </p>
              <p className="text-black-800 mb-0.5">
                <span className="font-bold">No. Factura:</span> #
                {factura.numero}
              </p>
              <p className="text-black-800 mb-2">
                <span className="font-bold">Fecha:</span> {factura.fecha}
              </p>
              <h2 className="text-base font-bold text-black-800 mb-1">
                Resumen de la Orden
              </h2>
            </div>

            {/* Tabla de productos */}
            <div className="mt-[-8px]">
              <TablaProductos productos={productos} />
            </div>

            <div className="border-t border-gray-300 my-3 w-full"></div>

            {/* Totales */}
            <div className="flex justify-end w-full">
              <div className="w-2/5">
                <table className="w-full text-sm mb-3 border-none">
                  <tbody>
                    <tr>
                      <td className="border-none p-0">
                        <div className="flex justify-between py-1">
                          <span>Subtotal</span>
                          <span>Lps. {subtotal.toFixed(2)}</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border-none p-0">
                        <div className="flex justify-between py-1">
                          <span>Impuesto sobre Ventas (ISV 15%)</span>
                          <span>Lps. {isv.toFixed(2)}</span>
                        </div>
                      </td>
                    </tr>
                    {descuento > 0 && (
                      <tr>
                        <td className="border-none p-0">
                          <div className="flex justify-between py-1 text-red-600">
                            <span>Descuento</span>
                            <span>-Lps. {descuento.toFixed(2)}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="border-none p-0">
                        <div className="flex justify-between py-1">
                          <span>Costo de envío</span>
                          <span>Lps. {costoEnvio.toFixed(2)}</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border-none p-0">
                        <div className="flex justify-between font-bold pt-2">
                          <span>Total a pagar</span>
                          <span>Lps. {totalPagar.toFixed(2)}</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="flex justify-end">
                  <button
                    onClick={this.handleExportar}
                    className="bg-[#2e9fd4] text-white font-semibold px-4 py-1.5 rounded-lg shadow hover:bg-[#16324f] transition-colors flex items-center gap-2"
                  >
                    <img src={LogoExport} alt="Exportar" className="h-4 w-4" />
                    Exportar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(DetalleFactura);
