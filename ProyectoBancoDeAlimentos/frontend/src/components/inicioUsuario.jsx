import React, { useRef, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import axiosInstance from "../api/axiosInstance";
import { EffectCoverflow, Autoplay } from "swiper/modules";
import { useNavigate } from "react-router-dom";
import {
  getAllProducts,
  getProductosDestacados,
  getProductosTendencias,
} from "../api/InventarioApi";
import { ListarCategoria } from "../api/CategoriaApi";
import { AddNewCarrito, ViewCar, SumarItem } from "../api/CarritoApi";
import { getPromocionesOrden } from "../api/PromocionesApi";
import { useCart } from "../utils/CartContext";
import { useSearch } from "../searchContext";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import "../toast.css";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/autoplay";

import arrowL from "../images/arrowL.png";
import arrowR from "../images/arrowR.png";
import { getTopVendidos } from "../api/PedidoApi";

/* ================= Helpers de imágenes (URLs absolutas) ================= */
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

const toPublicFotoSrc = (nameOrPath, dir = "productos") => {
  if (!nameOrPath) return "";
  const s = String(nameOrPath).trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/api/images/")) return `${BACKEND_ORIGIN}${encodeURI(s)}`;
  if (s.startsWith("/images/")) return `${BACKEND_ORIGIN}/api${encodeURI(s)}`;
  return `${BACKEND_ORIGIN}/api/images/${encodeURIComponent(
    dir
  )}/${encodeURIComponent(s)}`;
};

/* ================== Helper para limpiar el nombre ================== */
const cleanProductTitle = (raw) => {
  if (!raw) return "";
  let name = String(raw).trim();

  const unitWords = [
    "unidad",
    "unidad(es)?",
    "litro",
    "litros?",
    "lt",
    "lts",
    "kilo",
    "kilos?",
    "kg",
    "paquete",
    "paquetes?",
    "pack",
    "caja",
    "cajas?",
  ];

  const re = new RegExp(
    `(?:\\s*(?:x|por|de)\\s*)?(?:${unitWords.join("|")})\\b\\.?$`,
    "i"
  );
  name = name.replace(re, "").trim();
  return name.replace(/\s{2,}/g, " ");
};

/* ======================= Componente ======================= */
const InicioUsuario = () => {
  const { searchText } = useSearch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { incrementCart } = useCart();

  const catRef = useRef(null);
  const prodRefDestacados = useRef(null);
  const prodRefTendencias = useRef(null);
  const swiperRef = useRef(null);

  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [hoveredProductDest, setHoveredProductDest] = useState(null);
  const [hoveredProductTrend, setHoveredProductTrend] = useState(null);
  const [hoveredBanner, setHoveredBanner] = useState(null);

  const [destacados, setDestacados] = useState([]);
  const [tendencias, setTendencias] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [topSellerId, setTopSellerId] = useState(null);

  // productos → [id_promocion]
  const [promosPorProducto, setPromosPorProducto] = useState({});
  // id_promocion → info
  const [promosInfo, setPromosInfo] = useState({});

  /* ===== Cargar categorías ===== */
  useEffect(() => {
    (async () => {
      try {
        const res = await ListarCategoria();
        setCategoriesData(res?.data ?? []);
      } catch (err) {
        toast.error("Error al cargar categorías", { className: "toast-error" });
      }
    })();
  }, []);

  /* ===== Destacados / Tendencias ===== */
  useEffect(() => {
    (async () => {
      try {
        const res = await getProductosDestacados();
        setDestacados(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        try {
          const all = await getAllProducts();
          setDestacados(Array.isArray(all?.data) ? all.data.slice(0, 10) : []);
        } catch {
          toast.error("No se pudieron cargar los destacados", {
            className: "toast-error",
          });
        }
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await getProductosTendencias();
        setTendencias(Array.isArray(res?.data) ? res.data : []);
      } catch {
        setTendencias((prev) => (destacados.length ? destacados : prev));
      }
    })();
  }, [destacados]);

  /* ===== Promos: productos→promos y promos→info ===== */
  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get("/api/promociones/detalles");
        const lista = Array.isArray(res?.data) ? res.data : [];
        const map = {};
        for (const promo of lista) {
          const items = Array.isArray(promo.productos) ? promo.productos : [];
          for (const pid of items) {
            const k = Number(pid);
            if (!map[k]) map[k] = [];
            map[k].push(Number(promo.id_promocion));
          }
        }
        setPromosPorProducto(map);
      } catch (err) {
        console.error("[PROMOS DETALLES] error:", err?.response?.data || err);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get("/api/promociones/listarorden");
        const arr = Array.isArray(res?.data) ? res.data : [];
        const map = {};
        for (const p of arr) {
          map[Number(p.id_promocion)] = {
            id_promocion: Number(p.id_promocion),
            id_tipo_promo: Number(p.id_tipo_promo), // 1=%  2=fijo
            valor_porcentaje:
              p.valor_porcentaje != null
                ? parseFloat(p.valor_porcentaje)
                : null,
            valor_fijo: p.valor_fijo != null ? Number(p.valor_fijo) : null,
            compra_min: p.compra_min != null ? Number(p.compra_min) : null,
            fecha_inicio: p.fecha_inicio || null,
            fecha_termina: p.fecha_termina || null,
            activa: p.activa === true || p.activa === 1 || p.activa === "true",
          };
        }
        setPromosInfo(map);
      } catch (err) {
        console.error(
          "[PROMOS LISTARORDEN] error:",
          err?.response?.data || err
        );
      }
    })();
  }, []);

  /* ===== Lógica de precios con promo ===== */
  const isDateInRange = (startStr, endStr) => {
    const today = new Date();
    const start = startStr ? new Date(startStr) : null;
    const end = endStr ? new Date(endStr) : null;
    if (start && today < start) return false;
    if (end && today > end) return false;
    return true;
  };

  const computeDiscountedPriceByPromo = (basePrice, pInfo) => {
    if (
      !pInfo?.activa ||
      !isDateInRange(pInfo.fecha_inicio, pInfo.fecha_termina)
    )
      return null;

    const price = Number(basePrice) || 0;
    if (price <= 0) return null;

    // 1 = %; 2 = fijo
    if (pInfo.id_tipo_promo === 1 && Number(pInfo.valor_porcentaje) > 0) {
      const pct = Number(pInfo.valor_porcentaje) / 100;
      return Math.max(0, price * (1 - pct));
    }
    if (pInfo.id_tipo_promo === 2 && Number(pInfo.valor_fijo) > 0) {
      return Math.max(0, price - Number(pInfo.valor_fijo));
    }
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
        best = { finalPrice: discounted, promoId: idPromo, info };
      }
    }
    return best; // {finalPrice, promoId, info} | null
  };

  /* ===== Promociones ordenadas para banner (solo activas y orden>0) ===== */
  useEffect(() => {
    (async () => {
      try {
        const res = await getPromocionesOrden();
        const ordered = (Array.isArray(res?.data) ? res.data : [])
          .map((item) => {
            const ordenNum = Number(item.orden);
            return {
              id_promocion: item.id_promocion,
              id_tipo_promo: item.id_tipo_promo,
              orden: Number.isFinite(ordenNum) ? ordenNum : NaN,
              nombre_promocion: item.nombre_promocion,
              descripcion: item.descripción || item.descripcion || "",
              banner_url: item.banner_url,
              activa:
                item.activa === true ||
                item.activa === 1 ||
                item.activa === "true",
            };
          })
          .filter((p) => p.activa && Number.isFinite(p.orden) && p.orden > 0)
          .sort((a, b) => (a.orden === b.orden ? 0 : a.orden - b.orden));
        setPromociones(ordered);
      } catch (err) {
        toast.error("Error al cargar promociones", { className: "toast-error" });
      }
    })();
  }, []);

  // Posicionar Swiper en la primera por orden
  useEffect(() => {
    if (!swiperRef.current || promociones.length === 0) return;
    const idx = promociones.reduce(
      (best, p, i) =>
        (promociones[i].orden ?? Infinity) <
        (promociones[best].orden ?? Infinity)
          ? i
          : best,
      0
    );
    swiperRef.current.update?.();
    swiperRef.current.slideTo(idx, 0, false);
  }, [promociones]);

  /* ===== Reporte top-seller para la chapita ===== */
  useEffect(() => {
    (async () => {
      try {
        const rep = await getTopVendidos({
          days: 30,
          limit: 10,
          estado: "Enviado",
        });
        const list = Array.isArray(rep?.data?.topProductos)
          ? rep.data.topProductos
          : Array.isArray(rep?.data)
          ? rep.data
          : [];
        const pickMax = (arr) =>
          arr.reduce((a, b) => {
            const qa = Number(a?.total_cantidad ?? a?.cantidad ?? a?.total ?? 0);
            const qb = Number(b?.total_cantidad ?? b?.cantidad ?? b?.total ?? 0);
            return qb > qa ? b : a;
          }, arr[0]);
        const top = pickMax(list);
        const id = Number(
          top?.id_producto ??
            top?.producto_id ??
            top?.idProducto ??
            top?.productId ??
            top?.id
        );
        setTopSellerId(Number.isFinite(id) ? id : null);
      } catch (e) {
        setTopSellerId(null);
      }
    })();
  }, []);

  /* ===== Handlers ===== */
  const handleCategoryClick = (categoryId) => {
    navigate(`/categoria/${categoryId}`);
  };

  const handlePromoClick = async (promo) => {
    navigate(`/promocion/${promo.id_promocion}`);
  };

  const handleAgregar = async (id_producto) => {
    if (!id_producto) {
      toast.error("ID de producto no válido", { className: "toast-error" });
      return;
    }
    try {
      const carritoActual = await ViewCar();
      const detalles = carritoActual.data.carrito_detalles ?? [];
      const ya = detalles.find((d) => d.producto.id_producto === id_producto);

      if (ya) {
        const nueva = (ya.cantidad_unidad_medida || 0) + 1;
        await SumarItem(id_producto, nueva);
        setCarrito((prev) =>
          Array.isArray(prev)
            ? prev.map((it) =>
                it.producto.id_producto === id_producto
                  ? {
                      ...it,
                      cantidad_unidad_medida: nueva,
                      subtotal_detalle: it.producto.precio_base * nueva,
                    }
                  : it
              )
            : prev
        );
        toast("Cantidad actualizada", { className: "toast-default" });
      } else {
        await AddNewCarrito(id_producto, 1);
        const nuevo = await ViewCar();
        setCarrito(nuevo.data.carrito_detalles ?? []);
        incrementCart(1);
        toast("Producto agregado al carrito", { className: "toast-default" });
      }
    } catch (error) {
      toast.error("Debe iniciar sesión", { className: "toast-error" });
      navigate("/login");
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/producto/${productId}`);
  };

  const scroll = (direction, ref, itemWidth) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === "left" ? -itemWidth : itemWidth,
        behavior: "smooth",
      });
    }
  };

  /* ===== Filtros de búsqueda ===== */
  const filteredDestacados = destacados.filter((p) =>
    (p?.nombre || "").toLowerCase().includes(searchText.toLowerCase())
  );
  const filteredTendencias = tendencias.filter((p) =>
    (p?.nombre || "").toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="p-4" style={{ ...styles.fixedShell, backgroundColor: "#F5F5F5" }}>
      {/* CATEGORÍAS */}
      <div style={styles.scrollWrapper}>
        <button style={styles.arrow} onClick={() => scroll("left", catRef, 140)}>
          <img src={arrowL} alt="left" style={{ width: "100%", height: "100%" }} />
        </button>
        <div style={styles.divCat} ref={catRef}>
          {(categoriesData ?? []).map((cat, index) => {
            return (
              <div key={cat?.id_categoria ?? index} style={styles.catItem}>
                <div
                  style={{
                    ...styles.CategoriesBox,
                    border:
                      hoveredIndex === index
                        ? "2px solid #2b6daf"
                        : "2px solid transparent",
                    transform: hoveredIndex === index ? "scale(1.05)" : "scale(1)",
                    transition: "all 0.2s ease-in-out",
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => handleCategoryClick(cat?.id_categoria)}
                >
                  <img
                    src={
                      toPublicFotoSrc(cat?.icono_categoria, "categorias") ||
                      "/PlaceHolder.png"
                    }
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
          <img src={arrowR} alt="right" style={{ width: "100%", height: "100%" }} />
        </button>
      </div>

      {/* BANNERS DE PROMOS */}
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
            width: 40,
            height: 40,
          }}
          onClick={() => swiperRef.current?.slidePrev()}
        >
          <img src={arrowL} alt="left" style={{ width: "100%", height: "100%" }} />
        </button>

        <div style={{ width: "90%", margin: "0 auto" }}>
          <Swiper
            modules={[EffectCoverflow, Autoplay]}
            effect="coverflow"
            centeredSlides
            slidesPerView={1}
            loop={false}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            observer
            observeParents
            coverflowEffect={{ rotate: 0, stretch: 0, depth: 100, modifier: 2.5, slideShadows: true }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
          >
            {promociones.length > 0 ? (
              promociones.map((promo, index) => (
                <SwiperSlide key={promo.id_promocion ?? index} style={{ width: "33.333%", padding: 10 }}>
                  <div
                    onMouseEnter={() => setHoveredBanner(index)}
                    onMouseLeave={() => setHoveredBanner(null)}
                    onClick={() => handlePromoClick(promo)}
                    style={{
                      transform: hoveredBanner === index ? "scale(1.017)" : "scale(1)",
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
                      style={{ width: "100%", height: 350, borderRadius: 16, objectFit: "cover" }}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/PlaceHolder.png";
                      }}
                    />
                  </div>
                </SwiperSlide>
              ))
            ) : (
              <p style={{ textAlign: "center" }}>{t("noPromotion")}</p>
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
            width: 40,
            height: 40,
          }}
          onClick={() => swiperRef.current?.slideNext()}
        >
          <img src={arrowR} alt="right" style={{ width: "100%", height: "100%" }} />
        </button>
      </div>

      {/* DESTACADOS */}
      <h2 style={styles.sectionTitle}>{t("featured")}</h2>
      <div style={styles.scrollWrapper}>
        <button style={styles.arrow} onClick={() => scroll("left", prodRefDestacados, 140)}>
          <img src={arrowL} alt="left" style={{ width: "100%", height: "100%" }} />
        </button>

        <div style={styles.divProducts} ref={prodRefDestacados}>
          {filteredDestacados.map((p, i) => {
            const best = bestPromoPriceForProduct(p);
            const hasOffer = !!best;
            const isFree = best && best.info?.id_tipo_promo === 2 && best.finalPrice <= 0.0001;

            return (
              <div
                key={i}
                style={{
                  ...styles.productBox,
                  border:
                    hoveredProductDest === i ? "2px solid #2b6daf" : "2px solid transparent",
                  transform: hoveredProductDest === i ? "scale(1.05)" : "scale(1)",
                  transition: "all 0.2s ease-in-out",
                  cursor: "pointer",
                }}
                onMouseEnter={() => setHoveredProductDest(i)}
                onMouseLeave={() => setHoveredProductDest(null)}
                onClick={() => handleProductClick(p.id_producto)}
              >
                {hasOffer && <div style={styles.offerBadge}>{t("Oferta")}</div>}

                <div style={styles.topRow}>
                  <span />
                  <span style={styles.stars}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <span key={j} style={{ color: j < (p.estrellas || 0) ? "#2b6daf" : "#ddd" }}>
                        ★
                      </span>
                    ))}
                  </span>
                </div>

                {p.imagenes?.length > 0 && p.imagenes[0]?.url_imagen ? (
                  <img
                    src={toPublicFotoSrc(p.imagenes[0].url_imagen)}
                    alt={cleanProductTitle(p.nombre)}
                    style={styles.productImg}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%23999">Imagen no disponible</text></svg>';
                    }}
                  />
                ) : (
                  <div style={styles.productImg}>{t("imageNotAvailable")}</div>
                )}

                <p style={styles.productName}>{cleanProductTitle(p.nombre)}</p>

                <div style={styles.priceRow}>
                  {hasOffer ? (
                    isFree ? (
                      <>
                        <span style={styles.freeChip}></span>
                        <span style={styles.strikePrice}>
                          L. {Number(p.precio_base).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span style={styles.newPrice}>
                          L. {Number(best.finalPrice).toFixed(2)}
                        </span>
                        <span style={styles.strikePrice}>
                          L. {Number(p.precio_base).toFixed(2)}
                        </span>
                      </>
                    )
                  ) : (
                    <span style={styles.productPrice}>
                      L. {Number(p.precio_base).toFixed(2)}
                    </span>
                  )}
                </div>

                <button
                  style={{
                    ...styles.addButton,
                    backgroundColor: hoveredProductDest === i ? "#2b6daf" : "#F0833E",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAgregar(p.id_producto, 1);
                  }}
                >
                  {t("add")}
                </button>
              </div>
            );
          })}
        </div>

        <button style={styles.arrow} onClick={() => scroll("right", prodRefDestacados, 140)}>
          <img src={arrowR} alt="right" style={{ width: "100%", height: "100%" }} />
        </button>
      </div>

      {/* TENDENCIAS */}
      <h2 style={styles.sectionTitle}>{t("trending")}</h2>
      <div style={styles.scrollWrapper}>
        <button style={styles.arrow} onClick={() => scroll("left", prodRefTendencias, 140)}>
          <img src={arrowL} alt="left" style={{ width: "100%", height: "100%" }} />
        </button>

        <div style={styles.divProducts} ref={prodRefTendencias}>
          {filteredTendencias.map((p, i) => {
            const best = bestPromoPriceForProduct(p);
            const hasOffer = !!best;
            const isFree = best && best.info?.id_tipo_promo === 2 && best.finalPrice <= 0.0001;

            return (
              <div
                key={i}
                style={{
                  ...styles.productBox,
                  border:
                    hoveredProductTrend === i ? "2px solid #2b6daf" : "2px solid transparent",
                  transform: hoveredProductTrend === i ? "scale(1.05)" : "scale(1)",
                  transition: "all 0.2s ease-in-out",
                  cursor: "pointer",
                }}
                onMouseEnter={() => setHoveredProductTrend(i)}
                onMouseLeave={() => setHoveredProductTrend(null)}
                onClick={() => handleProductClick(p.id_producto)}
              >
                {hasOffer && <div style={styles.offerBadge}>{t("Oferta")}</div>}

                <div style={styles.topRow}>
                  <span />
                  <span style={styles.stars}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <span key={j} style={{ color: j < (p.estrellas || 0) ? "#2b6daf" : "#ddd" }}>
                        ★
                      </span>
                    ))}
                  </span>
                </div>

                {p.imagenes?.length > 0 && p.imagenes[0]?.url_imagen ? (
                  <img
                    src={toPublicFotoSrc(p.imagenes[0].url_imagen)}
                    alt={cleanProductTitle(p.nombre)}
                    style={styles.productImg}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%23999">Imagen no disponible</text></svg>';
                    }}
                  />
                ) : (
                  <div style={styles.productImg}>{t("imageNotAvailable")}</div>
                )}

                <p style={styles.productName}>{cleanProductTitle(p.nombre)}</p>

                <div style={styles.priceRow}>
                  {hasOffer ? (
                    isFree ? (
                      <>
                        <span style={styles.freeChip}></span>
                        <span style={styles.strikePrice}>
                          L. {Number(p.precio_base).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span style={styles.newPrice}>
                          L. {Number(best.finalPrice).toFixed(2)}
                        </span>
                        <span style={styles.strikePrice}>
                          L. {Number(p.precio_base).toFixed(2)}
                        </span>
                      </>
                    )
                  ) : (
                    <span style={styles.productPrice}>
                      L. {Number(p.precio_base).toFixed(2)}
                    </span>
                  )}
                </div>

                <button
                  style={{
                    ...styles.addButton,
                    backgroundColor: hoveredProductTrend === i ? "#2b6daf" : "#F0833E",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAgregar(p.id_producto, 1);
                  }}
                >
                  {t("add")}
                </button>
              </div>
            );
          })}
        </div>

        <button style={styles.arrow} onClick={() => scroll("right", prodRefTendencias, 140)}>
          <img src={arrowR} alt="right" style={{ width: "100%", height: "100%" }} />
        </button>
      </div>
    </div>
  );
};

/* ===================== Estilos (uno solo) ===================== */
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
    overflow: "hidden",
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
    position: "relative",
  },
  topRow: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
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
  offerBadge: {
    position: "absolute",
    top: 10,
    left: -6,
    transform: "rotate(-12deg)",
    background: "#ff1744",
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
    color: "#94a3b8",
    textDecoration: "line-through",
    lineHeight: 1.1,
    margin: 0,
  },
  priceRow: {
    width: "100%",
    display: "flex",
    alignItems: "baseline",
    gap: "10px",
    marginTop: "auto",
  },
  newPrice: {
    fontSize: "20px",
    fontWeight: 900,
    color: "#16a34a",
    lineHeight: 1.1,
  },
  freeChip: {
    fontWeight: 900,
    color: "#16a34a",
    fontSize: 18,
  },
};

export default InicioUsuario;
