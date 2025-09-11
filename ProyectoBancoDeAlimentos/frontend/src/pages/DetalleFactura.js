import React, { Component } from "react";
import TablaProductos from "../components/TablaProductos";
import { withRouter } from "../utils/withRouter";
import Logo from "../images/logo2.png";
import LogoExport from "../images/logo3.png";
import PerfilSidebar from "../components/perfilSidebar";
class DetalleFactura extends Component {
  handleExportar = () => {
    alert("Exportando factura...");
  };

  render() {
    const { params } = this.props;
    const { id } = params || {};

    const facturas = [
      { id: 1, numero: "123456", fecha: "26 de agosto de 2025" },
      { id: 2, numero: "123457", fecha: "12/06/2024" },
      { id: 3, numero: "123458", fecha: "08/06/2024" },
      { id: 4, numero: "123426", fecha: "06/04/2024" },
      { id: 5, numero: "123436", fecha: "02/04/2024" },
    ];

    const factura = facturas.find((f) => f.id === parseInt(id));

    if (!factura) {
      return (
        <div className="min-h-screen flex justify-center items-center">
          <div className="text-center">
            <p className="text-gray-700">
              Seleccione una factura para ver el detalle
            </p>
          </div>
        </div>
      );
    }

    const productos = [
  { codigo: "0001", nombre: "Manzanas", cantidad: 3, precio: 25.0 },
  { codigo: "0002", nombre: "Leche", cantidad: 2, precio: 30.0 }
];

    const subtotal = productos.reduce(
      (acc, prod) => acc + prod.cantidad * prod.precio,
      0
    );
    const isv = subtotal * 0.15;
    const costoEnvio = 10.0;
    const totalPagar = subtotal + isv + costoEnvio;

    return (
      <div  className="min-h-screen bg-gray-100">
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

          {/* Datos básicos y título de la tabla */}
          <div className="flex flex-col items-start mb-3">
            <p className="text-black-800 mb-0.5">
              <span className="font-bold">Supermercado:</span> Easy Way
            </p>
            <p className="text-black-800 mb-0.5">
              <span className="font-bold">No. Factura:</span> #{factura.numero}
            </p>
            <p className="text-black-800 mb-2">
            <span className="font-bold">Fecha:</span> 26 de agosto de 2025
            </p>
            <h2 className="text-base font-bold text-black-800 mb-1">
              Resumen de la Orden
            </h2>
          </div>

          {/* Tabla de productos */}
         <div className="mt-[-8]"> {/* Margen superior negativo para subir la tabla */}
         <TablaProductos productos={productos} />
         </div>


          {/* Separador */}
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

              {/* Botón Exportar */}
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
