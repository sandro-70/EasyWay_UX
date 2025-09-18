import React, { useRef, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import axiosInstance from "../api/axiosInstance"; // ⬅️ nuevo
import { EffectCoverflow, Autoplay } from "swiper/modules";
import { useNavigate } from "react-router-dom";
import { getAllProducts, getProductoById } from "../api/InventarioApi";
import { getProductosDestacados, getProductosTendencias } from "../api/InventarioApi";

import { ObtenerCategoria, ListarCategoria } from "../api/CategoriaApi";
import { AddNewCarrito, ViewCar, SumarItem } from "../api/CarritoApi";
import { getPromocionesOrden } from "../api/PromocionesApi";
import { useCart } from "../utils/CartContext";
import { useSearch } from "../searchContext";
import { toast } from "react-toastify";
import "../toast.css";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/autoplay";

import carrot from "../images/carrot.png";
import apple from "../images/apple.png";
import pet from "../images/pet.png";
import ham from "../images/ham.png";
import cake from "../images/cake.png";
import bread from "../images/bread.png";
//import juice from "../images/juice.png";
import clean from "../images/clean.png";
import soccer from "../images/soccer.png";
import phone from "../images/phone.png";
import pharmacy from "../images/pharmacy.png";
//import milk from "../images/milk.png";
import arrowL from "../images/arrowL.png";
import arrowR from "../images/arrowR.png";
import appleImage from "../images/appleImage.png";
//import coffee from "../images/coffee.png";
import banner1 from "../images/banner1.png";
import banner2 from "../images/banner2.png";
import banner3 from "../images/banner3.png";

const banners = [
  { idCategoriaEnDescuento: 1, imagen: banner1 },
  { idCategoriaEnDescuento: 2, imagen: banner2 },
  { idCategoriaEnDescuento: 3, imagen: banner3 },
];


// ====== helpers para construir la URL absoluta desde el backend ======
const BACKEND_ORIGIN = (() => {
  const base = axiosInstance?.defaults?.baseURL;
  try {
    const u = base
      ? (base.startsWith("http") ? new URL(base) : new URL(base, window.location.origin))
      : new URL(window.location.origin);
    return `${u.protocol}//${u.host}`;
  } catch {
    return window.location.origin;
  }
})();

// para nombres de archivo tipo "foto.jpg"
const backendImageUrl = (fileName) =>
  fileName ? `${BACKEND_ORIGIN}/api/images/productos/${encodeURIComponent(fileName)}` : "";

// adapta la ruta que venga en DB a una URL válida del backend
const toPublicFotoSrc = (nameOrPath, defaultDir = "productos") => {
   if (!nameOrPath) return "";
   const s = String(nameOrPath).trim();
   if (/^https?:\/\//i.test(s)) return s;                          // ya es absoluta
   if (s.startsWith("/api/images/")) return `${BACKEND_ORIGIN}${encodeURI(s)}`;
   if (s.startsWith("/images/"))      return `${BACKEND_ORIGIN}/api${encodeURI(s)}`;
   // nombre suelto => /api/images/<defaultDir>/<archivo>
   return `${BACKEND_ORIGIN}/api/images/${encodeURIComponent(defaultDir)}/${encodeURIComponent(s)}`;
 };


const InicioUsuario = () => {
  const { searchText } = useSearch();

  const navigate = useNavigate();

  const catRef = useRef(null);
  const prodRefDestacados = useRef(null);
  const prodRefTendencias = useRef(null);
  const swiperRef = useRef(null);

  const { incrementCart } = useCart();

  const [hoveredIndex, setHoveredIndex] = React.useState(null);
  const [hoveredProductDest, setHoveredProductDest] = React.useState(null);
  const [hoveredProductTrend, setHoveredProductTrend] = React.useState(null);
  const [hoveredBanner, setHoveredBanner] = React.useState(null);

  const [products, setProducts] = useState([]);
  const [destacados, setDestacados] = useState([]);
  const [tendencias, setTendencias] = useState([]);
  const [promociones, setPromociones] = useState([]);

 useEffect(() => {
   const fetchDestacados = async () => {
     try {
       const res = await getProductosDestacados(); // ⬅️ /api/producto/destacados
       setDestacados(Array.isArray(res?.data) ? res.data : []);
     } catch (err) {
       console.error("[DESTACADOS] error:", err?.response?.data || err);
       // Fallback suave: toma 10 del catálogo general si falla la API
       try {
         const all = await getAllProducts();
         setDestacados((Array.isArray(all?.data) ? all.data.slice(0, 10) : []));
       } catch (e2) {
         toast.error("No se pudieron cargar los destacados", { className: "toast-error" });
       }
     }
   };
   fetchDestacados();
 }, []);

 useEffect(() => {
   const fetchTendencias = async () => {
     try {
       const res = await getProductosTendencias(); // ⬅️ /api/producto/tendencias
       setTendencias(Array.isArray(res?.data) ? res.data : []);
     } catch (err) {
       console.error("[TENDENCIAS] error:", err?.response?.data || err);
       // Fallback: si falla, mostramos los destacados para no romper UI
       setTendencias((prev) => (destacados.length ? destacados : prev));
     }
   };
   fetchTendencias();
 }, [destacados]);

// === Productos que están en alguna promoción (por id_producto) ===
const [promoProductIds, setPromoProductIds] = useState(new Set());

useEffect(() => {
  const fetchPromosDetalles = async () => {
    try {
      // GET http://localhost:3001/api/promociones/detalles
      const res = await axiosInstance.get("/api/promociones/detalles");
      const lista = Array.isArray(res?.data) ? res.data : [];
      const ids = new Set();
      // Cada promo trae un array de id de productos
      for (const promo of lista) {
        for (const pid of (promo.productos || [])) {
          ids.add(Number(pid));
        }
      }
      setPromoProductIds(ids);
      console.log("[PROMOS DETALLES] ids con promo:", Array.from(ids));
    } catch (err) {
      console.error("[PROMOS DETALLES] error:", err?.response?.data || err);
    }
  };
  fetchPromosDetalles();
}, []);

// helper
const hasPromo = (idProducto) => promoProductIds.has(Number(idProducto));

  const [categoriesData, setCategoriesData] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await ListarCategoria();
        setCategoriesData(res.data);
        console.log(res.data);
      } catch (err) {
        console.error("[CATEGORIES] error:", err?.response?.data || err);
        toast.error(err?.response?.data?.message || "Error al cargar categorías", { className: "toast-error" });
      }
    };
    fetchCategories();
  }, []);

  const [carrito, setCarrito] = useState([]);

  // === productos → [id_promocion] ===
const [promosPorProducto, setPromosPorProducto] = useState({});

// === id_promocion → info (porcentaje/fijo, fechas, activa) ===
const [promosInfo, setPromosInfo] = useState({});

// ya tienes este:

// 1) /api/promociones/detalles  → mapea productos a promociones
useEffect(() => {
  const fetchPromosDetalles = async () => {
    try {
      const res = await axiosInstance.get("/api/promociones/detalles");
      const lista = Array.isArray(res?.data) ? res.data : [];
      const ids = new Set();
      const map = {};

      for (const promo of lista) {
        const pidArr = Array.isArray(promo.productos) ? promo.productos : [];
        for (const pid of pidArr) {
          const idNum = Number(pid);
          ids.add(idNum);
          if (!map[idNum]) map[idNum] = [];
          map[idNum].push(Number(promo.id_promocion));
        }
      }
      setPromoProductIds(ids);
      setPromosPorProducto(map);
      console.log("[DETALLES] promosPorProducto:", map);
    } catch (err) {
      console.error("[PROMOS DETALLES] error:", err?.response?.data || err);
    }
  };
  fetchPromosDetalles();
}, []);

// 2) /api/promociones/listarorden → info de descuento/fechas
useEffect(() => {
  const fetchPromosInfo = async () => {
    try {
      const res = await axiosInstance.get("/api/promociones/listarorden");
      const arr = Array.isArray(res?.data) ? res.data : [];
      const map = {};
      for (const p of arr) {
        map[Number(p.id_promocion)] = {
          id_promocion: Number(p.id_promocion),
          id_tipo_promo: Number(p.id_tipo_promo),
          valor_porcentaje: p.valor_porcentaje != null ? parseFloat(p.valor_porcentaje) : null,
          valor_fijo: p.valor_fijo != null ? Number(p.valor_fijo) : null,
          compra_min: p.compra_min != null ? Number(p.compra_min) : null,
          fecha_inicio: p.fecha_inicio || null,
          fecha_termina: p.fecha_termina || null,
          activa: p.activa === true || p.activa === 1 || p.activa === "true",
        };
      }
      setPromosInfo(map);
      console.log("[LISTARORDEN] promosInfo:", map);
    } catch (err) {
      console.error("[PROMOS LISTARORDEN] error:", err?.response?.data || err);
    }
  };
  fetchPromosInfo();
}, []);


const isDateInRange = (startStr, endStr) => {
  const today = new Date();
  const start = startStr ? new Date(startStr) : null;
  const end   = endStr   ? new Date(endStr)   : null;
  if (start && today < start) return false;
  if (end && today > end) return false; // inclusivo está bien para este caso
  return true;
};

const computeDiscountedPriceByPromo = (basePrice, pInfo) => {
  if (!pInfo?.activa || !isDateInRange(pInfo.fecha_inicio, pInfo.fecha_termina)) return null;

  const price = Number(basePrice) || 0;
  if (price <= 0) return null;

  // Solo aplicamos precio unitario para tipos con descuento directo
  // 1 = porcentual, 2 = fijo (según tu lógica del carrito)
  if (pInfo.id_tipo_promo === 1 && pInfo.valor_porcentaje > 0) {
    const pct = pInfo.valor_porcentaje / 100;
    return Math.max(0, price * (1 - pct));
  }
  if (pInfo.id_tipo_promo === 2 && pInfo.valor_fijo > 0) {
    return Math.max(0, price - pInfo.valor_fijo);
  }
  // Otros tipos (3,4,5) no alteran precio unitario aquí
  return null;
};

const bestPromoPriceForProduct = (product) => {
  const base = Number(product?.precio_base) || 0;
  const ids = promosPorProducto[Number(product?.id_producto)] || [];
  let best = null;

  for (const idPromo of ids) {
    const info = promosInfo[idPromo];
    const discounted = computeDiscountedPriceByPromo(base, info);
    if (discounted == null) continue;

    if (best == null || discounted < best.finalPrice) {
      best = { finalPrice: discounted, promoId: idPromo };
    }
  }
  return best; // {finalPrice, promoId} | null
};

  // Promociones
useEffect(() => {
  const fetchPromosOrden = async () => {
    try {
      const res = await getPromocionesOrden();
      const ordered = (Array.isArray(res?.data) ? res.data : [])
        .map((item) => {
          const ordenNum = Number(item.orden);
          return {
            id_promocion: item.id_promocion,
            id_tipo_promo: item.id_tipo_promo,
            orden: Number.isFinite(ordenNum) ? ordenNum : NaN,
            name: item.nombre_promocion,
            description: item.descripción || item.descripcion || "",
            banner_url: item.banner_url,
            activa:
              item.activa === true || item.activa === 1 || item.activa === "true",
          };
        })
        // ✅ solo activas y con orden válido > 0
        .filter((p) => p.activa && Number.isFinite(p.orden) && p.orden > 0)
        // ✅ orden estable (por orden y luego por id para desempatar)
        .sort((a, b) => {
          if (a.orden !== b.orden) return a.orden - b.orden;
          return (Number(a.id_promocion) || 0) - (Number(b.id_promocion) || 0);
        });

      setPromociones(ordered);
      console.log("[PROMOS ORDENADAS > 0]", ordered);
    } catch (err) {
      console.error("[PROMOS] error:", err?.response?.data || err);
      toast.error(
        err?.response?.data?.message || "Error al cargar promociones",
        { className: "toast-error" }
      );
    }
  };
  fetchPromosOrden();
}, []);


useEffect(() => {
  if (!swiperRef.current || promociones.length === 0) return;

  // índice del menor orden (típicamente el que tiene orden === 1)
  const idx = promociones.reduce((best, p, i) =>
    (promociones[i].orden ?? Infinity) < (promociones[best].orden ?? Infinity)
      ? i
      : best
  , 0);

  // Asegura que Swiper renderice y luego muévete al slide correcto SIN animación
  swiperRef.current.update?.();
  swiperRef.current.slideTo(idx, 0, false);
}, [promociones]);


  const handleAgregar = async (id_producto) => {
    if (!id_producto) {
      toast.error("ID de producto no válido", { className: "toast-error" });
      return;
    }

    try {
      console.log("Agregando producto:", id_producto);

      // Obtener carrito actual
      const carritoActual = await ViewCar();
      const carritoDetalles = carritoActual.data.carrito_detalles ?? [];

      // Buscar si el producto ya existe
      const productoExistente = carritoDetalles.find(
        (item) => item.producto.id_producto === id_producto
      );

      if (productoExistente) {
        const cantidadActual = productoExistente.cantidad_unidad_medida || 0;
        const nuevaCantidad = cantidadActual + 1;

        console.log(`Actualizando de ${cantidadActual} a ${nuevaCantidad}`);
        toast(`Se han agregado ${nuevaCantidad} cantidades del producto`, { className: "toast-default" });

        // Actualizar en backend
        await SumarItem(id_producto, nuevaCantidad);

        // Actualizar estado local del carrito (si lo tienes)
        setCarrito((prev) => {
          if (Array.isArray(prev)) {
            return prev.map((item) =>
              item.producto.id_producto === id_producto
                ? {
                    ...item,
                    cantidad_unidad_medida: nuevaCantidad,
                    subtotal_detalle: item.producto.precio_base * nuevaCantidad,
                  }
                : item
            );
          }
          return prev;
        });
        incrementCart(1);
      } else {
        console.log("Producto nuevo, agregando al carrito");
        toast(`Producto agregado al carrito`, { className: "toast-default" });
        // Agregar nuevo producto
        await AddNewCarrito(id_producto, 1);

        // Recargar carrito completo para obtener el nuevo producto
        const carritoActualizado = await ViewCar();
        const nuevosDetalles = carritoActualizado.data.carrito_detalles ?? [];
        setCarrito(nuevosDetalles);

        incrementCart(1);
      }
    } catch (error) {
      console.error("Error:", error);

      // Si el carrito está vacío, intentar crear uno nuevo
      if (error?.response?.status === 404) {
        try {
          await AddNewCarrito(id_producto, 1);

          // Recargar carrito
          const carritoNuevo = await ViewCar();
          const nuevosDetalles = carritoNuevo.data.carrito_detalles ?? [];
          setCarrito(nuevosDetalles);

          toast(`Producto agregado al carrito`, { className: "toast-default" });
        } catch (err) {
          console.error("Error creando carrito:", err);
          toast.error("No se pudo agregar el producto al carrito", { className: "toast-error" });
        }
      } else {
        const errorMessage =
          error?.response?.data?.msg ||
          error?.response?.data?.message ||
          error?.message ||
          "No se pudo procesar el carrito";

        toast.error("Debe iniciar sesión", { className: "toast-error" });
        return navigate("/login");
      }
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/producto/${productId}`);
  };

  const handleCategoryClick = (categoryId) => {
    navigate(`/categoria/${categoryId}`);
  };

  const handlePromoClick = async (promo) => {
    try {
      const result = await getProductoById(promo.id_tipo_promo); // id del producto
      const producto = result.data;
      const categoria = producto?.subcategoria?.categoria;

      if (categoria) {
        navigate(`/promocion/${categoria.id_categoria}`);
      } else {
        toast.error("No se encontró la categoría del producto", { className: "toast-error" });
      }
    } catch (error) {
      console.error("Error obteniendo categoría:", error);
      toast.error("Hubo un error al obtener la categoría del producto", { className: "toast-error" });
    }
  };

  const scroll = (direction, ref, itemWidth) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === "left" ? -itemWidth : itemWidth,
        behavior: "smooth",
      });
    }
  };

  // Filtrar productos según searchText (ignora mayúsculas/minúsculas)
  const filteredDestacados = destacados.filter((p) =>
    p.nombre.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredTendencias = tendencias.filter((p) =>
    p.nombre.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div
      className="p-4"
      style={{ ...styles.fixedShell, backgroundColor: "#F5F5F5" }}
    >
      {/* Categories */}
      <div style={styles.scrollWrapper}>
        <button
          style={styles.arrow}
          onClick={() => scroll("left", catRef, 140)}
        >
          <img
            src={arrowL}
            alt="left"
            style={{ width: "100%", height: "100%" }}
          />
        </button>
        <div style={styles.divCat} ref={catRef}>
          {(categoriesData ?? []).map((cat, index) => {
            const file = cat?.imagenes?.[0]?.url_imagen; // ✅ nunca truena
            const src = file
              ? `/images/categorias/${file}`
              : "/images/PlaceHolder.png"; // tu placeholder

            return (
              <div key={cat?.id_categoria ?? index} style={styles.catItem}>
                <div
                  style={{
                    ...styles.CategoriesBox,
                    border:
                      hoveredIndex === index
                        ? "2px solid #2b6daf"
                        : "2px solid transparent",
                    transform:
                      hoveredIndex === index ? "scale(1.05)" : "scale(1)",
                    transition: "all 0.2s ease-in-out",
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => handleCategoryClick(cat?.id_categoria)}
                >
                  <img
                    src={toPublicFotoSrc(cat?.icono_categoria, "categorias") || "/PlaceHolder.png"}
                    alt={cat?.nombre ?? "Categoría"}
                    style={{ width: 70, height: 70, objectFit: "contain" }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/PlaceHolder.png";
                    }}
                  />
                </div>
                <span style={styles.catTitle}>{cat?.nombre ?? "-"}</span>
              </div>
            );
          })}
        </div>
        <button
          style={styles.arrow}
          onClick={() => scroll("right", catRef, 140)}
        >
          <img
            src={arrowR}
            alt="right"
            style={{ width: "100%", height: "100%" }}
          />
        </button>
      </div>

      {/*Banner*/}
      <div
        style={{
          position: "relative",
          margin: "40px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <button
          className="arrow-button"
          style={{
            position: "absolute",
            left: 0,
            zIndex: 10,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            width: "40px",
            height: "40px",
          }}
          onClick={() => swiperRef.current?.slidePrev()}
        >
          <img
            src={arrowL}
            alt="left"
            style={{ width: "100%", height: "100%" }}
          />
        </button>

        <div style={{ width: "90%", margin: "0 auto" }}>
          <Swiper
            modules={[EffectCoverflow, Autoplay]}
            effect="coverflow"
            centeredSlides={true}
            slidesPerView={1}
            loop={false}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            observer={true}
 observeParents={true}
            coverflowEffect={{
              rotate: 0,
              stretch: 0,
              depth: 100,
              modifier: 2.5,
              slideShadows: true,
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
          >
            {promociones.length > 0 ? (
              promociones.map((promo, index) => (
                <SwiperSlide
                  key={promo.id_promocion ?? index}
                  style={{ width: "33.333%", padding: "10px" }}
                >
                  <div
                    onMouseEnter={() => setHoveredBanner(index)}
                    onMouseLeave={() => setHoveredBanner(null)}
                    onClick={() => handlePromoClick(promo)}
                    style={{
                      transform:
                        hoveredBanner === index ? "scale(1.017)" : "scale(1)",
                      transition: "all 0.2s ease-in-out",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={toPublicFotoSrc(promo.banner_url, "fotoDePerfil") || "/PlaceHolder.png"}
                      alt={promo.nombre_promocion}
                      className="banner-img"
                      style={{
                        width: "100%",
                        height: "350px",
                        borderRadius: "16px",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/PlaceHolder.png";
                      }}
                    />
                  </div>
                </SwiperSlide>
              ))
            ) : (
              <p style={{ textAlign: "center" }}>
                No hay promociones disponibles
              </p>
            )}
          </Swiper>
        </div>

        <button
          className="arrow-button"
          style={{
            position: "absolute",
            right: 0,
            zIndex: 10,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            width: "40px",
            height: "40px",
          }}
          onClick={() => swiperRef.current?.slideNext()}
        >
          <img
            src={arrowR}
            alt="right"
            style={{ width: "100%", height: "100%" }}
          />
        </button>
      </div>

      {/* Productos Destacados */}
      <h2 style={styles.sectionTitle}>Productos Destacados</h2>

      <div style={styles.scrollWrapper}>
        <button
          style={styles.arrow}
          onClick={() => scroll("left", prodRefDestacados, 140)}
        >
          <img
            src={arrowL}
            alt="left"
            style={{ width: "100%", height: "100%" }}
          />
        </button>

        <div style={styles.divProducts} ref={prodRefDestacados}>
          {filteredDestacados.map((p, i) => (
            <div
              key={i}
              style={{
                ...styles.productBox,
                border:
                  hoveredProductDest === i
                    ? "2px solid #2b6daf"
                    : "2px solid transparent",
                transform:
                  hoveredProductDest === i ? "scale(1.05)" : "scale(1)",
                transition: "all 0.2s ease-in-out",
                cursor: "pointer",
              }}
              onMouseEnter={() => setHoveredProductDest(i)}
              onMouseLeave={() => setHoveredProductDest(null)}
              onClick={() => handleProductClick(p.id_producto)}
            >
              {hasPromo(p.id_producto) && <div style={styles.offerBadge}>OFERTA</div>}
              <div style={styles.topRow}>
                <span></span>
                <span style={styles.stars}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      style={{
                        color: i < p.estrellas ? "#2b6daf" : "#ddd",
                        fontSize: "25px",
                      }}
                    >
                      ★
                    </span>
                  ))}
                </span>
              </div>

              {p.imagenes &&
              p.imagenes.length > 0 &&
              p.imagenes[0].url_imagen ? (
                <img
  src={toPublicFotoSrc(p?.imagenes?.[0]?.url_imagen) || "/PlaceHolder.png"}
  alt={p.nombre}
  style={styles.productImg}
  onError={(e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src =
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%23999">Imagen no disponible</text></svg>';
  }}
/>
              ) : (
                <div style={styles.productImg}>Imagen no disponible</div>
              )}
              <p style={styles.productName}>{p.nombre}</p>
              <div style={styles.priceRow}>
   {(() => {
     const best = bestPromoPriceForProduct(p);
     if (best) {
       return (
         <>
           <span style={styles.newPrice}>L. {best.finalPrice.toFixed(2)}</span>
           <span style={styles.strikePrice}>L. {Number(p.precio_base).toFixed(2)}</span>
         </>
       );
     }
     return <span style={styles.productPrice}>L. {Number(p.precio_base).toFixed(2)}</span>;
   })()}
 </div>
              <button
                style={{
                  ...styles.addButton,
                  backgroundColor:
                    hoveredProductDest === i ? "#2b6daf" : "#F0833E",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAgregar(p.id_producto, 1);
                }}
              >
                Agregar
              </button>
            </div>
          ))}
        </div>

        <button
          style={styles.arrow}
          onClick={() => scroll("right", prodRefDestacados, 140)}
        >
          <img
            src={arrowR}
            alt="right"
            style={{ width: "100%", height: "100%" }}
          />
        </button>
      </div>

      {/* Tendencias del mes */}
      <h2 style={styles.sectionTitle}>Tendencias del mes</h2>

      <div style={styles.scrollWrapper}>
        <button
          style={styles.arrow}
          onClick={() => scroll("left", prodRefTendencias, 140)}
        >
          <img
            src={arrowL}
            alt="left"
            style={{ width: "100%", height: "100%" }}
          />
        </button>

        <div style={styles.divProducts} ref={prodRefTendencias}>
          {filteredTendencias.map((p, i) => (
            <div
              key={i}
              style={{
                ...styles.productBox,
                border:
                  hoveredProductTrend === i
                    ? "2px solid #2b6daf"
                    : "2px solid transparent",
                transform:
                  hoveredProductTrend === i ? "scale(1.05)" : "scale(1)",
                transition: "all 0.2s ease-in-out",
                cursor: "pointer",
              }}
              onMouseEnter={() => setHoveredProductTrend(i)}
              onMouseLeave={() => setHoveredProductTrend(null)}
              onClick={() => handleProductClick(p.id_producto)}
            >
              {hasPromo(p.id_producto) && <div style={styles.offerBadge}>OFERTA</div>}
              <div style={styles.topRow}>
                <span></span>
                <span style={styles.stars}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      style={{
                        color: i < p.estrellas ? "#2b6daf" : "#ddd",
                        fontSize: "25px",
                      }}
                    >
                      ★
                    </span>
                  ))}
                </span>
              </div>

              {p.imagenes &&
              p.imagenes.length > 0 &&
              p.imagenes[0].url_imagen ? (
                <img
  src={toPublicFotoSrc(p?.imagenes?.[0]?.url_imagen) || "/PlaceHolder.png"}
  alt={p.nombre}
  style={styles.productImg}
  onError={(e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src =
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%23999">Imagen no disponible</text></svg>';
  }}
/>
              ) : (
                <div style={styles.productImg}>Imagen no disponible</div>
              )}
              <p style={styles.productName}>{p.nombre}</p>
              <div style={styles.priceRow}>
   {(() => {
     const best = bestPromoPriceForProduct(p);
     if (best) {
       return (
         <>
           <span style={styles.newPrice}>L. {best.finalPrice.toFixed(2)}</span>
           <span style={styles.strikePrice}>L. {Number(p.precio_base).toFixed(2)}</span>
         </>
       );
     }
     return <span style={styles.productPrice}>L. {Number(p.precio_base).toFixed(2)}</span>;
   })()}
 </div>
              <button
                style={{
                  ...styles.addButton,
                  backgroundColor:
                    hoveredProductTrend === i ? "#2b6daf" : "#F0833E",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAgregar(p.id_producto, 1);
                }}
              >
                Agregar
              </button>
            </div>
          ))}
        </div>

        <button
          style={styles.arrow}
          onClick={() => scroll("right", prodRefTendencias, 140)}
        >
          <img
            src={arrowR}
            alt="right"
            style={{ width: "100%", height: "100%" }}
          />
        </button>
      </div>
    </div>
  );
};

const styles = {
  fixedShell: {
    position: "absolute",
    top: "145px",
    left: 0,
    right: 0,
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
  scrollWrapper: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "0 20px",
  },
  divCat: {
    display: "flex",
    gap: "10px",
    overflowX: "auto",
    scrollBehavior: "smooth",
    width: "100%",
    padding: "10px 20px",
    scrollbarWidth: "none",
  },
  catItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "80px",
    flexShrink: 0,
  },
  CategoriesBox: {
    backgroundColor: "white",
    borderRadius: "25px",
    width: "90px",
    height: "90px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.15)",
  },
  catTitle: {
    marginTop: "8px",
    fontSize: "14px",
    color: "#000000ff",
    fontWeight: "400",
  },
  arrow: {
    background: "transparent",
    width: "35px",
    height: "35px",
    cursor: "pointer",
    margin: "0 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  divProducts: {
    display: "flex",
    gap: "13px",
    overflow: "hidden", // 👈 cambia esto
    scrollBehavior: "smooth",
    width: "100%",
    padding: "10px 10px",
  },
  productBox: {
    flexShrink: 0,
    width: "254px",
    height: "265px",
    borderRadius: "25px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#fff",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)",
  },
  topRow: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "3px",
  },
  badge: {
    backgroundColor: "#2b6daf",
    color: "white",
    fontSize: "16px",
    padding: "1px 15px",
    borderRadius: "25px",
  },
  stars: {
    color: "#2b6daf",
    fontSize: "25px",
  },
  productImg: {
    width: "90px",
    height: "90px",
    objectFit: "contain",
    marginTop: "8px",
  },
  productName: {
    width: "100%",
    textAlign: "left",
    fontSize: "18px",
    marginTop: "auto",
  },
  productPrice: {
    width: "100%",
    textAlign: "left",
    fontSize: "17px",
    color: "#999",
    marginTop: "auto",
  },
  addButton: {
    marginTop: "auto",
    width: "100%",
    backgroundColor: "#F0833E",
    color: "white",
    border: "#D8572F",
    borderRadius: "25px",
    padding: "6px 0",
    cursor: "pointer",
    fontSize: "18px",
  },
  sectionTitle: {
    textAlign: "left",
    padding: "5px 85px",
    marginBottom: "10px",
    fontWeight: "650",
    fontSize: "22px",
  },
  productBox: {
  flexShrink: 0,
  width: "254px",
  height: "265px",
  borderRadius: "25px",
  padding: "10px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  backgroundColor: "#fff",
  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)",
  position: "relative",          // 👈 necesario para posicionar el badge
},

offerBadge: {
  position: "absolute",
  top: 10,
  left: -6,                      // 👈 “pegado” a la izquierda
  transform: "rotate(-12deg)",
  background: "#ff1744",         // rojo llamativo
  color: "#fff",
  fontWeight: 800,
  fontSize: 12,
  padding: "4px 10px",
  borderRadius: "10px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
  letterSpacing: 1,
},

 strikePrice: {
   fontSize: "14px",
   color: "#94a3b8",     // gris suave
   textDecoration: "line-through",
   lineHeight: 1.1,
   margin: 0,
 },
promoTag: {
  width: "100%",
  textAlign: "left",
  fontSize: "17px",
  fontWeight: 800,
  color: "#2b6daf",              // azul de tu paleta (llamativo)
  marginTop: 0,
},

// (mantén productPrice como lo tienes para los que NO tienen promo)
priceRow: {
   width: "100%",
   display: "flex",
   alignItems: "baseline",
   gap: "10px",
   marginTop: "auto",    // empuja la fila de precios hacia abajo del card
 },

 newPrice: {
   fontSize: "20px",
   fontWeight: 900,
   color: "#16a34a",     // verde
   lineHeight: 1.1,
 },

};

export default InicioUsuario;
