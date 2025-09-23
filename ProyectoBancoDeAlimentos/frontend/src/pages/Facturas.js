//frontend/src/pages/Facturas.js
import React, { Component } from "react";
import TablaProductos from "../components/TablaProductos";
import PerfilSidebar from "../components/perfilSidebar";
import Logo from "../images/logo2.png";
import LogoExport from "../images/logo3.png";
import CalendarioIcon from "../images/calendario.png";
import { getAllFacturasByUserwithDetails } from "../api/FacturaApi";
import "../pages/Facturas.css";

// Librerías para PDF
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
        // **CAMBIO 1: Eliminar el método de pago del estado de la factura**
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
    const isv = productos.reduce((acc, prod) => acc + prod.cantidad * prod.precio, 0) * 0.15;
    const costoEnvio = 10.0;
    const totalPagar = subtotal + isv + costoEnvio;

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
    doc.setFontSize(11).setFont(undefined, "normal");
    doc.text(`Subtotal: Lps. ${subtotal.toFixed(2)}`, 196, finalY + 12, {
      align: "right",
    });
    doc.text(`ISV 15%: Lps. ${isv.toFixed(2)}`, 196, finalY + 19, {
      align: "right",
    });
    doc.text(
      `Costo de envío: Lps. ${costoEnvio.toFixed(2)}`,
      196,
      finalY + 26,
      { align: "right" }
    );
    doc.setFont(undefined, "bold");
    doc.text(`Total a pagar: Lps. ${totalPagar.toFixed(2)}`, 196, finalY + 34, {
      align: "right",
    });

    doc.save(`Factura_${facturaSeleccionada.numero}.pdf`);
  };

  render() {
    const {
      facturas,
      facturaSeleccionada,
      mostrarModal,
      fechaFiltro,
      cargando,
    } = this.state;
    const facturasFiltradas = fechaFiltro
      ? facturas.filter((f) => f.fecha.split("/")[1].padStart(2, '0') === fechaFiltro)
      : facturas;

    const productos = facturaSeleccionada ? facturaSeleccionada.productos : [];
    const subtotal = productos.reduce(
      (acc, prod) => acc + prod.cantidad * prod.precio,
      0
    );
    const isv = productos.reduce((acc, prod) => acc + prod.cantidad * prod.precio, 0) * 0.15;
    const costoEnvio = 10.0;
    const totalPagar = subtotal + isv + costoEnvio;

    return (
      <div className="facturas-container">
        {/* Sidebar */}
        <section className="sidebar">
          <PerfilSidebar />
        </section>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col items-center">
          <div className="w-[700px] p-4 rounded border bg-white">
            <h1 className="titulo-facturas">
              Facturas
            </h1>
            <hr className="facturas-separado"/>

            {cargando ? (
              <p className="text-gray-500 text-center">Cargando facturas...</p>
            ) : (
              <div className="historial-box">
                <div className="historial-header">
                  <h2 className="box-titulo">Facturas emitidas</h2>
                  <div className="flex items-center gap-2">
                    <select
                      className="px-2 py-1 text-black font-bold w-32 border border-gray-300 rounded h-8"
                      value={fechaFiltro}
                      onChange={this.handleFechaChange}
                    >
                      <option value="">Meses</option>
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

                <div className="max-h-[300px] overflow-y-auto relative pr-4">
                  {facturasFiltradas.map((f, index) => (
                    <div
                      key={f.id}
                      className={`cursor-pointer p-2 hover:bg-blue-50 transition-colors
                        ${
                          facturaSeleccionada?.id === f.id ? "bg-blue-100" : ""
                        }
                        ${
                          index < facturasFiltradas.length - 1
                            ? "border-b border-gray-300"
                            : ""
                        }`}
                      onClick={() => this.handleSelect(f)}
                    >
                      <div className="flex flex-col text-left">
                        <p className="text-gray-800 font-bold">
                          Pedido #{f.numero}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {/* **CAMBIO 4: Eliminar el método de pago de la vista de lista** */}
                          {f.fecha}
                        </p>
                      </div>
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
                        className="bg-[#2e9fd4] text-white font-semibold px-4 py-1.5 rounded-lg shadow hover:bg-[#16324f] transition-colors flex items-center gap-2"
                      >
                        <img
                          src={LogoExport}
                          alt="Exportar"
                          className="h-4 w-4"
                        />
                        Exportar
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

export default Facturas;