import React from "react";
import { Link } from "react-router-dom";
import { useOutletContext } from "react-router-dom";

const MenuPromociones = () => {
  const { moveButton } = useOutletContext();
  return (
    <div
      className="px-12"
      style={{ ...styles.fixedShell, backgroundColor: "#f3f4f6" }}
    >
      <div
        className={`flex flex-col w-full  pt-2 px-8 transition-all duration-300   ${
          moveButton ? "ml-44" : "ml-0"
        }`}
      >
        <main className=" min-h-screen text-left">
          <h1 className=" font-roboto font-medium text-[#F0833E] pb-3 text-6xl pl-6">
            Promociones y Descuentos
          </h1>

          <hr className="h-[2px] bg-[#F0833E]"></hr>

          <div className="flex flex-col px-4 py-8 gap-4 text-2xl font-normal w-full max-w-md">
            <Link
              to="/campanaPromocional"
              className="border border-blue-300 rounded-2xl p-5 text-left shadow-neutral-600 shadow-sm block"
            >
              Campañas programadas
            </Link>
            <Link
              to="/tablaPromociones"
              className="border border-blue-300 rounded-2xl p-5 text-left shadow-neutral-600 shadow-sm block"
            >
              Estadisticas de Promocion
            </Link>
            <Link
              to="/definirCupones"
              className="border border-blue-300 rounded-2xl p-5 text-left shadow-neutral-600 shadow-sm block"
            >
              Definir cupones
            </Link>

            <Link
              to="/asignarDescuento"
              className="border border-blue-300 rounded-2xl p-5 text-left shadow-neutral-600 shadow-sm block"
            >
              Asignar Descuentos
            </Link>

            <Link
              to="/configBanner"
              className="border border-blue-300 rounded-2xl p-5 text-left shadow-neutral-600 shadow-sm block"
            >
              Configurar Banner Promocional
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
