// AgregarCarrito.jsx
import React, { useState, useEffect, useMemo, useContext } from "react";
import { useTranslation } from "react-i18next";
import { Minus, Plus, Heart } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getAllProducts,
  listarProductosporsucursal,
  addOrUpdateValoracion,
  // AddProductoFav
} from "../api/InventarioApi";
import { AddNewCarrito, ViewCar, SumarItem } from "../api/CarritoApi";
import axiosInstance from "../api/axiosInstance"; // valoraciones
import { useCart } from "../utils/CartContext";
import { height } from "@mui/system";
import { toast } from "react-toastify";
import "../toast.css";
import "react-toastify/dist/ReactToastify.css";
import { agregarAListaDeseos } from "../api/listaDeseosApi";
import { UserContext } from "../components/userContext";
import { getTopVendidos } from "../api/PedidoApi";

// ====== helpers para construir la URL absoluta desde el backend ======
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

// para nombres de archivo tipo "foto.jpg"
const backendImageUrl = (fileName) =>
  fileName
    ? `${BACKEND_ORIGIN}/api/images/productos/${encodeURIComponent(fileName)}`
    : "";

// adapta la ruta que venga en DB a una URL válida del backend
const toPublicFotoSrc = (nameOrPath) => {
  if (!nameOrPath) return "";
  const s = String(nameOrPath);
  if (/^https?:\/\//i.test(s)) return s; // ya es absoluta
  if (s.startsWith("/api/images/")) return `${BACKEND_ORIGIN}${encodeURI(s)}`;
  if (s.startsWith("/images/")) return `${BACKEND_ORIGIN}/api${encodeURI(s)}`;
  return backendImageUrl(s); // nombre suelto => /images/productos/<archivo>
};

function AgregarCarrito() {
  const [topSellerId, setTopSellerId] = useState(null);
  const { t } = useTranslation();

  const { id } = useParams();
  const navigate = useNavigate();
  const { incrementCart } = useCart();

  // ======= Estado base =======
  const [product, setProduct] = useState(null);
  const [products, setProducts] = useState([]); // recomendados / fallback todos
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // carrito
  const [quantity, setQuantity] = useState(1);
  const [carrito, setCarrito] = useState(null);

  // valoraciones (lista)
  const [reviews, setReviews] = useState([]);
  // resumen desde backend (si viene)
  const [summary, setSummary] = useState({
    avgRating: 0,
    totalReviews: 0,
    dist: [0, 0, 0, 0, 0], // [1★,2★,3★,4★,5★]
  });
  const { user } = useContext(UserContext); // para tomar id_usuario
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // favoritos
  const [favLoading, setFavLoading] = useState(false);
  const [isFav, setIsFav] = useState(false); // para rellenar el corazón cuando quede guardado

  // ======= Derivados: si backend NO trae resumen, lo calculamos con reviews =======
  const computed = useMemo(() => {
    if (!Array.isArray(reviews) || reviews.length === 0) {
      const base = Number(product?.estrellas || 0); // mostrar algo si no hay reviews
      return { avgRating: base, totalReviews: 0, dist: [0, 0, 0, 0, 0] };
    }
    const d = [0, 0, 0, 0, 0];
    let sum = 0;
    for (const r of reviews) {
      const p = Math.min(5, Math.max(1, Number(r.puntuacion || 0)));
      d[p - 1] += 1;
      sum += p;
    }
    const avg = sum / reviews.length;
    return { avgRating: avg, totalReviews: reviews.length, dist: d };
  }, [reviews, product?.estrellas]);

  // Elegimos: usar lo del backend si existe; si no, lo calculado
  const effectiveAvg =
    summary.totalReviews > 0 ? summary.avgRating : computed.avgRating;
  const effectiveTotal =
    summary.totalReviews > 0 ? summary.totalReviews : computed.totalReviews;
  const effectiveDist = summary.totalReviews > 0 ? summary.dist : computed.dist;

  // Para porcentajes y totales visuales
  const safeTotal = Math.max(0, Number(effectiveTotal || 0));
  const pct = (n) => (safeTotal > 0 ? Math.round((n * 100) / safeTotal) : 0);
  // === Promos ===
  const [promosPorProducto, setPromosPorProducto] = useState({}); // { id_producto: [id_promocion, ...] }
  const [promosInfo, setPromosInfo] = useState({}); // { id_promocion: { tipo, %/fijo, fechas, activa } }

  // 1) /api/promociones/detalles → mapea productos a promociones
  useEffect(() => {
    const fetchPromosDetalles = async () => {
      try {
        const res = await axiosInstance.get("/api/promociones/detalles");
        const lista = Array.isArray(res?.data) ? res.data : [];
        const map = {};
        for (const promo of lista) {
          const arr = Array.isArray(promo.productos) ? promo.productos : [];
          for (const pid of arr) {
            const idNum = Number(pid);
            if (!map[idNum]) map[idNum] = [];
            map[idNum].push(Number(promo.id_promocion));
          }
        }
        setPromosPorProducto(map);
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
    };
    fetchPromosInfo();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const rep = await getTopVendidos({
          days: 30,
          limit: 10,
          estado: "Enviado", // quítalo si no quieres filtrar por estado
        });
        const list = Array.isArray(rep?.data?.topProductos)
          ? rep.data.topProductos
          : [];
        const top = list.reduce((a, b) => {
          const qa = Number(a?.total_cantidad ?? 0);
          const qb = Number(b?.total_cantidad ?? 0);
          return qb > qa ? b : a;
        }, list[0]);
        const id = Number(
          top?.id_producto ??
            top?.producto_id ??
            top?.idProducto ??
            top?.productId ??
            top?.id
        );
        setTopSellerId(Number.isFinite(id) ? id : null);
      } catch {
        setTopSellerId(null);
      }
    })();
  }, []);

  // Helpers de precio en promo (igual que en InicioUsuario)
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

    // Solo tipos que afectan al precio unitario
    if (pInfo.id_tipo_promo === 1 && pInfo.valor_porcentaje > 0) {
      const pct = pInfo.valor_porcentaje / 100;
      return Math.max(0, price * (1 - pct));
    }
    if (pInfo.id_tipo_promo === 2 && pInfo.valor_fijo > 0) {
      return Math.max(0, price - pInfo.valor_fijo);
    }
    return null; // otros tipos no alteran el unitario aquí
  };

  const bestPromoPriceForProduct = (prod) => {
    const base = Number(prod?.precio_base) || 0;
    const ids = promosPorProducto[Number(prod?.id_producto)] || [];
    let best = null;
    for (const idPromo of ids) {
      const info = promosInfo[idPromo];
      const discounted = computeDiscountedPriceByPromo(base, info);
      if (discounted == null) continue;
      if (best == null || discounted < best.finalPrice) {
        best = { finalPrice: discounted, promoId: idPromo };
      }
    }
    return best; // { finalPrice, promoId } | null
  };

  // ======= Carga inicial de página =======
  useEffect(() => {
    const fetchPage = async () => {
      try {
        // 1) Traer todos para localizar el producto actual
        const resAll = await getAllProducts();
        const all = Array.isArray(resAll?.data) ? resAll.data : [];
        setProducts(all);

        const found = all.find((p) => String(p.id_producto) === String(id));
        if (!found) return navigate("/");

        setProduct(found);
        setSelectedImageIndex(0);

        // 2) Recomendados por sucursal (si procede); si falla/ausente → dejamos "all"
        await loadRecomendados(found);

        // 3) Valoraciones del producto (lista + resumen)
        await fetchReviews(found.id_producto);
      } catch (err) {
        console.error("[PRODUCTS] error:", err?.response?.data || err);
        toast.error(
          err?.response?.data?.message || "Error al cargar productos",
          { className: "toast-error" }
        );
      }
    };

    fetchPage();
  }, [id, navigate]);

  // ======= Recomendados por sucursal (con fallback silencioso) =======
  async function loadRecomendados(baseProduct) {
    try {
      const sucursalId =
        baseProduct?.id_sucursal ||
        baseProduct?.sucursal?.id_sucursal ||
        localStorage.getItem("id_sucursal");

      if (!sucursalId) return; // no tocamos la lista si no hay sucursal

      const res = await listarProductosporsucursal(sucursalId);
      const porSucursal = Array.isArray(res?.data) ? res.data : [];
      if (porSucursal.length) setProducts(porSucursal);
    } catch (e) {
      console.warn(
        "[RECOMENDADOS] fallback a getAllProducts:",
        e?.response?.data || e
      );
    }
  }

  // ======= Valoraciones: listar =======
  async function fetchReviews(productId) {
    try {
      // 🔧 RUTA CORRECTA (singular): /api/producto/:id/valoraciones
      const res = await axiosInstance.get(
        `/api/producto/${productId}/valoraciones`
      );
      const body = res?.data || {};

      if (Array.isArray(body.valoraciones)) {
        setReviews(body.valoraciones);
        const r = body.resumen || {};
        setSummary({
          avgRating: Number(r.avgRating || 0),
          totalReviews: Number(r.totalReviews || 0),
          dist:
            Array.isArray(r.dist) && r.dist.length === 5
              ? r.dist
              : [0, 0, 0, 0, 0],
        });
      } else if (Array.isArray(body)) {
        // backend viejo: solo array de valoraciones
        setReviews(body);
        setSummary({ avgRating: 0, totalReviews: 0, dist: [0, 0, 0, 0, 0] });
      } else {
        setReviews([]);
        setSummary({ avgRating: 0, totalReviews: 0, dist: [0, 0, 0, 0, 0] });
      }
    } catch (e) {
      console.error("[REVIEWS] error:", e?.response?.data || e);
    }
  }

  // ======= Valoraciones: crear/actualizar =======
  async function submitReview(e) {
    e.preventDefault();
    if (!product?.id_producto) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.info("Inicia sesión para dejar un comentario.", {
        className: "toast-info",
      });
      return navigate("/login");
    }
    if (myRating < 1 || myRating > 5) {
      return toast.info("Selecciona una calificación válida (1–5).", {
        className: "toast-info",
      });
    }

    try {
      setSubmitting(true);
      await addOrUpdateValoracion(product.id_producto, {
        puntuacion: myRating,
        comentario: myComment?.trim() || "",
      });

      // Limpia los campos del formulario
      setMyRating(0);
      setMyComment("");

      // Refresca lista + resumen
      await fetchReviews(product.id_producto);
    } catch (e) {
      console.error("[REVIEWS POST] error:", e?.response?.data || e);
      toast.error(
        e?.response?.data?.error ||
          e?.response?.data?.message ||
          "No se pudo enviar tu opinión",
        { className: "toast-error" }
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ======= Carrito: agregar/sumar =======
  const handleAgregar = async (id_producto, q = quantity) => {
    if (!id_producto) {
      toast.error("ID de producto no válido", { className: "toast-error" });
      return;
    }

    try {
      console.log("Agregando producto:", id_producto, "cantidad:", q);

      let carritoActual = null;
      let carritoVacio = false;

      // Obtener carrito actual
      try {
        carritoActual = await ViewCar();
      } catch (error) {
        if (error?.response?.status === 404) {
          console.log("Carrito vacío - usuario nuevo");
          carritoVacio = true;
        } else {
          throw error;
        }
      }

      let cantidadActual = 0;
      let productoExistente = null;

      if (!carritoVacio && carritoActual?.data) {
        const carritoDetalles = carritoActual.data.carrito_detalles ?? [];

        // Buscar si el producto ya existe en el carrito
        productoExistente = carritoDetalles.find(
          (item) => String(item.producto.id_producto) === String(id_producto)
        );

        if (productoExistente) {
          cantidadActual = productoExistente.cantidad_unidad_medida || 0;
        }
      }

      const nuevaCantidad = cantidadActual + q;

      if (productoExistente) {
        // Usar SumarItem con la cantidad TOTAL que debe quedar
        await SumarItem(id_producto, nuevaCantidad);
        toast(`Cantidad actualizada a ${nuevaCantidad} unidades`, {
          className: "toast-default",
        });
      } else {
        console.log("Producto nuevo, agregando al carrito");
        await AddNewCarrito(id_producto, q);
        incrementCart();
        toast(
          `Producto agregado al carrito (${q} ${
            q === 1 ? "unidad" : "unidades"
          })`,
          { className: "toast-default" }
        );
      }

      // Recargar carrito para verificar cambios
      try {
        const actualizado = await ViewCar();
        const carritoDetalles = actualizado.data.carrito_detalles ?? [];
        setCarrito(actualizado.data);
      } catch (error) {}
    } catch (error) {
      console.error("Error completo:", error);
      console.error("Respuesta del servidor:", error?.response?.data);

      // Si el carrito está vacío, intentar crear uno nuevo
      if (error?.response?.status === 404) {
        try {
          console.log("Intentando crear carrito nuevo...");
          await AddNewCarrito(id_producto, q);

          // Recargar carrito
          const carritoNuevo = await ViewCar();
          setCarrito(carritoNuevo.data);

          toast(
            `Producto agregado al carrito (${q} ${
              q === 1 ? "unidad" : "unidades"
            })`,
            { className: "toast-default" }
          );
        } catch (err) {
          console.error("Error creando carrito:", err);
          toast.error("No se pudo agregar el producto al carrito", {
            className: "toast-error",
          });
        }
      } else {
        const errorMessage =
          error?.response?.data?.msg ||
          error?.response?.data?.message ||
          error?.message ||
          "No se pudo procesar el carrito";

        toast.error(errorMessage, { className: "toast-error" });
      }
    }
  };

  // ======= Favoritos =======
  async function handleFavorito() {
    if (!product?.id_producto) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.info("Inicia sesión para usar Favoritos.", {
        className: "toast-info",
      });
      return navigate("/login");
    }

    try {
      setFavLoading(true);
      // await AddProductoFav(product.id_producto);
      // alert("Producto agregado a tus favoritos.");
    } catch (e) {
      console.error("[FAVORITOS] error:", e?.response?.data || e);
      toast.error(
        e?.response?.data?.error ||
          e?.response?.data?.message ||
          "No se pudo agregar a favoritos",
        { className: "toast-error" }
      );
    } finally {
      setFavLoading(false);
    }
  }
  async function handleFavorito() {
    if (!product?.id_producto) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.info("Inicia sesión para usar Favoritos.", {
        className: "toast-info",
      });
      return navigate("/login");
    }
    if (!user?.id_usuario) {
      toast.error("No se encontró tu usuario en sesión.", {
        className: "toast-error",
      });
      return;
    }

    try {
      setFavLoading(true);
      const res = await agregarAListaDeseos(
        user.id_usuario,
        product.id_producto
      );

      setIsFav(true);
      toast.success(
        res?.data?.message || "Producto agregado a tu lista de deseos",
        {
          className: "toast-success",
        }
      );
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message;

      // ya existe en la lista (tu controller envia 400)
      if (status === 400 && /ya está en la lista/i.test(msg || "")) {
        setIsFav(true);
        toast.info("Este producto ya está en tu lista de deseos.", {
          className: "toast-info",
        });
      } else if (status === 404) {
        toast.error(msg || "Usuario o producto no encontrado", {
          className: "toast-error",
        });
      } else {
        toast.error(msg || "No se pudo agregar a favoritos", {
          className: "toast-error",
        });
      }
    } finally {
      setFavLoading(false);
    }
  }

  // ======= Utilidades UI =======
  const incrementQuantity = () => setQuantity((n) => n + 1);
  const decrementQuantity = () => setQuantity((n) => (n > 1 ? n - 1 : 1));
  const handleProductClick = (productId) => navigate(`/producto/${productId}`);

  const getProductImages = (p) =>
    !p || !p.imagenes || p.imagenes.length === 0
      ? [null]
      : p.imagenes.slice(0, 3);

  const handleImageSelect = (index) => setSelectedImageIndex(index);

  const getAvgFromProduct = (p) =>
    Number(
      p?.rating_avg ?? p?.estrellas ?? p?.valoraciones_avg ?? p?.rating ?? 0
    );

  // helper UI estrellas
  const Star = ({ filled = false, size = 22, onClick }) => (
    <span
      onClick={onClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        fontSize: size,
        color: filled ? "#F5A623" : "#ddd",
        marginRight: 2,
        userSelect: "none",
      }}
    >
      ★
    </span>
  );

  // Loader si no hay producto
  if (!product) {
    return (
      <div style={styles.loadingWrapper}>
        <div style={styles.loadingText}>Cargando producto...</div>
      </div>
    );
  }

  // ⚠️ Calcula las imágenes del producto ANTES del return
  const productImages = getProductImages(product);

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        {/* Sidebar: Compras Frecuentes */}
        <div style={styles.sidebar}>
          <h2 style={styles.sidebarTitle}>{t("FrecuentlyBuys")}</h2>
          <div style={styles.List}>
            {products.map((p, index) => (
              <div
                key={index}
                style={styles.Card}
                onClick={() => handleProductClick(p.id_producto)}
              >
                <div style={styles.cardTopRow}>
                  {Number(p.id_producto) === Number(topSellerId) && (
                    <span style={{ ...styles.offerChip, marginLeft: 6 }}>
                      {t("MostBought")}
                    </span>
                  )}
                  <div style={styles.stars}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        style={{
                          color:
                            i < Math.round(getAvgFromProduct(p))
                              ? "#2b6daf"
                              : "#ddd",
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <div style={styles.cardImageWrapper}>
                  {p.imagenes &&
                  p.imagenes.length > 0 &&
                  p.imagenes[0].url_imagen ? (
                    <img
                      src={
                        toPublicFotoSrc(p.imagenes[0].url_imagen) ||
                        "/PlaceHolder.png"
                      }
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
                </div>

                <div style={styles.cardContent}>
                  <h3 style={styles.cardTitle}>
                    {p.nombre} {p.unidad_medida ? p.unidad_medida : "P/Kilo"}
                  </h3>
                  <div style={styles.priceRow}>
                    {(() => {
                      const best = bestPromoPriceForProduct(p);
                      if (best) {
                        return (
                          <>
                            <span style={styles.newPrice}>
                              L. {best.finalPrice.toFixed(2)}
                            </span>
                            <span style={styles.strikePrice}>
                              L. {Number(p.precio_base).toFixed(2)}
                            </span>
                          </>
                        );
                      }
                      return (
                        <span style={styles.cardPrice}>
                          L. {Number(p.precio_base).toFixed(2)}
                        </span>
                      );
                    })()}
                  </div>
                  <button
                    style={styles.addButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAgregar(p.id_producto, 1);
                    }}
                  >
                    {t("add")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contenido principal: Detalle de producto + Valoraciones en la misma tarjeta */}
        <div style={styles.detailWrapper}>
          <div style={styles.detailCard}>
            {/* Detalle del producto */}
            <div style={styles.detailGrid}>
              <div style={styles.ImageSection}>
                <div style={styles.mainImageWrapper}>
                  {Number(product.id_producto) === Number(topSellerId) && (
                    <div style={styles.offerBadge}>{t("MostBought")}</div>
                  )}
                  {productImages[selectedImageIndex] &&
                  productImages[selectedImageIndex].url_imagen ? (
                    <img
                      src={
                        toPublicFotoSrc(
                          productImages[selectedImageIndex].url_imagen
                        ) || "/PlaceHolder.png"
                      }
                      alt={product.nombre}
                      style={styles.mainImage}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%23999">Imagen no disponible</text></svg>';
                      }}
                    />
                  ) : (
                    <div style={styles.mainImagePlaceholder}>
                      <span>Imagen no disponible</span>
                    </div>
                  )}
                </div>

                {productImages.length > 1 && (
                  <div style={styles.smallWrapper}>
                    {productImages.map((image, index) => (
                      <div
                        key={index}
                        style={{
                          ...styles.smaller,
                          ...(selectedImageIndex === index
                            ? styles.smallerActive
                            : {}),
                        }}
                        onClick={() => handleImageSelect(index)}
                      >
                        {image && image.url_imagen ? (
                          <img
                            src={
                              toPublicFotoSrc(image.url_imagen) ||
                              "/PlaceHolder.png"
                            }
                            alt={`mini-${index}`}
                            style={styles.smallerImage}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src =
                                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%23999">Imagen no disponible</text></svg>';
                            }}
                          />
                        ) : (
                          <div style={styles.smallerPlaceholder}>
                            Imagen no disponible
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={styles.detailInfo}>
                <h1 style={styles.detailTitle}>
                  {product.nombre}{" "}
                  {product.unidad_medida ? product.unidad_medida : "P/Kilo"}
                </h1>
                <p style={styles.detailCode}>
                  {t("code")}: {product.id_producto}
                </p>

                <div style={styles.detailStockWrapper}>
                  {(() => {
                    const best = bestPromoPriceForProduct(product);
                    if (best) {
                      return (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 10,
                          }}
                        >
                          <span style={styles.newPrice}>
                            L. {best.finalPrice.toFixed(2)}
                          </span>
                          <span style={styles.strikePrice}>
                            L. {Number(product.precio_base).toFixed(2)}
                          </span>
                          <span style={styles.offerPill}>{t("offer")}</span>
                        </div>
                      );
                    }
                    return (
                      <div style={styles.detailPrice}>
                        L. {Number(product.precio_base).toFixed(2)}
                      </div>
                    );
                  })()}
                </div>

                <div style={styles.actionsRow}>
                  <div style={styles.quantityWrapper}>
                    <button style={styles.qtyBtn} onClick={decrementQuantity}>
                      <Minus size={20} />
                    </button>
                    <span style={styles.qtyText}>{quantity}</span>
                    <button style={styles.qtyBtn} onClick={incrementQuantity}>
                      <Plus size={20} />
                    </button>
                  </div>

                  <button
                    style={styles.cartBtn}
                    onClick={() => handleAgregar(product.id_producto, quantity)}
                  >
                    {t("addCart")}
                  </button>

                  <button
                    style={{
                      ...styles.favoriteBtn,
                      // antes estaba fijo
                      opacity: favLoading ? 0.6 : 1,
                      backgroundColor: isFav ? "#e11d48" : "#F0833E", // rojo si ya es favorito
                    }}
                    onClick={handleFavorito}
                    disabled={favLoading}
                    title={
                      isFav ? "En tu lista de deseos" : "Agregar a Favoritos"
                    }
                  >
                    <Heart
                      size={24}
                      color="white"
                      fill={isFav ? "white" : "none"}
                    />
                  </button>
                </div>
                <div style={styles.detailDescription}>
                  {t("description")}: {product.descripcion}
                </div>
              </div>
            </div>

            {/* DIVISOR dentro de la misma tarjeta */}
            <hr style={styles.cardDivider} />

            {/* Valoraciones y comentarios – parte del mismo card */}
            <div style={styles.reviewsSection}>
              <h2 style={styles.reviewsTitle}>{t("reviews")}</h2>

              <div style={styles.reviewsGrid}>
                {/* Resumen de estrellas */}
                <div style={styles.summaryCol}>
                  <div style={styles.avgRow}>
                    <div style={styles.avgNumber}>
                      {effectiveAvg?.toFixed(1) || "0.0"}
                    </div>
                    <div>
                      <div>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            filled={
                              n <= (myRating || Math.round(effectiveAvg || 0))
                            }
                            size={24}
                            onClick={() => setMyRating(n)}
                          />
                        ))}
                      </div>
                      <small style={{ color: "#666" }}>{t("clickStars")}</small>

                      <div style={styles.totalReviewsText}>
                        {effectiveTotal}{" "}
                        {effectiveTotal === 1 ? t("opinion") : t("opinions")}
                      </div>
                    </div>
                  </div>

                  {/* Distribución */}
                  <div style={styles.distWrapper}>
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const idx = stars - 1; // 0..4 (dist = [1★,2★,3★,4★,5★])
                      const count = effectiveDist[idx] || 0;
                      const percent = pct(count);
                      return (
                        <div style={styles.distRow} key={stars}>
                          <span style={styles.distLabel}>
                            {stars} {t("starts")}
                          </span>
                          <div style={styles.distBar}>
                            <div
                              style={{
                                ...styles.distBarFill,
                                width: `${percent}%`,
                              }}
                            />
                          </div>
                          <span style={styles.distPct}>
                            {percent}% ({count})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Formulario para dejar comentario */}
                <div style={styles.formCol}>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (myRating < 1) {
                        toast.info(
                          "Debes seleccionar al menos 1 estrella para tu calificación.",
                          { className: "toast-info" }
                        );
                        return;
                      }
                      if (!myComment.trim()) {
                        toast.info("Escribe tu comentario.", {
                          className: "toast-info",
                        });
                        return;
                      }
                      submitReview(e);
                    }}
                  >
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>{t("yourRating")}</label>
                      <div>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            filled={n <= myRating}
                            size={28}
                            onClick={() => setMyRating(n)}
                          />
                        ))}
                      </div>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>{t("yourComment")}</label>
                      <textarea
                        rows={4}
                        value={myComment}
                        onChange={(e) => setMyComment(e.target.value)}
                        placeholder={t("tellUs")}
                        style={styles.textarea}
                      />
                    </div>

                    <button type="submit" style={styles.submitBtn}>
                      {submitting ? t("sending...") : t("submitReview")}
                    </button>
                  </form>
                </div>
              </div>

              {/* Lista de comentarios */}
              <div style={styles.reviewList}>
                {effectiveTotal === 0 ? (
                  <div style={styles.noReviews}>{t("noReviewsYet")}</div>
                ) : (
                  reviews
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
                    )
                    .map((r) => (
                      <div
                        key={r.id_valoracion_producto}
                        style={styles.reviewCard}
                      >
                        <div style={styles.reviewMeta}>
                          <div>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star
                                key={n}
                                filled={n <= Number(r.puntuacion || 0)}
                              />
                            ))}
                          </div>
                          <div style={styles.reviewUserDate}>
                            {r?.usuario?.nombre
                              ? r.usuario.nombre
                              : r.id_usuario
                              ? `Usuario #${r.id_usuario}`
                              : "Usuario"}
                            {" • "}
                            {r.fecha_creacion
                              ? new Date(r.fecha_creacion).toLocaleDateString()
                              : ""}
                          </div>
                        </div>
                        {r.comentario && (
                          <div style={styles.reviewText}>{r.comentario}</div>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
            {/* FIN valoraciones dentro del card */}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  // ====== Layout base ======
  pageWrapper: {
    position: "absolute",
    top: "145px",
    left: 0,
    right: 0,
    width: "100%",
    height: "calc(100% - 145px)",
    display: "flex",
    flexDirection: "column",
  },

  container: {
    padding: "20px",
    margin: "0 auto",
    display: "flex",
    alignItems: "stretch", // columnas igual de altas
    gap: "24px",
    width: "100%",
    maxWidth: "1680px", // más ancho
    boxSizing: "border-box",
  },

  loadingWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f5f5f5",
  },
  loadingText: { fontSize: "20px", color: "#666" },

  // ====== Sidebar (Recomendados) ======
  sidebar: {
    flexShrink: 0,
    width: "360px", // más ancho, mismo look
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
    height: "calc(100vh - 185px)", // misma altura que la derecha
    overflowY: "auto",
    boxSizing: "border-box",
  },
  sidebarTitle: { fontSize: "20px", fontWeight: "600", marginBottom: "16px" },
  List: { display: "flex", flexDirection: "column", gap: "12px" },
  Card: {
    backgroundColor: "white",
    borderRadius: "20px",
    padding: "12px",
    boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
  },
  cardTopRow: {
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
  stars: { color: "#2b6daf", fontSize: "25px" },
  cardImageWrapper: {
    display: "flex",
    justifyContent: "center",
    marginTop: "8px",
  },
  productImg: { width: "60px", height: "60px", objectFit: "contain" },
  cardContent: { marginTop: "12px" },
  cardTitle: {
    fontSize: "15px",
    fontWeight: "500",
    marginBottom: "6px",
    textAlign: "left",
  },
  cardPrice: {
    fontSize: "14px",
    color: "#555",
    marginBottom: "10px",
    textAlign: "left",
  },
  addButton: {
    width: "100%",
    backgroundColor: "#F0833E",
    color: "white",
    border: "none",
    padding: "8px 0",
    borderRadius: "20px",
    cursor: "pointer",
    fontWeight: "600",
  },

  // ====== Columna derecha (con scroll propio) ======
  detailWrapper: {
    flex: 1,
    display: "flex",
    alignItems: "stretch",
    overflowY: "visible", // o auto si quieres scroll interno
  },
  // Card principal: producto + valoraciones
  detailCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    minHeight: "600px", // opcional, solo como base
  },
  cardDivider: {
    border: "none",
    height: "1px",
    background: "#eaeaea",
    margin: "20px 0",
    flexShrink: 0,
  },

  // Grilla superior (imagen + info)
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    width: "100%",
    flexShrink: 0,
  },
  ImageSection: {
    justifyContent: "center",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  mainImageWrapper: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "16px",
    height: "350px",
    backgroundColor: "#fafafa",
  },
  mainImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    borderRadius: "8px",
  },
  mainImagePlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: "8px",
    color: "#999",
    fontSize: "16px",
  },
  smallWrapper: { display: "flex", gap: "8px", justifyContent: "center" },
  smaller: {
    width: "70px",
    height: "70px",
    border: "2px solid #ddd",
    borderRadius: "8px",
    cursor: "pointer",
    overflow: "hidden",
    transition: "all 0.2s ease",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  smallerActive: {
    borderColor: "#2b6daf",
    boxShadow: "0 2px 8px rgba(43, 109, 175, 0.3)",
  },
  smallerImage: { width: "100%", height: "100%", objectFit: "contain" },
  smallerPlaceholder: { fontSize: "10px", color: "#999", textAlign: "center" },

  detailInfo: {
    justifyContent: "center",
    alignItems: "flex-start",
    display: "flex",
    flexDirection: "column",
    padding: "5px",
    gap: "0px",
  },
  detailTitle: { fontSize: "28px", fontWeight: "700" },
  detailCode: { fontSize: "14px", color: "#666", marginBottom: "20px" },
  detailPrice: { fontSize: "26px", fontWeight: "700" },
  detailPriceUnit: { fontSize: "16px", fontWeight: "400" },
  detailDescription: {
    fontSize: "14px",
    color: "#444",
    marginTop: "10px",
    textAlign: "left",
  },
  actionsRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    marginTop: "20px",
    marginBottom: "20px",
  },
  quantityWrapper: { display: "flex", alignItems: "center", gap: "6px" },
  qtyBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#2b6daf",
    color: "white",
    border: "none",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    fontSize: "18px",
    fontWeight: "600",
    width: "30px",
    textAlign: "center",
  },
  cartBtn: {
    flex: 1,
    backgroundColor: "#F0833E",
    color: "white",
    border: "none",
    borderRadius: "25px",
    padding: "10px",
    fontWeight: "600",
    cursor: "pointer",
  },
  favoriteBtn: {
    backgroundColor: "#F0833E",
    border: "none",
    borderRadius: "25px",
    padding: "10px 16px",
    color: "white",
    cursor: "pointer",
  },

  // ====== Valoraciones ======
  reviewsSection: {
    backgroundColor: "transparent",
    marginTop: "20px",
    flex: 1,
    overflow: "visible",
  },
  reviewsTitle: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#2b6daf",
    marginBottom: "16px",
    borderBottom: "2px solid #D8DADC",
    paddingBottom: "8px",
  },
  reviewsGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "20px",
  },

  // Columna izquierda (resumen)
  summaryCol: {
    backgroundColor: "#fafafa",
    border: "1px solid #eee",
    borderRadius: "12px",
    padding: "16px",
  },
  avgRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "16px",
  },
  avgNumber: {
    fontSize: "42px",
    fontWeight: 800,
    lineHeight: 1,
    color: "#16324f",
  },
  totalReviewsText: { fontSize: "14px", color: "#666", marginTop: "4px" },
  distWrapper: { display: "flex", flexDirection: "column", gap: "8px" },
  distRow: {
    display: "grid",
    gridTemplateColumns: "110px 1fr 40px",
    alignItems: "center",
    gap: "10px",
  },
  distLabel: { fontSize: "14px", color: "#333" },
  distBar: {
    position: "relative",
    height: "12px",
    backgroundColor: "#eee",
    borderRadius: "8px",
    overflow: "hidden",
  },
  distBarFill: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: "#2b6daf",
    borderRadius: "8px",
  },
  distPct: { fontSize: "12px", color: "#666", textAlign: "right" },

  // Columna derecha (formulario)
  formCol: {
    backgroundColor: "#fafafa",
    border: "1px solid #eee",
    borderRadius: "12px",
    padding: "16px",
  },
  formGroup: { marginBottom: "12px" },
  formLabel: {
    display: "block",
    fontSize: "14px",
    color: "#333",
    marginBottom: "6px",
    fontWeight: 600,
  },
  textarea: {
    width: "100%",
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "10px",
    fontSize: "14px",
    outline: "none",
    resize: "vertical",
  },
  submitBtn: {
    width: "100%",
    backgroundColor: "#F0833E",
    color: "white",
    border: "none",
    borderRadius: "20px",
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "6px",
  },

  // Lista de comentarios
  reviewList: {
    marginTop: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  noReviews: {
    padding: "16px",
    textAlign: "center",
    color: "#666",
    backgroundColor: "#fafafa",
    border: "1px solid #eee",
    borderRadius: "12px",
  },
  reviewCard: {
    backgroundColor: "white",
    border: "1px solid #eee",
    borderRadius: "12px",
    padding: "14px",
    textAlign: "left",
  },
  reviewMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "6px",
  },
  reviewUserDate: { fontSize: "12px", color: "#777" },
  reviewText: { fontSize: "14px", color: "#333", lineHeight: 1.4 },
  priceRow: {
    width: "100%",
    display: "flex",
    alignItems: "baseline",
    gap: "10px",
  },

  newPrice: {
    fontSize: "20px",
    fontWeight: 900,
    color: "#16a34a", // verde
    lineHeight: 1.1,
  },

  strikePrice: {
    fontSize: "14px",
    color: "#94a3b8",
    textDecoration: "line-through",
    lineHeight: 1.1,
    margin: 0,
  },

  offerChip: {
    backgroundColor: "#ff1744",
    color: "#fff",
    fontWeight: 800,
    fontSize: 12,
    padding: "2px 10px",
    borderRadius: "999px",
    letterSpacing: 1,
  },

  offerPill: {
    backgroundColor: "#ff1744",
    color: "#fff",
    fontWeight: 800,
    fontSize: 12,
    padding: "2px 10px",
    borderRadius: "999px",
    letterSpacing: 1,
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
    zIndex: 2,
  },
};

export default AgregarCarrito;
