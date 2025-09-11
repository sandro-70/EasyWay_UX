// AgregarCarrito.jsx
import React, { useState, useEffect, useMemo } from "react";
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

function AgregarCarrito() {
  const { id } = useParams();
  const navigate = useNavigate();

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

  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // favoritos
  const [favLoading, setFavLoading] = useState(false);

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
  const effectiveAvg = summary.totalReviews > 0 ? summary.avgRating : computed.avgRating;
  const effectiveTotal = summary.totalReviews > 0 ? summary.totalReviews : computed.totalReviews;
  const effectiveDist = summary.totalReviews > 0 ? summary.dist : computed.dist;

  // Para porcentajes y totales visuales
  const safeTotal = Math.max(0, Number(effectiveTotal || 0));
  const pct = (n) => (safeTotal > 0 ? Math.round((n * 100) / safeTotal) : 0);

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
        alert(err?.response?.data?.message || "Error al cargar productos");
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
      console.warn("[RECOMENDADOS] fallback a getAllProducts:", e?.response?.data || e);
    }
  }

  // ======= Valoraciones: listar =======
  async function fetchReviews(productId) {
    try {
      // 🔧 RUTA CORRECTA (singular): /api/producto/:id/valoraciones
      const res = await axiosInstance.get(`/api/producto/${productId}/valoraciones`);
      const body = res?.data || {};

      if (Array.isArray(body.valoraciones)) {
        setReviews(body.valoraciones);
        const r = body.resumen || {};
        setSummary({
          avgRating: Number(r.avgRating || 0),
          totalReviews: Number(r.totalReviews || 0),
          dist: Array.isArray(r.dist) && r.dist.length === 5 ? r.dist : [0, 0, 0, 0, 0],
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
      alert("Inicia sesión para dejar un comentario.");
      return navigate("/login");
    }
    if (myRating < 1 || myRating > 5) {
      return alert("Selecciona una calificación válida (1–5).");
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
      alert(
        e?.response?.data?.error ||
          e?.response?.data?.message ||
          "No se pudo enviar tu opinión"
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ======= Carrito: agregar/sumar =======
  const handleAgregar = async (id_producto, q = quantity) => {
    if (!id_producto) {
      alert("ID de producto no válido");
      return;
    }

    try {
      let carritoActual = null;
      let carritoVacio = false;

      try {
        carritoActual = await ViewCar();
      } catch (error) {
        if (error?.response?.status === 404) {
          carritoVacio = true;
        } else {
          throw error;
        }
      }

      let existe = false;
      if (!carritoVacio && carritoActual?.data) {
        const items = carritoActual.data.carrito_detalles || carritoActual.data;
        existe = Array.isArray(items)
          ? items.some((item) => String(item.id_producto) === String(id_producto))
          : false;
      }

      if (existe) {
        await SumarItem(id_producto, q);
        alert("Se aumentó la cantidad del producto");
      } else {
        await AddNewCarrito(id_producto, q);
        alert("Producto agregado al carrito");
      }

      // refrescar carrito (si falla no bloquea UX)
      try {
        const actualizado = await ViewCar();
        setCarrito(actualizado.data);
      } catch {
        /* noop */
      }
    } catch (error) {
      console.error("Error completo:", error);
      const errorMessage =
        error?.response?.data?.msg ||
        error?.response?.data?.message ||
        error?.message ||
        "No se pudo procesar el carrito";
      alert(errorMessage);
    }
  };

  // ======= Favoritos =======
  async function handleFavorito() {
    if (!product?.id_producto) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Inicia sesión para usar Favoritos.");
      return navigate("/login");
    }

    try {
      setFavLoading(true);
      // await AddProductoFav(product.id_producto);
      // alert("Producto agregado a tus favoritos.");
    } catch (e) {
      console.error("[FAVORITOS] error:", e?.response?.data || e);
      alert(
        e?.response?.data?.error ||
          e?.response?.data?.message ||
          "No se pudo agregar a favoritos"
      );
    } finally {
      setFavLoading(false);
    }
  }

  // ======= Utilidades UI =======
  const incrementQuantity = () => setQuantity((n) => n + 1);
  const decrementQuantity = () => setQuantity((n) => (n > 1 ? n - 1 : 1));
  const handleProductClick = (productId) => navigate(`/producto/${productId}`);

  const getProductImages = (p) =>
    !p || !p.imagenes || p.imagenes.length === 0 ? [null] : p.imagenes.slice(0, 3);

  const handleImageSelect = (index) => setSelectedImageIndex(index);

  const getAvgFromProduct = (p) =>
    Number(p?.rating_avg ?? p?.estrellas ?? p?.valoraciones_avg ?? p?.rating ?? 0);

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
          <h2 style={styles.sidebarTitle}>Compras Frecuentes</h2>
          <div style={styles.List}>
            {products.map((p, index) => (
              <div
                key={index}
                style={styles.Card}
                onClick={() => handleProductClick(p.id_producto)}
              >
                <div style={styles.cardTopRow}>
                  <span style={styles.badge}>Oferta</span>
                  <div style={styles.stars}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        style={{
                          color: i < Math.round(getAvgFromProduct(p)) ? "#2b6daf" : "#ddd",
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <div style={styles.cardImageWrapper}>
                  {p.imagenes && p.imagenes.length > 0 && p.imagenes[0].url_imagen ? (
                    <img
                      src={`/images/productos/${p.imagenes[0].url_imagen}`}
                      alt={p.nombre}
                      style={styles.productImg}
                      onError={(e) => {
                        e.target.src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%23999">Imagen no disponible</text></svg>';
                      }}
                    />
                  ) : (
                    <div style={styles.productImg}>Imagen no disponible</div>
                  )}
                </div>

                <div style={styles.cardContent}>
                  <h3 style={styles.cardTitle}>{p.nombre}</h3>
                  <p style={styles.cardPrice}>L. {p.precio_base} P/Kilo</p>
                  <button
                    style={styles.addButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAgregar(p.id_producto, 1);
                    }}
                  >
                    Agregar
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
                  {productImages[selectedImageIndex] &&
                  productImages[selectedImageIndex].url_imagen ? (
                    <img
                      src={`/images/productos/${productImages[selectedImageIndex].url_imagen}`}
                      style={styles.mainImage}
                      alt={product.nombre}
                      onError={(e) => {
                        e.target.src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="350" viewBox="0 0 400 350"><rect width="400" height="350" fill="%23f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%23999">Imagen no disponible</text></svg>';
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
                          ...(selectedImageIndex === index ? styles.smallerActive : {}),
                        }}
                        onClick={() => handleImageSelect(index)}
                      >
                        {image && image.url_imagen ? (
                          <img
                            src={`/images/productos/${image.url_imagen}`}
                            style={styles.smallerImage}
                            alt={`mini-${index}`}
                            onError={(e) => {
                              e.target.src =
                                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="%23f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" fill="%23999">Imagen no disponible</text></svg>';
                            }}
                          />
                        ) : (
                          <div style={styles.smallerPlaceholder}>Imagen no disponible</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={styles.detailInfo}>
                <h1 style={styles.detailTitle}>{product.nombre}</h1>
                <p style={styles.detailCode}>Código: {product.id_producto}</p>

                <div style={styles.detailStockWrapper}>
                  <div style={styles.detailPrice}>
                    L. {product.precio_base} <span style={styles.detailPriceUnit}>P/Kilo</span>
                  </div>
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
                    AGREGAR AL CARRITO
                  </button>

                  <button
                    style={styles.favoriteBtn}
                    onClick={handleFavorito}
                    disabled={favLoading}
                  >
                    <Heart size={24} fill="white" />
                  </button>
                </div>
                <div style={styles.detailDescription}>Descripción: {product.descripcion}</div>
              </div>
            </div>

            {/* DIVISOR dentro de la misma tarjeta */}
            <hr style={styles.cardDivider} />

            {/* Valoraciones y comentarios – parte del mismo card */}
            <div style={styles.reviewsSection}>
              <h2 style={styles.reviewsTitle}>Valoraciones y comentarios</h2>

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
                            filled={n <= (myRating || Math.round(effectiveAvg || 0))}
                            size={24}
                            onClick={() => setMyRating(n)}
                          />
                        ))}
                      </div>
                      <small style={{ color: "#666" }}>
                        Haz clic en las estrellas para calificar
                      </small>

                      <div style={styles.totalReviewsText}>
                        {effectiveTotal} {effectiveTotal === 1 ? "opinión" : "opiniones"}
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
                            {stars} estrellas
                          </span>
                          <div style={styles.distBar}>
                            <div
                              style={{ ...styles.distBarFill, width: `${percent}%` }}
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
                  <form onSubmit={submitReview}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Tu calificación</label>
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
                      <label style={styles.formLabel}>Tu comentario</label>
                      <textarea
                        rows={4}
                        value={myComment}
                        onChange={(e) => setMyComment(e.target.value)}
                        placeholder="Cuéntanos qué te gustó o no del producto…"
                        style={styles.textarea}
                      />
                    </div>

                    <button
                      type="submit"
                      style={styles.submitBtn}
                      disabled={submitting || myRating < 1}
                    >
                      {submitting ? "Enviando…" : "Enviar opinión"}
                    </button>
                  </form>
                </div>
              </div>

              {/* Lista de comentarios */}
              <div style={styles.reviewList}>
                {effectiveTotal === 0 ? (
                  <div style={styles.noReviews}>
                    Aún no hay opiniones. ¡Sé el primero!
                  </div>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id_valoracion_producto} style={styles.reviewCard}>
                      <div style={styles.reviewMeta}>
                        <div>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} filled={n <= Number(r.puntuacion || 0)} />
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
    height: "100%",
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
  cardImageWrapper: { display: "flex", justifyContent: "center", marginTop: "8px" },
  productImg: { width: "60px", height: "60px", objectFit: "contain" },
  cardContent: { marginTop: "12px" },
  cardTitle: { fontSize: "15px", fontWeight: "500", marginBottom: "6px", textAlign: "left" },
  cardPrice: { fontSize: "14px", color: "#555", marginBottom: "10px", textAlign: "left" },
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
    height: "calc(100vh - 185px)", // misma altura que la izquierda
    display: "flex",
    overflowY: "auto", // scroll solo en la derecha
  },

  // Card principal: producto + valoraciones
  detailCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
    minHeight: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "visible",
    boxSizing: "border-box",
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
  ImageSection: { justifyContent: "center", display: "flex", flexDirection: "column", gap: "12px" },
  mainImageWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "16px",
    height: "350px",
    backgroundColor: "#fafafa",
  },
  mainImage: { width: "100%", height: "100%", objectFit: "contain", borderRadius: "8px" },
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
  smallerActive: { borderColor: "#2b6daf", boxShadow: "0 2px 8px rgba(43, 109, 175, 0.3)" },
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
  detailDescription: { fontSize: "14px", color: "#444", marginTop: "10px", textAlign: "left" },
  actionsRow: { display: "flex", gap: "10px", alignItems: "center", marginTop: "20px", marginBottom: "20px" },
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
  qtyText: { fontSize: "18px", fontWeight: "600", width: "30px", textAlign: "center" },
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
  avgNumber: { fontSize: "42px", fontWeight: 800, lineHeight: 1, color: "#16324f" },
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
  },
  reviewMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "6px",
  },
  reviewUserDate: { fontSize: "12px", color: "#777" },
  reviewText: { fontSize: "14px", color: "#333", lineHeight: 1.4 },
};

export default AgregarCarrito;
