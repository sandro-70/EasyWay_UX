import React, { Component } from "react";
import TablaProductos from "../components/TablaProductos";
import PerfilSidebar from "../components/perfilSidebar";
import Logo from "../images/logo2.png";
import LogoExport from "../images/logo3.png";
import CalendarioIcon from "../images/calendario.png";

// Librerías para PDF
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

class Facturas extends Component {
  state = {
    facturaSeleccionada: null,
    fechaFiltro: "",
    mostrarModal: false,
  };

  formatFecha = (fechaStr) => {
    const meses = [
      "enero","febrero","marzo","abril","mayo","junio",
      "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];
    const partes = fechaStr.split("/");
    const dia = partes[0].padStart(2, "0");
    const mes = meses[parseInt(partes[1], 10) - 1];
    const anio = partes[2];
    return `${dia} de ${mes} de ${anio}`;
  };

  handleSelect = (factura) => this.setState({ facturaSeleccionada: factura, mostrarModal: true });
  handleFechaChange = (e) => this.setState({ fechaFiltro: e.target.value });
  handleCerrarModal = () => this.setState({ mostrarModal: false, facturaSeleccionada: null });
  handleClickFondo = (e) => e.target.dataset.modalFondo && this.handleCerrarModal();

  getBase64Image = (url) =>
    new Promise((resolve, reject) => {
      fetch(url)
        .then(res => res.blob())
        .then(blob => {
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
    const subtotal = productos.reduce((acc, prod) => acc + prod.cantidad * prod.precio, 0);
    const isv = subtotal * 0.15;
    const costoEnvio = 10.0;
    const totalPagar = subtotal + isv + costoEnvio;

    const doc = new jsPDF();
    const logoBase64 = await this.getBase64Image(Logo);

    doc.addImage(logoBase64, "PNG", 160, 10, 35, 15);
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text("Factura", 14, 20);

    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Supermercado:", 14, 30);
    doc.text("No. Factura:", 14, 36);
    doc.text("Fecha:", 14, 42);

    doc.setFont(undefined, "normal");
    doc.text("Easy Way", 45, 30);
    doc.text(`#${facturaSeleccionada.numero}`, 40, 36);
    doc.text(this.formatFecha(facturaSeleccionada.fecha), 30, 42);

    doc.setFontSize(13);
    doc.setFont(undefined, "bold");
    doc.text("Resumen de la Orden", 14, 52);

    const tableColumn = ["Código", "Producto", "Cantidad", "Precio Unitario", "Subtotal"];
    const tableRows = productos.map(prod => [
      prod.codigo,
      prod.nombre,
      `x${prod.cantidad}`,
      `Lps. ${prod.precio.toFixed(2)}`,
      `Lps. ${(prod.cantidad * prod.precio).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 56,
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 11, textColor: [0, 0, 0], halign: 'center' },
      headStyles: { fillColor: [43, 109, 175], textColor: 255, fontStyle: "bold", halign: 'center' },
      columnStyles: { 2: { halign: "center" }, 3: { halign: "center" }, 4: { halign: "center" } }
    });

    const finalY = doc.lastAutoTable.finalY || 60;
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(14, finalY + 2, 196, finalY + 2);

    doc.setFontSize(11);
    doc.setFont(undefined, "normal");
    doc.text(`Subtotal: Lps. ${subtotal.toFixed(2)}`, 196, finalY + 12, { align: "right" });
    doc.text(`ISV 15%: Lps. ${isv.toFixed(2)}`, 196, finalY + 19, { align: "right" });
    doc.text(`Costo de envío: Lps. ${costoEnvio.toFixed(2)}`, 196, finalY + 26, { align: "right" });
    doc.setFont(undefined, "bold");
    doc.text(`Total a pagar: Lps. ${totalPagar.toFixed(2)}`, 196, finalY + 34, { align: "right" });

    doc.save(`Factura_${facturaSeleccionada.numero}.pdf`);
  };

  render() {

    const facturas = [
      { id: 1, numero: "123456", fecha: "26/01/2025", productos: [
        { codigo: "0001", nombre: "Manzanas", cantidad: 3, precio: 25 },
        { codigo: "0002", nombre: "Leche", cantidad: 2, precio: 30 },
        { codigo: "0003", nombre: "Pan", cantidad: 1, precio: 15 }
      ]},
      { id: 2, numero: "123457", fecha: "12/06/2024", productos: [
        { codigo: "0004", nombre: "Huevos", cantidad: 12, precio: 10 },
        { codigo: "0005", nombre: "Queso", cantidad: 2, precio: 45 }
      ]},
      { id: 3, numero: "123458", fecha: "08/06/2024", productos: [
        { codigo: "0006", nombre: "Arroz", cantidad: 2, precio: 50 },
        { codigo: "0007", nombre: "Aceite", cantidad: 1, precio: 80 },
        { codigo: "0008", nombre: "Jugo", cantidad: 3, precio: 20 }
      ]},
      { id: 4, numero: "123426", fecha: "06/04/2024", productos: [
        { codigo: "0009", nombre: "Pan", cantidad: 5, precio: 15 },
        { codigo: "0010", nombre: "Mantequilla", cantidad: 1, precio: 35 }
      ]},
      { id: 5, numero: "123436", fecha: "02/04/2024", productos: [
        { codigo: "0011", nombre: "Queso", cantidad: 2, precio: 45 },
        { codigo: "0012", nombre: "Tomate", cantidad: 4, precio: 12 },
        { codigo: "0013", nombre: "Lechuga", cantidad: 1, precio: 20 }
      ]},
      { id: 6, numero: "123459", fecha: "15/07/2025", productos: [
        { codigo: "0014", nombre: "Yogurt", cantidad: 6, precio: 12 },
        { codigo: "0015", nombre: "Cereal", cantidad: 2, precio: 60 }
      ]},
      { id: 7, numero: "123460", fecha: "20/08/2025", productos: [
        { codigo: "0016", nombre: "Carne", cantidad: 3, precio: 120 },
        { codigo: "0017", nombre: "Arroz", cantidad: 2, precio: 50 },
        { codigo: "0018", nombre: "Aceite", cantidad: 1, precio: 80 }
      ]},
      { id: 8, numero: "123461", fecha: "05/09/2025", productos: [
        { codigo: "0019", nombre: "Pasta", cantidad: 2, precio: 35 },
        { codigo: "0020", nombre: "Salsa", cantidad: 1, precio: 25 }
      ]},
      { id: 9, numero: "123462", fecha: "12/10/2024", productos: [
        { codigo: "0021", nombre: "Tomate", cantidad: 5, precio: 10 },
        { codigo: "0022", nombre: "Pepino", cantidad: 3, precio: 8 }
      ]},
      { id: 10, numero: "123463", fecha: "28/11/2024", productos: [
        { codigo: "0023", nombre: "Cereal", cantidad: 1, precio: 60 },
        { codigo: "0024", nombre: "Leche", cantidad: 2, precio: 30 },
        { codigo: "0025", nombre: "Mantequilla", cantidad: 1, precio: 35 }
      ]},
    ];

const { facturaSeleccionada, mostrarModal, fechaFiltro } = this.state;
    const facturasFiltradas = fechaFiltro
      ? facturas.filter(f => f.fecha.split("/")[1] === fechaFiltro)
      : facturas;

    const productos = facturaSeleccionada ? facturaSeleccionada.productos : [];
    const subtotal = productos.reduce((acc, prod) => acc + prod.cantidad * prod.precio, 0);
    const isv = subtotal * 0.15;
    const costoEnvio = 10.0;
    const totalPagar = subtotal + isv + costoEnvio;

    return (
      <div className="min-h-screen flex"> {/* Eliminamos bg-gray-100 */}
        <section className="sidebar"><PerfilSidebar /></section>
        <div className="flex-1 p-6 flex flex-col items-center">
          <div className="w-[700px] p-4 rounded border border-gray-300 bg-white">
            <h1 className="text-[#f0833e] text-3xl mb-2 font-normal text-left">Facturas</h1>
            <div className="h-0.5 bg-[#f0833e] mb-4 w-full mx-auto"></div>

            {/* Contenedor de facturas con scroll */}
            <div className="relative w-full border border-gray-300 rounded bg-white mb-4">
              <div className="flex justify-between items-center bg-[#2b6daf] text-white px-3 py-1 rounded-t">
                <h2 className="font-normal text-lg">Facturas emitidas</h2>
                <div className="flex items-center gap-2">
                  <select
                    className="px-2 py-1 text-black font-bold w-32 border border-gray-300 rounded h-8"
                    value={fechaFiltro}
                    onChange={this.handleFechaChange}
                  >
                    <option value="">Meses</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i+1} value={(i+1).toString().padStart(2, "0")}>
                        {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][i]}
                      </option>
                    ))}
                  </select>
                  <img src={CalendarioIcon} alt="Calendario" className="h-5 w-5" />
                </div>
              </div>

              <div className="max-h-[300px] overflow-y-auto relative pr-4">
                {facturasFiltradas.map((f, index) => (
                  <div
                    key={f.id}
                    className={`cursor-pointer p-2 hover:bg-blue-50 transition-colors ${facturaSeleccionada?.id === f.id ? "bg-blue-100" : ""} ${index < facturasFiltradas.length - 1 ? "border-b border-gray-300" : ""}`}
                    onClick={() => this.handleSelect(f)}
                  >
                    <div className="flex flex-col text-left">
                      <p className="text-gray-800 font-bold">Pedido #{f.numero}</p>
                      <p className="text-gray-500 text-sm">{f.fecha}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modal con fondo negro semitransparente */}
          {mostrarModal && facturaSeleccionada && (
            <div data-modal-fondo onClick={this.handleClickFondo} className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white w-[750px] rounded shadow-lg overflow-auto max-h-[90vh] p-6 relative">
                <button onClick={this.handleCerrarModal} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 font-bold">×</button>

                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-4xl font-bold text-black">Factura</h1>
                  <img src={Logo} alt="Logo" className="h-10 w-auto" />
                </div>

                <div className="flex flex-col items-start mb-3">
                  <p className="text-black-800 mb-0.5"><span className="font-bold">Supermercado:</span> Easy Way</p>
                  <p className="text-black-800 mb-0.5"><span className="font-bold">No. Factura:</span> #{facturaSeleccionada.numero}</p>
                  <p className="text-black-800 mb-2"><span className="font-bold">Fecha:</span> {this.formatFecha(facturaSeleccionada.fecha)}</p>
                  <h2 className="text-base font-bold text-black-800 mb-1">Resumen de la Orden</h2>
                </div>

                <TablaProductos productos={productos} />
                <div className="w-full h-0.5 bg-gray-300 my-3"></div>

                <div className="flex justify-end w-full mt-3">
                  <div className="w-2/5">
                    <table className="w-full text-sm mb-3 border-none">
                      <tbody>
                        <tr>
                          <td className="border-none p-0">
                            <div className="flex justify-between py-1"><span>Subtotal</span><span className="text-right">Lps. {subtotal.toFixed(2)}</span></div>
                          </td>
                        </tr>
                        <tr>
                          <td className="border-none p-0">
                            <div className="flex justify-between py-1"><span>ISV 15%</span><span className="text-right">Lps. {isv.toFixed(2)}</span></div>
                          </td>
                        </tr>
                        <tr>
                          <td className="border-none p-0">
                            <div className="flex justify-between py-1"><span>Costo de envío</span><span className="text-right">Lps. {costoEnvio.toFixed(2)}</span></div>
                          </td>
                        </tr>
                        <tr>
                          <td className="border-none p-0">
                            <div className="flex justify-between font-bold pt-2"><span>Total a pagar</span><span className="text-right">Lps. {totalPagar.toFixed(2)}</span></div>
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
          )}
        </div>
      </div>
    );
  }
}

export default Facturas;