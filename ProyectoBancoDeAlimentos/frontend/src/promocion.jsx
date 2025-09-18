import React, { useState, useRef, useEffect } from "react";
import "./promocion.css";
import Slider from "@mui/material/Slider";
import Checkbox from "@mui/material/Checkbox";
import { getAllProducts } from "./api/InventarioApi";
import { useParams, useNavigate } from "react-router-dom";
import { AddNewCarrito, ViewCar, SumarItem } from "./api/CarritoApi";
import { useCart } from "./utils/CartContext";
import { toast } from "react-toastify";
import "./toast.css";
import axiosInstance from "./api/axiosInstance"; // 👈 para helpers URL (como en Carrito)

// ===== helpers URL imagen (idénticos a Carrito/AgregarCarrito) =====
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

const backendImageUrl = (fileName) =>
  fileName ? `${BACKEND_ORIGIN}/api/images/productos/${encodeURIComponent(fileName)}` : "";

const toPublicFotoSrc = (nameOrPath) => {
  if (!nameOrPath) return "";
  const s = String(nameOrPath);
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/api/images/")) return `${BACKEND_ORIGIN}${encodeURI(s)}`;
  if (s.startsWith("/images/")) return `${BACKEND_ORIGIN}/api${encodeURI(s)}`;
  return backendImageUrl(s);
};

// ===== helpers promo (misma semántica que Carrito) =====
const isDateInRange = (startStr, endStr) => {
  const today = new Date();
  const start = startStr ? new Date(startStr) : null;
  const end = endStr ? new Date(endStr) : null;
  if (start && today < start) return false;
  if (end && today > end) return false;
  return true;
};

// Para la página de promoción mostramos el precio con la promo SI la promo está activa y en fecha.
// (No condicionamos por compra mínima para poder enseñar la “oferta” como tal)
const computeDiscountedPriceForPromoPage = (basePrice, promoInfo) => {
  if (!promoInfo?.activa || !isDateInRange(promoInfo.fecha_inicio, promoInfo.fecha_termina)) {
    return null;
  }
  const price = Number(basePrice) || 0;
  if (price <= 0) return null;

  if (promoInfo.id_tipo_promo === 1 && Number(promoInfo.valor_porcentaje) > 0) {
    const pct = Number(promoInfo.valor_porcentaje) / 100;
    return Math.max(0, price * (1 - pct));
  }
  if (promoInfo.id_tipo_promo === 2 && Number(promoInfo.valor_fijo) > 0) {
    return Math.max(0, price - Number(promoInfo.valor_fijo));
  }
  return null;
};

// lector de estrellas simple
const getStars = (p) =>
  Math.max(0, Math.min(5, Math.round(Number(p?.estrellas ?? p?.rating ?? p?.valoracion ?? 0))));

function Promocion() {
  const navigate = useNavigate();
  const { incrementCart } = useCart();
  const { id: idPromocionParam } = useParams(); // 👈 ahora tratamos este id como ID de PROMOCIÓN

  const prodRefRecomendados = useRef(null);
  const [products, setProducts] = useState([]);            // productos pertenecientes a la promo
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);  // derivadas de products
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderby, setOrder] = useState("");
  const [stateProducto, setState] = useState("Agregar");
  const [btnCompare, setCompare] = useState("COMPARAR");
  const [carrito, setCarrito] = useState(null);
  const [selectedSubcategorias, setSelectedSubcategorias] = useState([]);

  const [priceRange, setPriceRange] = useState([0, 0]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);

  const [selectedMarca, setSelectedMarca] = useState("");
  const [marcasDisponibles, setMarcasDisponibles] = useState([]);

  const [soloOferta, setSoloOferta] = useState(false);

  const [hoveredProductDest, setHoveredProductDest] = React.useState(null);

  // ===== estado de promo: mapping y la info de la promo actual =====
  const [productosDeEstaPromo, setProductosDeEstaPromo] = useState([]); // ids
  const [promoInfo, setPromoInfo] = useState(null);

  // 1) Cargar mapping de promociones→productos y quedarnos con la promo del URL
  useEffect(() => {
    const fetchPromos = async () => {
      try {
        setLoading(true);
        setError(null);

        // /api/promociones/detalles
        const det = await axiosInstance.get("/api/promociones/detalles");
        const lista = Array.isArray(det?.data) ? det.data : [];

        // buscamos el objeto de la promo actual
        const pid = Number(idPromocionParam);
        const item = lista.find((x) => Number(x.id_promocion) === pid);

        const ids = Array.isArray(item?.productos) ? item.productos.map((v) => Number(v)) : [];
        setProductosDeEstaPromo(ids);

        // /api/promociones/listarorden (toda la info y sacamos la actual)
        const inf = await axiosInstance.get("/api/promociones/listarorden");
        const arr = Array.isArray(inf?.data) ? inf.data : [];
        const info = arr.find((p) => Number(p.id_promocion) === pid) || null;

        setPromoInfo(
          info
            ? {
                id_promocion: Number(info.id_promocion),
                id_tipo_promo: Number(info.id_tipo_promo), // 1=%  2=fijo
                valor_porcentaje:
                  info.valor_porcentaje != null ? parseFloat(info.valor_porcentaje) : null,
                valor_fijo: info.valor_fijo != null ? Number(info.valor_fijo) : null,
                compra_min: info.compra_min != null ? Number(info.compra_min) : null,
                fecha_inicio: info.fecha_inicio || null,
                fecha_termina: info.fecha_termina || null,
                activa: info.activa === true || info.activa === 1 || info.activa === "true",
                nombre_promocion: info.nombre_promocion || info.nombre || `Promoción #${pid}`,
              }
            : null
        );
      } catch (e) {
        console.error("[PROMOCION] error mapeando promociones:", e?.response?.data || e);
        setError("No se pudo cargar la promoción");
      } finally {
        setLoading(false);
      }
    };
    if (idPromocionParam) fetchPromos();
  }, [idPromocionParam]);

  // 2) Traer todos los productos y filtrar por los ids de la promo actual
  useEffect(() => {
    const fetchProducts = async () => {
      if (!productosDeEstaPromo.length) {
        setProducts([]);
        setFilteredProducts([]);
        setSubcategorias([]);
        return;
      }
      try {
        setLoading(true);
        const res = await getAllProducts();
        const all = Array.isArray(res?.data) ? res.data : [];

        const byPromo = all.filter((p) =>
          productosDeEstaPromo.includes(Number(p?.id_producto))
        );

        setProducts(byPromo);

        // Subcategorías (derivadas del set actual)
        const subs = [];
        const seen = new Set();
        for (const p of byPromo) {
          const sub = p?.subcategoria;
          const idSub = sub?.id_subcategoria ?? sub?.id;
          const nombreSub = sub?.nombre ?? `Subcategoría ${idSub ?? ""}`;
          if (idSub != null && !seen.has(idSub)) {
            seen.add(idSub);
            subs.push({ id_subcategoria: idSub, nombre: nombreSub });
          }
        }
        setSubcategorias(subs);

        // Rango de precios + marcas
        if (byPromo.length > 0) {
          const precios = byPromo.map((p) => Number(p.precio_base) || 0);
          const min = Math.floor(Math.min(...precios));
          const max = Math.ceil(Math.max(...precios));
          setMinPrice(min);
          setMaxPrice(max);
          setPriceRange([min, max]);

          const marcasSet = new Set();
          byPromo.forEach((p) => {
            const m = p?.marca?.nombre || p?.marca || "";
            if (m && m.trim()) marcasSet.add(m.trim());
          });
          setMarcasDisponibles(Array.from(marcasSet).sort());
        }
      } catch (e) {
        console.error("[PROMOCION] error cargando productos:", e?.response?.data || e);
        setError("No se pudieron cargar los productos");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [productosDeEstaPromo]);

  // ===== filtros (mismo comportamiento de tu componente original) =====
  const handleSubcategoriaChange = (subcategoriaId, checked) => {
    if (checked) setSelectedSubcategorias((prev) => [...prev, subcategoriaId]);
    else setSelectedSubcategorias((prev) => prev.filter((id) => id !== subcategoriaId));
  };

  const handlePriceChange = (e, val) => setPriceRange(val);

  const handleQuickPriceFilter = (type) => {
    if (!products.length) return;
    switch (type) {
      case "menos10":
        setPriceRange([minPrice, Math.min(10, maxPrice)]);
        break;
      case "menos50":
        setPriceRange([minPrice, Math.min(50, maxPrice)]);
        break;
      case "mas100":
        setPriceRange([Math.max(100, minPrice), maxPrice]);
        break;
      default:
        break;
    }
  };

  const handleMarcaChange = (e) => setSelectedMarca(e.target.value);

  useEffect(() => {
    let filtered = [...products];

    // Subcategorías
    if (selectedSubcategorias.length > 0) {
      filtered = filtered.filter((p) => {
        const idSub = p?.subcategoria?.id_subcategoria ?? p?.subcategoria?.id;
        return selectedSubcategorias.includes(idSub);
      });
    }

    // Precio
    filtered = filtered.filter((p) => {
      const precio = Number(p.precio_base) || 0;
      return precio >= priceRange[0] && precio <= priceRange[1];
    });

    // Marca
    if (selectedMarca) {
      filtered = filtered.filter((p) => {
        const m = p?.marca?.nombre || p?.marca || "";
        return m.toLowerCase() === selectedMarca.toLowerCase();
      });
    }

    // Solo oferta (si tiene descuento con ESTA promo)
    if (soloOferta && promoInfo) {
      filtered = filtered.filter(
        (p) => computeDiscountedPriceForPromoPage(p.precio_base, promoInfo) != null
      );
    }

    // Ordenar
    if (orderby === "Mas Vendidos") {
      filtered.sort((a, b) => (b.estrellas || 0) - (a.estrellas || 0));
    } else if (orderby === "Novedades") {
      filtered.sort(
        (a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
      );
    }

    setFilteredProducts(filtered);
  }, [products, selectedSubcategorias, priceRange, selectedMarca, soloOferta, orderby, promoInfo]);

  // ===== carrito =====
  const handleAgregar = async (id_producto) => {
    if (!id_producto) {
      toast.error("ID de producto no válido", { className: "toast-error" });
      return;
    }
    try {
      const carritoActual = await ViewCar();
      const detalles = carritoActual?.data?.carrito_detalles ?? [];
      const existente = detalles.find((d) => d.producto.id_producto === id_producto);

      if (existente) {
        const nuevaCantidad = (existente.cantidad_unidad_medida || 0) + 1;
        await SumarItem(id_producto, nuevaCantidad);
      } else {
        await AddNewCarrito(id_producto, 1);
      }

      const actualizado = await ViewCar();
      setCarrito(actualizado?.data?.carrito_detalles ?? []);
      incrementCart();
      toast.success("Producto agregado al carrito", { className: "toast-success" });
    } catch (error) {
      if (error?.response?.status === 404) {
        try {
          await AddNewCarrito(id_producto, 1);
          const nuevo = await ViewCar();
          setCarrito(nuevo?.data?.carrito_detalles ?? []);
          toast.success("Producto agregado al carrito", { className: "toast-success" });
        } catch (e) {
          toast.error("No se pudo agregar el producto al carrito", { className: "toast-error" });
        }
      } else {
        const msg =
          error?.response?.data?.msg ||
          error?.response?.data?.message ||
          error?.message ||
          "No se pudo procesar el carrito";
        toast.error(msg, { className: "toast-error" });
      }
    }
  };

  const handleProductClick = (idProd) => {
    if (stateProducto === "Comparar") return;
    navigate(`/producto/${idProd}`);
  };

  function agregarComparar() {
    if (stateProducto === "Agregar") {
      setState("Comparar");
      setCompare("CANCELAR");
    } else {
      setState("Agregar");
      setCompare("COMPARAR");
    }
  }

  // ===== UI =====
  if (loading) {
    return (
      <div className="bg-gray-100 w-screen min-h-screen py-2 px-2 flex items-center justify-center">
        <p>Cargando promoción…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-gray-100 w-screen min-h-screen py-2 px-2 flex items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="" style={styles.fixedShell}>
      <div className="flex flex-row">
        {/* Sidebar filtros */}
        <div className="flex flex-col h-[720px] fixed w-[320px] gap-4 p-4" style={{ left: 10 }}>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-4 w-[300px] max-h-[680px] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-3">
              {promoInfo?.nombre_promocion || "Promoción"}
            </h2>

            {/* Sub-categoría (derivada) */}
            <section className="mb-4">
              <h3 className="text-md font-medium mb-2">Sub-categoría</h3>
              <ul className="space-y-1 overflow-y-auto max-h-[100px] pr-2 custom-scroll">
                {subcategorias.length ? (
                  subcategorias.map((sub) => {
                    const idSub = sub.id_subcategoria ?? sub.id;
                    const checked = selectedSubcategorias.includes(idSub);
                    return (
                      <li key={idSub}>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            color="secondary"
                            size="small"
                            checked={checked}
                            onChange={(e) => handleSubcategoriaChange(idSub, e.target.checked)}
                            sx={{ "&.Mui-checked": { color: "#114C87" } }}
                          />
                          <span className="text-sm">{sub.nombre}</span>
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <li className="text-gray-500 text-sm">No hay subcategorías</li>
                )}
              </ul>
            </section>

            <hr className="my-3" />

            {/* Marca */}
            <section className="mb-4">
              <h3 className="text-md font-medium mb-2">Marca</h3>
              <select
                className="w-full border-gray-300 border rounded-md py-2 px-3 focus:outline-none"
                value={selectedMarca}
                onChange={handleMarcaChange}
              >
                <option value="">Todas las marcas</option>
                {marcasDisponibles.map((m, i) => (
                  <option key={i} value={m}>{m}</option>
                ))}
              </select>
            </section>

            <hr className="my-3" />

            {/* Precio */}
            <section className="mb-4">
              <h3 className="text-md font-medium mb-2">Precio</h3>
              <div className="px-1">
                <Slider
                  value={priceRange}
                  onChange={handlePriceChange}
                  min={minPrice}
                  max={maxPrice}
                  step={1}
                  valueLabelDisplay="auto"
                  sx={{ color: "#2b6daf", "& .MuiSlider-thumb": { backgroundColor: "#2b6daf" } }}
                />
                <div className="flex justify-between text-sm text-gray-700 mt-1">
                  <span>L.{priceRange[0]}</span>
                  <span>L.{priceRange[1]}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    className="flex-1 bg-white border border-gray-300 rounded-md h-9 text-sm hover:bg-gray-50"
                    onClick={() => handleQuickPriceFilter("menos10")}
                  >
                    Menos 10L
                  </button>
                  <button
                    className="flex-1 bg-white border border-gray-300 rounded-md h-9 text-sm hover:bg-gray-50"
                    onClick={() => handleQuickPriceFilter("menos50")}
                  >
                    Menos 50L
                  </button>
                  <button
                    className="flex-1 bg-white border border-gray-300 rounded-md h-9 text-sm hover:bg-gray-50"
                    onClick={() => handleQuickPriceFilter("mas100")}
                  >
                    Más 100L
                  </button>
                </div>
              </div>
            </section>

            <hr className="my-3" />

            {/* Etiquetas */}
            <section className="mb-4">
              <h3 className="text-md font-medium mb-2">Etiquetas</h3>
              <div className="flex items-center gap-2">
                <Checkbox
                  color="secondary"
                  size="small"
                  checked={soloOferta}
                  onChange={(e) => setSoloOferta(e.target.checked)}
                  sx={{ "&.Mui-checked": { color: "#114C87" } }}
                />
                <span className="text-sm">Solo en oferta</span>
              </div>
            </section>

            <hr className="my-3" />

            {/* Ordenar Por */}
            <section className="mb-4">
              <h3 className="text-md font-medium mb-2">Ordenar por</h3>
              <div className="grid grid-cols-1 gap-2">
                <button
                  className={`text-left px-3 py-2 rounded-md ${orderby === "Relevancia" ? "bg-[#ffac77] font-semibold" : "hover:bg-[#ffac77]"}`}
                  onClick={() => setOrder("Relevancia")}
                >
                  Relevancia
                </button>
                <button
                  className={`text-left px-3 py-2 rounded-md ${orderby === "Mas Vendidos" ? "bg-[#ffac77] font-semibold" : "hover:bg-[#ffac77]"}`}
                  onClick={() => setOrder("Mas Vendidos")}
                >
                  Mas Vendidos
                </button>
                <button
                  className={`text-left px-3 py-2 rounded-md ${orderby === "Novedades" ? "bg-[#ffac77] font-semibold" : "hover:bg-[#ffac77]"}`}
                  onClick={() => setOrder("Novedades")}
                >
                  Novedades
                </button>
              </div>
            </section>

            <hr className="my-3" />

            {/* Comparar */}
            <section className="flex flex-col items-center gap-2">
              <button
                onClick={agregarComparar}
                className={`px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-md transition-colors duration-300 w-full
                ${stateProducto === "Agregar" ? "bg-[#2B6DAF] hover:bg-[#1f4e7f]" : "bg-[#80838A]"}`}
              >
                {btnCompare}
              </button>
            </section>
          </div>
        </div>

        {/* Grid de productos */}
        <div className="w-full ml-[350px] mr-[20px]">
          <div style={styles.divProducts} ref={prodRefRecomendados}>
            {filteredProducts.length === 0 ? (
              <div className="col-span-5 text-center py-10">
                <p>No hay productos para esta promoción con los filtros aplicados.</p>
              </div>
            ) : (
              filteredProducts.map((p, i) => {
                const discounted =
                  promoInfo ? computeDiscountedPriceForPromoPage(p.precio_base, promoInfo) : null;
                const img =
                  Array.isArray(p?.imagenes) && p.imagenes.length
                    ? toPublicFotoSrc(
                        p.imagenes[0].url_imagen ||
                          p.imagenes[0].url ||
                          p.imagenes[0].ruta ||
                          p.imagenes[0].path ||
                          p.imagenes[0].imagen ||
                          p.imagenes[0].foto
                      )
                    : "";

                return (
                  <div
                    key={p.id_producto ?? i}
                    style={{
                      ...styles.productBox,
                      border: hoveredProductDest === i ? "2px solid #2b6daf" : "2px solid transparent",
                      transform: hoveredProductDest === i ? "scale(1.05)" : "scale(1)",
                      transition: "all 0.2s ease-in-out",
                      cursor: "pointer",
                    }}
                    onMouseEnter={() => setHoveredProductDest(i)}
                    onMouseLeave={() => setHoveredProductDest(null)}
                    onClick={() => handleProductClick(p.id_producto)}
                  >
                    <div style={styles.topRow}>
                      {discounted != null && <span style={styles.offerChip}>OFERTA</span>}
                      <span style={styles.stars}>
                        {Array.from({ length: 5 }, (_, k) => (
                          <span key={k} style={{ color: k < getStars(p) ? "#2b6daf" : "#ddd", fontSize: 18 }}>
                            ★
                          </span>
                        ))}
                      </span>
                    </div>

                    {img ? (
                      <img
                        src={img}
                        alt={p.nombre}
                        style={styles.productImg}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%23999">Imagen no disponible</text></svg>';
                        }}
                      />
                    ) : (
                      <div style={styles.productImg} className="flex items-center justify-center text-xs text-gray-500">
                        Imagen no disponible
                      </div>
                    )}

                    <p style={styles.productName}>{p.nombre}</p>

                    {/* Precio como en Carrito */}
                    <div style={styles.priceRow}>
                      {discounted != null ? (
                        <>
                          <span style={styles.newPrice}>L. {discounted.toFixed(2)}</span>
                          <span style={styles.strikePrice}>L. {Number(p.precio_base).toFixed(2)}</span>
                        </>
                      ) : (
                        <span style={styles.productPrice}>L. {Number(p.precio_base).toFixed(2)}</span>
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
                      Agregar
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
  divProducts: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "13px",
    width: "100%",
    padding: "10px",
  },
  productBox: {
    height: "260px",
    borderRadius: "25px",
    padding: "12px",
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
    marginBottom: "6px",
  },
  stars: { color: "#2b6daf", fontSize: "18px" },
  productName: {
    width: "100%",
    textAlign: "left",
    fontSize: "16px",
    marginTop: "8px",
    fontWeight: 600,
  },
  productPrice: {
    width: "100%",
    textAlign: "left",
    fontSize: "15px",
    color: "#999",
    marginTop: "4px",
  },
  addButton: {
    marginTop: "auto",
    width: "100%",
    color: "white",
    border: "none",
    borderRadius: "20px",
    padding: "8px 0",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 600,
  },
  productImg: {
    width: "90px",
    height: "90px",
    objectFit: "contain",
    marginTop: "6px",
  },
  // —— estilos de precio iguales a Carrito ——
  priceRow: {
    width: "100%",
    display: "flex",
    alignItems: "baseline",
    gap: "10px",
    marginTop: "auto",
  },
  newPrice: { fontSize: 17, fontWeight: 900, color: "#16a34a", lineHeight: 1.1 },
  strikePrice: { fontSize: 14, color: "#94a3b8", textDecoration: "line-through", lineHeight: 1.1 },
  offerChip: {
    backgroundColor: "#ff1744",
    color: "#fff",
    fontWeight: 800,
    fontSize: 12,
    padding: "2px 8px",
    borderRadius: "999px",
    letterSpacing: 1,
  },
};

export default Promocion;
