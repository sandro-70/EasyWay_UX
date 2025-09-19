import React from "react";
import { Link } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { Calendar, BarChart, Ticket, Tag, Megaphone } from "lucide-react";

const MenuPromociones = () => {
  const { moveButton } = useOutletContext();
  return (
    <div
      className="px-8"
      style={{ ...styles.fixedShell, backgroundColor: "#f3f4f6" }}
    >
      <div
        className={`flex flex-col w-full pt-2 px-8 transition-all duration-300 ${
          moveButton ? "ml-44" : "ml-0"
        }`}
      >
        <main className="min-h-screen text-left">
          <h1 className="font-roboto font-medium text-[#F0833E] pb-3 text-5xl">
            Promociones y Descuentos
          </h1>

          <hr className="h-[2px] bg-[#F0833E]"></hr>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 py-8">
            <Link
              to="/campanaviews"
              className="bg-white rounded-2xl p-6 flex flex-col items-center text-center shadow-md border border-blue-100 transition-transform duration-300 hover:scale-105 hover:shadow-lg"
            >
              <Calendar size={40} color="#3b82f6" />
              <h2 className="mt-4 text-xl font-semibold text-gray-800">
                Campañas programadas
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Crea y gestiona tus campañas de promoción.
              </p>
            </Link>

            <Link
              to="/tablaPromociones"
              className="bg-white rounded-2xl p-6 flex flex-col items-center text-center shadow-md border border-blue-100 transition-transform duration-300 hover:scale-105 hover:shadow-lg"
            >
              <BarChart size={40} color="#3b82f6" />
              <h2 className="mt-4 text-xl font-semibold text-gray-800">
                Estadísticas de Promoción
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Analiza el rendimiento de tus promociones.
              </p>
            </Link>

            <Link
              to="/gestionCupones"
              className="bg-white rounded-2xl p-6 flex flex-col items-center text-center shadow-md border border-blue-100 transition-transform duration-300 hover:scale-105 hover:shadow-lg"
            >
              <Ticket size={40} color="#3b82f6" />
              <h2 className="mt-4 text-xl font-semibold text-gray-800">
                Definir cupones
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Genera y configura nuevos cupones de descuento.
              </p>
            </Link>

            <Link
              to="/asignarDescuento"
              className="bg-white rounded-2xl p-6 flex flex-col items-center text-center shadow-md border border-blue-100 transition-transform duration-300 hover:scale-105 hover:shadow-lg"
            >
              <Tag size={40} color="#3b82f6" />
              <h2 className="mt-4 text-xl font-semibold text-gray-800">
                Asignar Descuentos
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Aplica descuentos a productos o categorías.
              </p>
            </Link>

            <Link
              to="/configBanner"
              className="bg-white rounded-2xl p-6 flex flex-col items-center text-center shadow-md border border-blue-100 transition-transform duration-300 hover:scale-105 hover:shadow-lg"
            >
              <Megaphone size={40} color="#3b82f6" />
              <h2 className="mt-4 text-xl font-semibold text-gray-800">
                Configurar Banner Promocional
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Personaliza los banners promocionales en la tienda.
              </p>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
};

const styles = {
  fixedShell: {
    position: "absolute",
    top: "90px",
    left: 0,
    right: 0,
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
};

export default MenuPromociones;
