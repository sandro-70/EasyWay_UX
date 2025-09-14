import React, { useState } from "react";
import appleImage from "../images/appleImage.png";
import carritoImage from "../images/ncarrito.png";

export default function ListaDeDeseos() {
  const tabs = ["Ordenar Por:", "Más recientes", "En Oferta", "Disponibles"];
  const [activeTab, setActiveTab] = useState("Más recientes");

  // Generar productos de ejemplo
  const products = Array.from({ length: 12 }).map((_, i) => ({
    id: i + 1,
    name: "Manzana",
    price: "L. 14.00",
    img: appleImage,
    rating: 2,
    available: i % 2 === 0,
    onSale: i % 3 === 0,
  }));

  // Filtrar según la pestaña activa
  const filteredProducts = products.filter((p) => {
    if (activeTab === "Más recientes") return true;
    if (activeTab === "En Oferta") return p.onSale;
    if (activeTab === "Disponibles") return p.available;
    return true;
  });

  // Limitar a 6 productos (2 filas x 3 columnas)
  const limitedProducts = filteredProducts.slice(0, 6);

  // Dividir en filas
  const firstRow = limitedProducts.slice(0, 3);
  const secondRow = limitedProducts.slice(3, 6);

  return (
    <div
      style={{
        position: "absolute",
        top: "180px",
        left: 0,
        right: 0,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div className="max-w-6xl w-full px-6 font-sans">
        {/* Título principal */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-orange-400 drop-shadow-md">
            Lista de Deseos
          </h1>
  {/* Línea decorativa un poco menos larga */}
  <div className="mt-2 h-1 bg-orange-400 mx-auto rounded-full" style={{ width: "608px" }}></div>
</div>

  {/* Tabs / filtros */}
<div
  className="flex items-center gap-4 mb-6"
  style={{ width: "608px", margin: "0 auto", marginTop: "-10px" }}
>
  <div className="text-sm text-gray-600">Ordenar Por:</div>
  <div className="flex bg-white rounded-lg shadow-sm overflow-hidden flex-1">
    {tabs.slice(1).map((t) => (
      <button
        key={t}
        onClick={() => setActiveTab(t)}
        className={`px-5 py-2 text-sm whitespace-nowrap focus:outline-none ${
          activeTab === t ? "bg-gray-300 text-white" : "text-gray-500"
        }`}
      >
        {t}
      </button>
    ))}
  </div>
</div>

        {/* Contenedor con scroll horizontal para ambas filas */}
        <div className="overflow-x-auto w-full pb-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
<div className="flex flex-col items-center" style={{ marginTop: "20px" }}>
            {/* Fila 1 */}
            <div className="flex gap-4">
              {firstRow.map((p) => (
                <ProductoCard key={p.id} p={p} />
              ))}
            </div>
            {/* Fila 2 */}
            <div className="flex gap-4 mt-6">
              {secondRow.map((p) => (
                <ProductoCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de producto
function ProductoCard({ p }) {
  return (
    <div className="relative bg-white rounded-2xl p-3 shadow-sm w-48 flex-shrink-0">
      {/* Icono carrito */}
      <div className="absolute top-2 left-2 w-5 h-5">
        <img src={carritoImage} alt="Carrito" className="w-full h-full object-contain" />
      </div>

      {/* Rating stars */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <svg
            key={i}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={i < p.rating ? "#60A5FA" : "none"}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
              stroke="#60A5FA"
              strokeWidth="0.6"
            />
          </svg>
        ))}
      </div>

      {/* Imagen */}
      <div className="flex justify-center mt-2">
        <div className="bg-white rounded-xl p-2 shadow-md w-20 h-20 flex items-center justify-center">
          <img src={p.img} alt={p.name} className="max-h-16 object-contain" />
        </div>
      </div>

      {/* Precio y nombre */}
      <div className="mt-2 text-sm text-gray-500 text-center">
        <div className="font-semibold text-gray-700">{p.price}</div>
        <div className="mt-1">{p.name}</div>
      </div>

      {/* Barra inferior con botón "AGREGAR AL CARRITO" */}
      <div className="mt-3 pt-1">
        <div className="h-10 rounded-full bg-orange-400 w-5/6 mx-auto flex items-center justify-center cursor-pointer hover:bg-orange-500">
          <span className="text-white font-semibold text-xs text-center">
            AGREGAR AL CARRITO
          </span>
        </div>
      </div>
    </div>
  );
}
