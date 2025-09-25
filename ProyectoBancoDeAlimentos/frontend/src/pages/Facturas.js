//frontend/src/pages/Facturas.js
import React, { Component } from "react";
import TablaProductos from "../components/TablaProductos";
import PerfilSidebar from "../components/perfilSidebar";
import Logo from "../images/logo2.png";
import LogoExport from "../images/logo3.png";
import CalendarioIcon from "../images/calendario.png";
import { getAllFacturasByUserwithDetails } from "../api/FacturaApi";
import { listarPedido } from "../api/PedidoApi";
import "../pages/Facturas.css";
import { useTranslation } from "react-i18next";

// Librerías para PDF
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// (removed local withTranslation helper - use a top-level wrapper at the end of the file)

class Facturas extends Component {
  state = {
    facturas: [],
    facturaSeleccionada: null,
    fechaFiltro: "",
    mostrarModal: false,
    cargando: false,
  };

  componentDidMount() {
    this.fetchFacturas();
  }

  fetchFacturas = async () => {
    this.setState({ cargando: true });
    try {
      const res = await getAllFacturasByUserwithDetails();
      const facturas = res.data.map((f) => ({
        id: f.id_factura,
        numero: f.id_factura,
        fecha: new Date(f.fecha_emision).toLocaleDateString("es-ES"),
        id_pedido: f.pedido?.id_pedido || null,
        descuento: f.pedido ? Number(f.pedido.descuento || 0) : 0,
        productos: f.factura_detalles.map((fd) => ({
          codigo: fd.id_producto,
          nombre: fd.producto.nombre,
          cantidad: fd.cantidad_unidad_medida,
          precio: parseFloat(fd.producto.precio_base),
        })),
      }));
      this.setState({ facturas });
    } catch (error) {
      console.error("Error al cargar facturas:", error);
    } finally {
      this.setState({ cargando: false });
    }
  };

  formatFecha = (fechaStr) => {
    const meses = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];
    const [dia, mes, anio] = fechaStr.split("/");
    return `${dia.padStart(2, "0")} de ${
      meses[parseInt(mes, 10) - 1]
    } de ${anio}`;
  };

  handleSelect = (factura) => {
    this.setState({ facturaSeleccionada: factura, mostrarModal: true });
  };

  handleFechaChange = (e) => {
    this.setState({ fechaFiltro: e.target.value });
  };

  handleCerrarModal = () => {
    this.setState({ mostrarModal: false, facturaSeleccionada: null });
  };

  handleClickFondo = (e) => {
    if (e.target.dataset.modalFondo) this.handleCerrarModal();
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

  handleExportar = async () => {
    const { facturaSeleccionada } = this.state;
    if (!facturaSeleccionada) return;

    const productos = facturaSeleccionada.productos;
    const subtotal = productos.reduce(
      (acc, prod) => acc + prod.cantidad * prod.precio,
      0
    );
    const descuento = facturaSeleccionada.descuento || 0;
    const subtotalAfterDiscount = subtotal - descuento;
    const isv = subtotalAfterDiscount * 0.15;
    const costoEnvio = 10.0;
    const totalPagar = subtotalAfterDiscount + isv + costoEnvio;

    const doc = new jsPDF();
    const logoBase64 = await this.getBase64Image(Logo);

    // Encabezado
    doc.addImage(logoBase64, "PNG", 160, 10, 35, 15);
    doc.setFontSize(16).setFont(undefined, "bold").text("Factura", 14, 20);

    // Datos de la factura
    doc.setFontSize(11).setFont(undefined, "bold");
    doc.text("Supermercado:", 14, 30);
    doc.text("No. Factura:", 14, 36);
    doc.text("Fecha:", 14, 42);
    // **CAMBIO 2: Eliminar la línea "Método de pago:" de la exportación en PDF**
    doc.setFont(undefined, "normal");
    doc.text("Easy Way", 45, 30);
    doc.text(`#${facturaSeleccionada.numero}`, 45, 36);
    doc.text(this.formatFecha(facturaSeleccionada.fecha), 35, 42);
    // **CAMBIO 3: Eliminar la línea del método de pago del PDF**
    // doc.text(facturaSeleccionada.metodo_pago, 50, 48);
    // Resumen
    doc
      .setFontSize(13)
      .setFont(undefined, "bold")
      .text("Resumen de la Orden", 14, 58);

    const tableColumn = [
      "Código",
      "Producto",
      "Cantidad",
      "Precio Unitario",
      "Subtotal",
    ];
    const tableRows = productos.map((prod) => [
      prod.codigo,
      prod.nombre,
      `x${prod.cantidad}`,
      `Lps. ${prod.precio.toFixed(2)}`,
      `Lps. ${(prod.cantidad * prod.precio).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 62,
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 11, textColor: [0, 0, 0], halign: "center" },
      headStyles: {
        fillColor: [43, 109, 175],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        2: { halign: "center" },
        3: { halign: "center" },
        4: { halign: "center" },
      },
    });

    const finalY = doc.lastAutoTable.finalY || 60;
    doc
      .setDrawColor(200)
      .setLineWidth(0.5)
      .line(14, finalY + 2, 196, finalY + 2);

    // Totales
    let yOffset = finalY + 12;
    doc.setFontSize(11).setFont(undefined, "normal");
    doc.text(`Subtotal: Lps. ${subtotal.toFixed(2)}`, 196, yOffset, {
      align: "right",
    });
    yOffset += 7;
    doc.text(`ISV 15%: Lps. ${isv.toFixed(2)}`, 196, yOffset, {
      align: "right",
    });
    yOffset += 7;
    if (descuento > 0) {
      doc.text(`Descuento: -Lps. ${descuento.toFixed(2)}`, 196, yOffset, {
        align: "right",
      });
      yOffset += 7;
    }
    doc.text(`Costo de envío: Lps. ${costoEnvio.toFixed(2)}`, 196, yOffset, {
      align: "right",
    });
    yOffset += 8;
    doc.setFont(undefined, "bold");
    doc.text(`Total a pagar: Lps. ${totalPagar.toFixed(2)}`, 196, yOffset, {
      align: "right",
    });

    doc.save(`Factura_${facturaSeleccionada.numero}.pdf`);
  };

  // HOC to use the useTranslation hook in a class component

  render() {
    const { t } = this.props;
    const {
      facturas,
      facturaSeleccionada,
      mostrarModal,
      fechaFiltro,
      cargando,
    } = this.state;
    const facturasFiltradas = fechaFiltro
      ? facturas.filter(
          (f) => f.fecha.split("/")[1].padStart(2, "0") === fechaFiltro
        )
      : facturas;

    const productos = facturaSeleccionada ? facturaSeleccionada.productos : [];
    const subtotal = productos.reduce(
      (acc, prod) => acc + prod.cantidad * prod.precio,
      0
    );
    const descuento = facturaSeleccionada
      ? facturaSeleccionada.descuento || 0
      : 0;
    const subtotalAfterDiscount = subtotal - descuento;
    const isv = subtotalAfterDiscount * 0.15;
    const costoEnvio = 10.0;
    const totalPagar = subtotalAfterDiscount + isv + costoEnvio;

    return (
      <div className="facturas-container">
        {/* Sidebar */}
        <section className="sidebar">
          <PerfilSidebar />
        </section>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col items-center">
          <div className="facturas-wrapper">
            <h1 className="titulo-facturas">{t("facturaTitle")}</h1>
            <hr className="facturas-separado" />

            {cargando ? (
              <p className="text-gray-500 text-center">
                {t("facturas.loading")}
              </p>
            ) : (
              <div className="historial-box">
                <div className="historial-header">
                  <h2 className="box-titulo">{t("facturasEmitidas")}</h2>
                  <div className="flex items-center gap-2">
                    <select
                      className="px-2 py-1 text-black font-bold w-32 border border-gray-300 rounded h-8"
                      value={fechaFiltro}
                      onChange={this.handleFechaChange}
                    >
                      <option value="">{t("meses")}</option>
                      {[
                        "Enero",
                        "Febrero",
                        "Marzo",
                        "Abril",
                        "Mayo",
                        "Junio",
                        "Julio",
                        "Agosto",
                        "Septiembre",
                        "Octubre",
                        "Noviembre",
                        "Diciembre",
                      ].map((mes, i) => (
                        <option
                          key={i + 1}
                          value={(i + 1).toString().padStart(2, "0")}
                        >
                          {mes}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="factura-item">
                  {facturasFiltradas.map((f, index) => (
                    <div
                      key={f.id}
                      className="pedido-info clickable"
                      onClick={() => this.handleSelect(f)}
                    >
                      <p className="factura-id">
                        {t("factura")} #{f.numero}
                      </p>
                      <p className="factura-fecha">
                        {/* **CAMBIO 4: Eliminar el método de pago de la vista de lista** */}
                        {f.fecha}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal */}
          {mostrarModal && facturaSeleccionada && (
            <div
              data-modal-fondo
              onClick={this.handleClickFondo}
              className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start overflow-auto z-50"
            >
              <div className="bg-white w-[750px] rounded shadow-lg p-6 relative mt-48">
                <button
                  onClick={this.handleCerrarModal}
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 font-bold"
                >
                  ×
                </button>

                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-4xl font-bold text-black">Factura</h1>
                  <img src={Logo} alt="Logo" className="h-10 w-auto" />
                </div>

                <div className="flex flex-col items-start mb-3">
                  <p className="mb-0.5">
                    <span className="font-bold">Supermercado:</span> Easy Way
                  </p>
                  <p className="mb-0.5">
                    <span className="font-bold">No. Factura:</span> #
                    {facturaSeleccionada.numero}
                  </p>
                  {/* **CAMBIO 5: Eliminar el párrafo del método de pago del modal** */}
                  <p className="mb-2">
                    <span className="font-bold">Fecha:</span>{" "}
                    {this.formatFecha(facturaSeleccionada.fecha)}
                  </p>
                  <h2 className="text-base font-bold mb-1">
                    Resumen de la Orden
                  </h2>
                </div>

                <TablaProductos productos={productos} />
                <div className="w-full h-0.5 bg-gray-300 my-3"></div>

                {/* Totales */}
                <div className="flex justify-end w-full mt-3">
                  <div className="w-2/5">
                    <table className="w-full text-sm mb-3 border-none">
                      <tbody>
                        <tr>
                          <td className="p-0">
                            <div className="flex justify-between py-1">
                              <span>Subtotal</span>
                              <span className="text-right">
                                Lps. {subtotal.toFixed(2)}
                              </span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-0">
                            <div className="flex justify-between py-1">
                              <span>ISV 15%</span>
                              <span className="text-right">
                                Lps. {isv.toFixed(2)}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {descuento > 0 && (
                          <tr>
                            <td className="p-0">
                              <div className="flex justify-between py-1 text-red-600">
                                <span>Descuento</span>
                                <span className="text-right">
                                  -Lps. {descuento.toFixed(2)}
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td className="p-0">
                            <div className="flex justify-between py-1">
                              <span>Costo de envío</span>
                              <span className="text-right">
                                Lps. {costoEnvio.toFixed(2)}
                              </span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-0">
                            <div className="flex justify-between font-bold pt-2">
                              <span>Total a pagar</span>
                              <span className="text-right">
                                Lps. {totalPagar.toFixed(2)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="flex justify-end">
                      <button
                        onClick={this.handleExportar}
                        className="bg-[#f0833e] text-white font-semibold px-4 py-1.5 rounded-lg shadow hover:bg-[#ea6b1c] transition-colors flex items-center gap-2"
                      >
                        📊 Exportar a PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

// export named class for tests or other imports
export { Facturas };

// Top-level functional wrapper that uses the hook and passes `t` to the class component
function FacturasWithTranslation(props) {
  const { t } = useTranslation();
  return <Facturas {...props} t={t} />;
}

export default FacturasWithTranslation;
