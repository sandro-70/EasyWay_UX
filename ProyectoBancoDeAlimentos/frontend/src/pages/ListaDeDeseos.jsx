// frontend/pages/ListaDeDeseos.jsx
import React, { useEffect, useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { getProductosFav } from "../api/lista_deseos";
import { getListaDeseos } from "../api/listaDeseosApi";
import { eliminarDeListaDeseos } from "../api/listaDeseosApi";
import { vaciarListaDeseos } from "../api/listaDeseosApi";
import { getProductosRecomendados } from "../api/InventarioApi";
import { AddNewCarrito } from "../api/CarritoApi";
import axiosInstance from "../api/axiosInstance";
import { UserContext } from "../components/userContext";

import appleImage from "../images/appleImage.png";
import carritoImage from "../images/ncarrito.png";
import izqImage from "../images/izq.png";
import derImage from "../images/der.png";
import PerfilSidebar from "../components/perfilSidebar";

/* ===== helpers URL imagen (exacto a AgregarCarrito) ===== */
const BACKEND_ORIGIN = (() => {
  const base = axiosInstance?.defaults?.baseURL;
  try {
    const u = base
      ? base.startsWith("http")
        ? new URL(base)
        : new URL(base, window.location.origin)
      : new URL(window.location.origin);
    return `${u.protocol}//${u.host}`;
  } catch {
    return window.location.origin;
  }
})();

// si recibes un nombre de archivo => /api/images/productos/<archivo>
const backendImageUrl = (fileName) =>
  fileName
    ? `${BACKEND_ORIGIN}/api/images/productos/${encodeURIComponent(fileName)}`
    : "";

// 👇 pega esto (reemplaza tu versión)
// 👇 helpers idénticos/compatibles con AgregarCarrito
const toPublicFotoSrc = (nameOrPath) => {
  if (!nameOrPath) return "";
  const s = String(nameOrPath).trim();

  // absoluta (http/https/data/blob)
  if (/^(https?:|data:|blob:)/i.test(s)) return s;

  // rutas ya “tipo backend”
  if (s.startsWith("/api/images/")) return `${BACKEND_ORIGIN}${encodeURI(s)}`;
  if (s.startsWith("/images/"))     return `${BACKEND_ORIGIN}/api${encodeURI(s)}`;

  // casos comunes: "productos/archivo.jpg"
  if (/^\/?productos\//i.test(s)) {
    const clean = s.startsWith("/") ? s.slice(1) : s; // "productos/..."
    return `${BACKEND_ORIGIN}/api/images/${encodeURI(clean)}`; // -> /api/images/productos/...
  }

  // nombre suelto "archivo.jpg"
  return `${BACKEND_ORIGIN}/api/images/productos/${encodeURIComponent(s)}`;
};

// 👇 saca la PRIMERA imagen robustamente (array de objetos, array de strings, string-JSON o campos sueltos)
const getFirstImageUrl = (prod) => {
  if (!prod) return null;

  let arr =
    prod.imagenes ?? prod.Imagenes ?? prod.images ?? prod.fotos ?? prod.Fotos ?? null;

  if (typeof arr === "string") {
    try {
      const parsed = JSON.parse(arr);
      if (Array.isArray(parsed)) arr = parsed;
    } catch { /* no era JSON */ }
  }

  // array de strings
  if (Array.isArray(arr) && arr.length && typeof arr[0] === "string") {
    const u = toPublicFotoSrc(arr[0]);
    if (u) return u;
  }

  // array de objetos
  if (Array.isArray(arr) && arr.length && typeof arr[0] === "object") {
    const x = arr[0] || {};
    const candidates = [
      x.url_imagen, x.urlImagen, x.url, x.ruta, x.path, x.imagen, x.foto,
      x.nombre_archivo, x.file_name,
    ].filter(Boolean);
    for (const c of candidates) {
      const u = toPublicFotoSrc(c);
      if (u) return u;
    }
  }

  // campos sueltos en el producto
  const single = [
    prod.url_imagen, prod.urlImagen, prod.imagen, prod.foto, prod.ruta, prod.path,
    prod.nombre_archivo, prod.file_name, prod.imagen_principal, prod.foto_principal,
  ].filter(Boolean);
  for (const c of single) {
    const u = toPublicFotoSrc(c);
    if (u) return u;
  }

  return null;
};

/* ===== Card de producto ===== */
function ProductoCard({ p, onAdd, onOpen }) {
  // siempre pasamos por toPublicFotoSrc por si p.img viene como nombre/relativa
  const src =  p.img || "";
  return (
    <div className="relative bg-white rounded-2xl p-3 shadow-lg w-full">
      {/* capa clicable para abrir detalle */}
      <button
        onClick={onOpen}
        className="absolute inset-0 rounded-2xl focus:outline-none"
        aria-label={`Abrir ${p.name}`}
        style={{ zIndex: 1 }}
      />
      <div className="absolute top-2 left-2 w-5 h-5">
        <img src={carritoImage} alt="" className="w-full h-full object-contain" />
      </div>

      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={i < p.rating ? "#60A5FA" : "none"}
          >
            <path
              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
              stroke="#60A5FA"
              strokeWidth="0.6"
            />
          </svg>
        ))}
      </div>

      <div className="flex justify-center mt-2 relative z-0">
        <div className="bg-white rounded-xl p-2 shadow-lg w-24 h-24 flex items-center justify-center">
          <img
            src={src || appleImage}
            alt={p.name}
            className="max-h-20 object-contain"
            onError={(e) => (e.currentTarget.src = appleImage)}
          />
        </div>
      </div>

      <div className="mt-2 text-sm text-gray-500 text-center relative z-0">
        <div className="font-semibold text-gray-700">{p.price}</div>
        <div className="mt-1 line-clamp-2">{p.name}</div>
      </div>

      <div className="mt-3 pt-1 relative z-10">
        <button
          onClick={onAdd}
          className="h-10 rounded-full bg-orange-400 w-11/12 mx-auto flex items-center justify-center cursor-pointer hover:bg-orange-500 shadow-md"
        >
          <span className="text-white font-semibold text-xs text-center">
            AGREGAR AL CARRITO
          </span>
        </button>
      </div>
    </div>
  );
}

export default function ListaDeDeseos({ id_usuario: idFromProps }) {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const id_usuario = useMemo(
    () => idFromProps || user?.id_usuario || localStorage.getItem("id_usuario"),
    [idFromProps, user?.id_usuario]
  );

  const tabs = ["Más recientes", "En Oferta", "Disponibles"];
  const [activeTab, setActiveTab] = useState("Más recientes");

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  /* ===== Recomendados (mismo diseño) ===== */
  const [startIndex, setStartIndex] = useState(0);
  const visibleCount = 5;
  const [recomendados, setRecomendados] = useState([]);
  const [loadingRecomendados, setLoadingRecomendados] = useState(true);

  /* ===== Normaliza el favorito al formato del card ===== */
  const normalizeFav = (row) => {
    const prod =
      row?.Producto ||
      row?.producto ||
      row?.producto_deseado ||
      row?.productoFavorito ||
      row;

    const id = prod?.id_producto ?? row?.id_producto ?? null;
    const nombre = prod?.nombre ?? prod?.producto_nombre ?? "Producto";
    const priceNum = Number(prod?.precio_base ?? prod?.precio ?? 0);

    const img = getFirstImageUrl(prod); // <- mismo criterio que AgregarCarrito

    const rating = Math.max(
      0,
      Math.min(
        5,
        Math.round(
          Number(prod?.rating_avg ?? prod?.estrellas ?? prod?.valoracion ?? 0)
        )
      )
    );

    const available =
      prod?.stock_en_sucursal != null
        ? Number(prod.stock_en_sucursal) > 0
        : prod?.stock_disponible != null
        ? Number(prod.stock_disponible) > 0
        : true;

    const onSale = Boolean(prod?.en_oferta ?? false);

    // Extraer etiquetas del producto
    const etiquetas = prod?.etiquetas || [];

    return {
      id,
      name: nombre,
      priceNum,
      price: `L. ${priceNum.toFixed(2)}`,
      img, // puede venir absoluta, relativa o nombre — siempre lo pasamos por toPublicFotoSrc en el render
      rating,
      available,
      onSale,
      etiquetas, // Agregar etiquetas al objeto normalizado
      // opcional: raw para debug rápido
      _raw: prod,
    };
  };

  /* ===== Cargar favoritos ===== */
  useEffect(() => {
    const fetchFavs = async () => {
      if (!id_usuario) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await getListaDeseos(id_usuario);
        const arr = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const favs = arr.map(normalizeFav).filter((p) => p.id != null);
        setProducts(favs);
      } catch (error) {
        console.error("Error al cargar favoritos:", error);
        toast.error(
          error?.response?.data?.message || "No se pudo cargar tu lista de deseos",
          { className: "toast-error" }
        );
      } finally {
        setLoading(false);
      }
    };
    fetchFavs();
  }, [id_usuario]);

  /* ===== Cargar productos recomendados ===== */
  useEffect(() => {
    const fetchRecomendados = async () => {
      try {
        setLoadingRecomendados(true);
        const res = await getProductosRecomendados();
        const arr = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const recs = arr.map(normalizeFav).filter((p) => p.id != null);
        setRecomendados(recs);
      } catch (error) {
        console.error("Error al cargar productos recomendados:", error);
        // No mostrar error al usuario para recomendaciones, solo loguear
        setRecomendados([]);
      } finally {
        setLoadingRecomendados(false);
      }
    };
    fetchRecomendados();
  }, []);

  /* ===== Filtros ===== */
  const filteredProducts = useMemo(() => {
    if (activeTab === "En Oferta") {
      return products.filter((p) => {
        // Filtrar por etiquetas que contengan "En Oferta" o similar
        const hasEnOfertaTag = p.etiquetas && Array.isArray(p.etiquetas) &&
          p.etiquetas.some(tag =>
            String(tag).includes('En oferta') ||
            String(tag).toLowerCase().includes('oferta') ||
            String(tag).toLowerCase().includes('descuento') ||
            String(tag).toLowerCase().includes('rebaja')
          );
        return hasEnOfertaTag;
      });
    }
    if (activeTab === "Disponibles") return products.filter((p) => p.available);
    return products; // Más recientes
  }, [products, activeTab]);

  /* ===== Handlers ===== */
  const handlePrev = () => setStartIndex((prev) => Math.max(prev - 1, 0));
  const handleNext = () =>
    setStartIndex((prev) =>
      Math.min(prev + 1, Math.max(0, recomendados.length - visibleCount))
    );

  const agregarAlCarrito = async (id_producto) => {
    try {
      await AddNewCarrito(id_producto, 1);
      toast.success("Producto agregado al carrito", { position: "top-right" });
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Error al agregar al carrito",
        { position: "top-right" }
      );
    }
  };

  /* ===== UI ===== */
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
        <section className="sidebar">
          <PerfilSidebar />
        </section>

        <div className="w-full max-w-[1080px] bg-white rounded-xl shadow-lg p-6 mb-8 mx-auto">
          {/* Título */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-orange-400 drop-shadow-md">
              Lista de Deseos
            </h1>
            <div
              className="mt-2 h-1 bg-orange-400 mx-auto rounded-full"
              style={{ width: "100%", maxWidth: "1080px" }}
            />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-4 mb-6 shadow-lg bg-gray-50 rounded-lg p-1">
            <div className="text-sm text-gray-700 font-semibold px-3">Ordenar Por:</div>
            <div className="flex overflow-hidden flex-1 rounded-lg">
              {tabs.map((t) => (
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

          {/* Contenido */}
          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Cargando tu lista de deseos…
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-gray-500">
              <div className="text-lg font-semibold">Aún no tienes productos aquí</div>
              <div className="text-sm">Agrega algunos desde la página de producto con el corazón ❤️</div>
            </div>
          ) : (
            <div className="overflow-y-auto h-[450px] w-full pb-4 scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-gray-200">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 px-4 mt-4">
                {filteredProducts.map((p) => (
                  <ProductoCard
                    key={p.id}
                    p={p}
                    onAdd={() => agregarAlCarrito(p.id)}
                    onOpen={() => navigate(`/producto/${p.id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recomendados */}
        <div className="mt-6 w-full max-w-[1080px] bg-white rounded-xl shadow-lg p-6 mx-auto">
          <h2 className="text-xl font-bold text-orange-400 mb-4">
            Productos que podrían interesarte
          </h2>

          {loadingRecomendados ? (
            <div className="h-[200px] flex items-center justify-center text-gray-500">
              Cargando recomendaciones...
            </div>
          ) : recomendados.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-lg font-semibold">No hay recomendaciones disponibles</div>
                <div className="text-sm">Explora nuestros productos para encontrar algo que te guste</div>
              </div>
            </div>
          ) : (
            <div className="relative flex items-center">
              <button
                onClick={handlePrev}
                disabled={startIndex === 0}
                className={`absolute left-[-18px] z-10 bg-white rounded-full p-3 shadow-md ${
                  startIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
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
                      onAdd={() => agregarAlCarrito(p.id)}
                      onOpen={() => navigate(`/producto/${p.id}`)}
                    />
                  ))}
              </div>

              <button
                onClick={handleNext}
                disabled={startIndex >= recomendados.length - visibleCount}
                className={`absolute right-[-18px] z-10 bg-white rounded-full p-3 shadow-md ${
                  startIndex >= recomendados.length - visibleCount ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
              >
                <img src={derImage} alt="Derecha" className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
