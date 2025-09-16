//frontend/pages/ListaDeDeseos.jsx
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getProductosFav } from "../api/lista_deseos"; // API que conecta con backend
import { AddNewCarrito } from "../api/CarritoApi"; // ❗ Este archivo debe existir
import appleImage from "../images/appleImage.png";
import carritoImage from "../images/ncarrito.png";
import izqImage from "../images/izq.png";
import derImage from "../images/der.png";
import PerfilSidebar from "../components/perfilSidebar";

export default function ListaDeDeseos({ id_usuario }) {
  const tabs = ["Ordenar Por:", "Más recientes", "En Oferta", "Disponibles"];
  const [activeTab, setActiveTab] = useState("Más recientes");
  const [products, setProducts] = useState([]);

  const [startIndex, setStartIndex] = useState(0);

  const recomendados = [
    {
      id: 1,
      name: "Manzana Roja",
      price: "L. 14.00",
      img: appleImage,
      rating: 2,
    },
    { id: 2, name: "Banano", price: "L. 8.00", img: appleImage, rating: 3 },
    { id: 3, name: "Pera", price: "L. 12.00", img: appleImage, rating: 1 },
    { id: 4, name: "Uvas", price: "L. 20.00", img: appleImage, rating: 2 },
    { id: 5, name: "Sandía", price: "L. 35.00", img: appleImage, rating: 3 },
    { id: 6, name: "Melón", price: "L. 30.00", img: appleImage, rating: 2 },
    { id: 7, name: "Fresa", price: "L. 18.00", img: appleImage, rating: 2 },
    { id: 8, name: "Mango", price: "L. 25.00", img: appleImage, rating: 3 },
    { id: 9, name: "Piña", price: "L. 28.00", img: appleImage, rating: 2 },
    { id: 10, name: "Cereza", price: "L. 40.00", img: appleImage, rating: 3 },
  ];

  const visibleCount = 5;

  useEffect(() => {
    async function fetchFavs() {
      try {
        const res = await getProductosFav(id_usuario);
        const favs = res.data.map((f) => ({
          id: f.id_producto,
          name: f.Producto?.nombre || "Producto",
          price: `L. ${f.Producto?.precio_base || "0.00"}`,
          img: f.Producto?.imagen || appleImage,
          rating: f.Producto?.rating || 2,
          available: true,
          onSale: false,
        }));
        setProducts(favs);
      } catch (error) {
        console.error("Error al cargar favoritos:", error);
      }
    }
    fetchFavs();
  }, [id_usuario]);

  const filteredProducts = products.filter((p) => {
    if (activeTab === "Más recientes") return true;
    if (activeTab === "En Oferta") return p.onSale;
    if (activeTab === "Disponibles") return p.available;
    return true;
  });

  const handlePrev = () => setStartIndex((prev) => Math.max(prev - 1, 0));
  const handleNext = () =>
    setStartIndex((prev) =>
      Math.min(prev + 1, recomendados.length - visibleCount)
    );

  const agregarAlCarrito = async (id_producto) => {
    try {
      await AddNewCarrito(id_producto, 1);
      toast.success("Producto agregado al carrito", { position: "top-right" });
    } catch (error) {
      toast.error("Error al agregar al carrito", { position: "top-right" });
    }
  };

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
      <div className="max-w-6xl w-full px-6 font-sans -mt-12 ml-[130px]">
        <section className="sidebar fixed top-35 left-0 w-64 h-[calc(100vh-64px)] bg-gray-100">
          <PerfilSidebar />
        </section>
        {/* Fondo unificado: título + ordenar por + productos */}
        <div className="w-full max-w-[1080px] bg-white rounded-xl shadow-lg p-6 mb-8 mx-auto">
          {/* Título */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-orange-400 drop-shadow-md">
              Lista de Deseos
            </h1>
            <div
              className="mt-2 h-1 bg-orange-400 mx-auto rounded-full"
              style={{ width: "100%", maxWidth: "1080px" }}
            ></div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-4 mb-6 shadow-lg bg-gray-50 rounded-lg p-1">
            <div className="text-sm text-gray-700 font-semibold px-3">
              Ordenar Por:
            </div>
            <div className="flex overflow-hidden flex-1 rounded-lg">
              {tabs.slice(1).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-5 py-3 text-sm whitespace-nowrap font-semibold focus:outline-none ${
                    activeTab === t ? "bg-gray-600 text-white" : "text-gray-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de productos filtrados */}
          <div className="overflow-y-auto h-[450px] w-full pb-4 scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-gray-200">
            <div className="grid grid-cols-5 gap-6 px-4 mt-8">
              {filteredProducts.map((p) => (
                <ProductoCard
                  key={p.id}
                  p={p}
                  agregarAlCarrito={agregarAlCarrito}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Recomendados con fondo */}
        <div className="mt-6 w-full max-w-[1080px] bg-white rounded-xl shadow-lg p-6 mx-auto">
          <h2 className="text-xl font-bold text-orange-400 mb-4">
            Productos que podrían interesarte
          </h2>
          <div className="relative flex items-center">
            <button
              onClick={handlePrev}
              className="absolute left-[-18px] z-10 bg-white rounded-full p-3 shadow-md"
            >
              <img src={izqImage} alt="Izquierda" className="w-6 h-6" />
            </button>

            <div className="flex gap-6 overflow-hidden w-full px-10">
              {recomendados
                .slice(startIndex, startIndex + visibleCount)
                .map((p) => (
                  <ProductoCard
                    key={`rec-${p.id}`}
                    p={p}
                    agregarAlCarrito={agregarAlCarrito}
                  />
                ))}
            </div>

            <button
              onClick={handleNext}
              className="absolute right-[-18px] z-10 bg-white rounded-full p-3 shadow-md"
            >
              <img src={derImage} alt="Derecha" className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductoCard({ p, agregarAlCarrito }) {
  return (
    <div className="relative bg-white rounded-2xl p-3 shadow-lg w-full">
      <div className="absolute top-2 left-2 w-5 h-5">
        <img
          src={carritoImage}
          alt="Carrito"
          className="w-full h-full object-contain"
        />
      </div>
      <div className="absolute top-2 right-2 flex items-center gap-1">
        {/* Ahora 5 estrellas */}
        {Array.from({ length: 5 }).map((_, i) => (
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
      <div className="flex justify-center mt-2">
        <div className="bg-white rounded-xl p-2 shadow-lg w-24 h-24 flex items-center justify-center">
          <img src={p.img} alt={p.name} className="max-h-20 object-contain" />
        </div>
      </div>
      <div className="mt-2 text-sm text-gray-500 text-center">
        <div className="font-semibold text-gray-700">{p.price}</div>
        <div className="mt-1">{p.name}</div>
      </div>
      <div className="mt-3 pt-1">
        <div
          onClick={() => agregarAlCarrito(p.id)}
          className="h-10 rounded-full bg-orange-400 w-11/12 mx-auto flex items-center justify-center cursor-pointer hover:bg-orange-500 shadow-md"
        >
          <span className="text-white font-semibold text-xs text-center">
            AGREGAR AL CARRITO
          </span>
        </div>
      </div>
    </div>
  );
}