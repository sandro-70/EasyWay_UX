import React, { Component } from "react";
import { withRouter } from "../utils/withRouter"; // HOC que inyecta navigate y params
import CalendarioIcon from "../images/calendario.png";
import PerfilSidebar from "../components/perfilSidebar";
class Facturas extends Component {
  state = {
    facturaSeleccionada: null,
    fechaFiltro: "",
  };

  handleSelect = (factura) => {
    this.setState({ facturaSeleccionada: factura });
  };

  handleVerDetalle = () => {
    const { facturaSeleccionada } = this.state;
    const { navigate } = this.props;

    if (facturaSeleccionada) {
      navigate(`/factura/${facturaSeleccionada.id}`);
    } else {
      alert("Seleccione primero una factura");
    }
  };

  handleFechaChange = (e) => {
    this.setState({ fechaFiltro: e.target.value });
  };

  render() {
    const facturas = [
      { id: 1, numero: "123456", fecha: "26/08/2025" },
      { id: 2, numero: "123457", fecha: "12/06/2024" },
      { id: 3, numero: "123458", fecha: "08/06/2024" },
      { id: 4, numero: "123426", fecha: "06/04/2024" },
      { id: 5, numero: "123436", fecha: "02/04/2024" },
    ];

    return (
      <div className="min-h-screen bg-gray-100">
         <section className="sidebar">
        <PerfilSidebar />
      </section>
      <div className="min-h-screen w-full bg-white flex justify-center items-center">
        
        {/* Contenedor sombreado subido un poco con -mt-6 */}
        <div className="w-[700px] p-4 max-h-[500px] overflow-y-auto rounded border border-gray-300 bg-white -mt-40">
          <h1 className="text-[#f0833e] text-3xl mb-2 font-normal text-center">
            Facturas
          </h1>
          <div className="h-0.5 bg-[#f0833e] mb-4 w-full mx-auto"></div>

          <div className="relative w-full border border-gray-300 rounded bg-white">
            <div className="flex justify-between items-center bg-[#2b6daf] text-white px-3 py-1 rounded-t">
              <h2 className="font-normal text-lg">Facturas emitidas</h2>
              <div className="flex items-center gap-2">
                <select
                  className="px-2 py-1 text-black font-bold w-32 border border-gray-300 rounded h-8"
                  value={this.state.fechaFiltro}
                  onChange={this.handleFechaChange}
                >
                  <option value="">Fechas</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
                <img src={CalendarioIcon} alt="Calendario" className="h-5 w-5" />
              </div>
            </div>

            <div className="relative pr-4">
              <div
                className="absolute right-2 w-1 bg-[#D8DADC] rounded"
                style={{
                  top: "3.5rem",
                  height: "150px",
                }}
              ></div>

              {facturas.map((f, index) => (
                <div
                  key={f.id}
                  className={`cursor-pointer p-2 hover:bg-blue-50 transition-colors ${
                    this.state.facturaSeleccionada?.id === f.id ? "bg-blue-100" : ""
                  } ${index < facturas.length - 1 ? "border-b border-gray-300" : ""}`}
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

          <div className="mt-3 flex justify-end">
            <button
              className="bg-[#2e9fd4] text-white font-semibold px-5 py-2 rounded hover:bg-[#16324f] transition-colors"
              onClick={this.handleVerDetalle}
            >
              Ver Detalle
            </button>
          </div>
        </div>
      </div>
      </div>
    );
  }
}

export default withRouter(Facturas);
