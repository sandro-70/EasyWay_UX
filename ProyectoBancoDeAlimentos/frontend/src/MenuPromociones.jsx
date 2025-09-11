import React from "react";
import { Link } from "react-router-dom";

const MenuPromociones = () => {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-10">
      <h1 className="text-3xl font-semibold text-orange-500 mb-10 text-center ">
        Promociones y descuentos
      </h1>

      <hr className="linea"></hr>

      <div className="flex flex-col gap-6 w-full max-w-md">
        <Link
          to="/campanaPromocional"
          className="border border-blue-300 rounded-2xl p-5 text-left hover:shadow-lg transition duration-300 block"
        >
          Campañas programadas
        </Link>
        <button className="border border-blue-300 rounded-2xl p-5 text-left hover:shadow-lg transition duration-300">
          Estadísticas de promoción
        </button>
        <button className="border border-blue-300 rounded-2xl p-5 text-left hover:shadow-lg transition duration-300">
          Definir cupones
        </button>
        <Link
          to="/AsignarDescuentos"
          className="border border-blue-300 rounded-2xl p-5 text-left hover:shadow-lg transition duration-300 block"
        >
          Campañas programadas
        </Link>
      </div>
    </main>
  );
};

export default MenuPromociones;
