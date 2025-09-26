import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "./api/axiosInstance";
import { UserContext } from "./components/userContext";
import { useCart } from "./utils/CartContext";
import { ViewCar, AddNewCarrito, SumarItem } from "./api/CarritoApi";
import {
  getAllSucursales,
  listarProductosporsucursal,
  getProductosRecomendados,
} from "./api/InventarioApi";
import { getAllMetodoPago } from "./api/metodoPagoApi";
import { crearPedido } from "./api/PedidoApi";
import { agregarAuditoria } from "./api/auditoriaApi";
import { getPromociones } from "./api/PromocionesApi";
import { toast } from "react-toastify";
import "./toast.css";
import arrowL from "./images/arrowL.png";
import arrowR from "./images/arrowR.png";
import { enviarCorreo } from "./api/Usuario.Route";
import {
  usarCuponHistorial,
  editarCupon,
  desactivarCupon,
  checkCuponUsuario,
} from "./api/CuponesApi";
import { jwtDecode } from "jwt-decode";

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

const toPublicFotoSrc = (nameOrPath) => {
  if (!nameOrPath) return "";
  const s = String(nameOrPath);
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/api/images/")) return `${BACKEND_ORIGIN}${encodeURI(s)}`;
  if (s.startsWith("/images/")) return `${BACKEND_ORIGIN}/api${encodeURI(s)}`;
  return `${BACKEND_ORIGIN}/api/images/productos/${encodeURIComponent(s)}`;
};

const ProcesoCompra = () => {
  const { user } = useContext(UserContext);
  const { setCount, incrementCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Cupón (desde state o localStorage)
  const [coupon, setCoupon] = useState(() => {
    return (
      location.state?.coupon ||
      JSON.parse(localStorage.getItem("checkout.coupon") || "null")
    );
  });

  const getUserId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      return decoded.id;
    } catch {
      console.error("Token JWT inválido");
      return null;
    }
  };

  // ==== Helpers fecha cupón ====
  const parseCouponDateLocal = (input) => {
    if (!input) return null;
    const s = String(input).trim();
    const ymd = s.split("T")[0];
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(ymd);
    if (!m) {
      const d = new Date(s);
      return isNaN(d)
        ? null
        : new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    }
    const y = Number(m[1]),
      mo = Number(m[2]) - 1,
      d = Number(m[3]);
    return new Date(y, mo, d, 0, 0, 0, 0);
  };
  const startOfDayLocal = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const isCouponExpired = (termina_en) => {
    const exp = parseCouponDateLocal(termina_en);
    if (!exp) return false;
    const today = startOfDayLocal();
    return today.getTime() >= exp.getTime();
  };

  // ====== ESTADO UI ======
  const [direccionSeleccionada, setDireccionSeleccionada] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [mostrarResumen, setMostrarResumen] = useState(false);

  const [detalles, setDetalles] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [idSucursal, setIdSucursal] = useState(null);
  const [metodosPago, setMetodosPago] = useState([]);
  const [stockPorSucursal, setStockPorSucursal] = useState({});
  const [promociones, setPromociones] = useState([]);
  const [promocionAplicada, setPromocionAplicada] = useState(null);

  const [prodRec, setProdRec] = useState([]);
  const [hoveredProductRec, setHoveredProductRec] = useState(null);
  const prodRefRecomendados = useRef(null);

  // ====== NUEVO: datos persistidos desde Carrito ======
  const readTotals = () =>
    JSON.parse(localStorage.getItem("checkout.totals") || "null");
  const readItemsBreakdown = () =>
    JSON.parse(localStorage.getItem("checkout.itemBreakdown") || "null");
  const readPromotionSummary = () =>
    JSON.parse(localStorage.getItem("checkout.promotions") || "null");

  const [persistedTotals, setPersistedTotals] = useState(readTotals()); // ⬅️ NUEVO
  const [itemBreakdown, setItemBreakdown] = useState(readItemsBreakdown()); // ⬅️ NUEVO
  const [promoSummary, setPromoSummary] = useState(readPromotionSummary()); // ⬅️ NUEVO

  // Subtotal "visual" (respaldo si no hay persistidos)
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Sucursal guardada
  useEffect(() => {
    const sucursalGuardada = localStorage.getItem("sucursalSeleccionada");
    if (sucursalGuardada) {
      setIdSucursal(Number(sucursalGuardada));
      cargarStockPorSucursal(Number(sucursalGuardada));
    }
  }, []);

  const getStockEnSucursal = (idProducto) => {
    if (!idSucursal || !stockPorSucursal[idSucursal]) return 0;
    const producto = stockPorSucursal[idSucursal].find(
      (p) => p.id_producto === idProducto
    );
    return producto ? producto.stock_en_sucursal : 0;
  };

  // Fechas promos
  const isDateInRange = (startStr, endStr) => {
    const today = new Date();
    const start = startStr ? new Date(startStr) : null;
    const end = endStr ? new Date(endStr) : null;
    if (start && today < start) return false;
    if (end && today > end) return false;
    return true;
  };

  // Precio %/fijo por producto (solo para recomendaciones UI)
  const computeDiscountedPriceByPromo = (basePrice, pInfo) => {
    if (!pInfo?.activa || !isDateInRange(pInfo.fecha_inicio, pInfo.fecha_termina))
      return null;
    const price = Number(basePrice) || 0;
    if (price <= 0) return null;
    if (pInfo.id_tipo_promo === 1 && Number(pInfo.valor_porcentaje) > 0) {
      const pct = Number(pInfo.valor_porcentaje) / 100;
      return Math.max(0, price * (1 - pct));
    }
    if (pInfo.id_tipo_promo === 2 && Number(pInfo.valor_fijo) > 0) {
      return Math.max(0, price - Number(pInfo.valor_fijo));
    }
    return null;
  };

  // Cargar promos (solo para recomendaciones UI)
  const [promosPorProducto, setPromosPorProducto] = useState({});
  const [promosInfo, setPromosInfo] = useState({});
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
    return best;
  };

  const cargarPromosDetalles = async () => {
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
  const cargarPromosInfo = async () => {
    try {
      const res = await axiosInstance.get("/api/promociones/listarorden");
      const arr = Array.isArray(res?.data) ? res.data : [];
      const map = {};
      for (const p of arr) {
        map[Number(p.id_promocion)] = {
          id_promocion: Number(p.id_promocion),
          id_tipo_promo: Number(p.id_tipo_promo),
          valor_porcentaje:
            p.valor_porcentaje != null ? parseFloat(p.valor_porcentaje) : null,
          valor_fijo: p.valor_fijo != null ? Number(p.valor_fijo) : null,
          compra_min: p.compra_min != null ? Number(p.compra_min) : null,
          fecha_inicio: p.fecha_inicio || null,
          fecha_termina: p.fecha_termina || null,
          activa: p.activa === true || p.activa === 1 || p.activa === "true",
        };
      }
      setPromosInfo(map);
    } catch (err) {
      console.error("[PROMOS LISTARORDEN] error:", err?.response?.data || err);
    }
  };

  // Stock por sucursal
  const cargarStockPorSucursal = async (idSucursalParam) => {
    if (!idSucursalParam) return;
    try {
      const response = await listarProductosporsucursal(idSucursalParam);
      const productos = response.data || [];
      setStockPorSucursal((prev) => ({
        ...prev,
        [idSucursalParam]: productos,
      }));
    } catch (error) {
      console.error(
        `Error cargando stock para sucursal ${idSucursalParam}:`,
        error
      );
    }
  };

  // ====== Revalidar cupón al entrar ======
  useEffect(() => {
    (async () => {
      if (!coupon || !user?.id_usuario) return;

      if (isCouponExpired(coupon.termina_en)) {
        toast.info("El cupón expiró antes de finalizar la compra.", {
          className: "toast-info",
        });
        localStorage.removeItem("checkout.coupon");
        setCoupon(null);
        return;
      }

      try {
        const r = await checkCuponUsuario(coupon.id_cupon, user.id_usuario);
        if (r?.data?.usado) {
          toast.info("Este cupón ya fue usado en otra compra.", {
            className: "toast-info",
          });
          localStorage.removeItem("checkout.coupon");
          setCoupon(null);
        }
      } catch {
        // backend revalida igual
      }
    })();
  }, [coupon, user?.id_usuario]);

  // ====== Carga inicial ======
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const carritoRes = await ViewCar();
        const carritoDetalles = carritoRes.data.carrito_detalles ?? [];
        setDetalles(carritoDetalles);

        // Respaldo de subtotal "clásico" si no hay persistidos
        const sub = carritoDetalles.reduce(
          (acc, item) => acc + (item.subtotal_detalle || 0),
          0
        );
        setSubtotal(sub);

        const sucursalesRes = await getAllSucursales();
        setSucursales(sucursalesRes?.data ?? []);

        const metodosRes = await getAllMetodoPago();
        setMetodosPago(metodosRes.data || []);

        const promocionesRes = await getPromociones();
        setPromociones(promocionesRes.data || []);

        const recRes = await getProductosRecomendados();
        setProdRec(recRes.data || []);

        await cargarPromosDetalles();
        await cargarPromosInfo();

        // refrescar cache persistida por si llegó desde una pestaña distinta
        setPersistedTotals(readTotals());
        setPromoSummary(readPromotionSummary());
        setItemBreakdown(readItemsBreakdown());
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
        toast.error("Error cargando datos del checkout", {
          className: "toast-error",
        });
      }
    };

    if (user?.id_usuario) {
      cargarDatosIniciales();
    }
  }, [user]);

  useEffect(() => {
    if (idSucursal) {
      cargarStockPorSucursal(idSucursal);
    }
  }, [idSucursal]);

  // ====== Summary helpers (prefiere valores persistidos) ======
  const getSubtotalConEscalonados = () =>
    Number(persistedTotals?.subtotal_escalonados ?? subtotal) || 0;

  const getDescPromoGlobal = () =>
    Number(persistedTotals?.descuento_promo_global ?? 0) || 0;

  const getDescCupon = () =>
    Number(persistedTotals?.descuento_cupon ?? 0) || 0;

  const getSubtotalNeto = () =>
    Number(persistedTotals?.subtotal_neto ?? (getSubtotalConEscalonados() - getDescPromoGlobal() - getDescCupon())) || 0;

  const getImpuesto = () =>
    Number(persistedTotals?.impuesto ?? (getSubtotalNeto() * 0.15)) || 0;

  const getEnvio = () => Number(persistedTotals?.envio ?? 10) || 0;

  const getTotal = () =>
    Number(persistedTotals?.total ?? (getSubtotalNeto() + getImpuesto() + getEnvio())) || 0;

  // ====== Flags ======
  const hayProductoSinStock = detalles.some(
    (p) => getStockEnSucursal(p.producto.id_producto) === 0
  );

  if (!user?.id_usuario) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🔒</div>
            <div style={styles.emptyText}>Debes iniciar sesión</div>
            <p style={styles.emptySubtext}>
              Para acceder al checkout necesitas estar autenticado
            </p>
            <button style={styles.button} onClick={() => navigate("/login")}>
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (detalles.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <header style={styles.headerWrapper}>
            <h1 style={styles.header}>Proceso de Compra</h1>
            <div style={styles.headerLineWrapper}>
              <div style={styles.headerLine}></div>
            </div>
          </header>
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🛒</div>
            <div style={styles.emptyText}>Tu carrito está vacío</div>
            <p style={styles.emptySubtext}>
              Agrega productos antes de proceder al checkout
            </p>
            <button style={styles.button} onClick={() => navigate("/")}>
              Explorar Productos
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ====== AUDITORÍA ======
  const registrarAuditoriasVenta = async (detallesPedido, idSucursalPedido) => {
    const id_usuario = getUserId();
    if (!id_usuario) return;
    try {
      for (const item of detallesPedido) {
        await agregarAuditoria(
          item.producto.id_producto,
          id_usuario,
          idSucursalPedido,
          item.cantidad_unidad_medida,
          "salida"
        );
      }
    } catch (error) {
      console.error("Error registrando auditorías:", error);
    }
  };

  // ====== Comprar ======
  const realizarCompra = async () => {
    if (!user.direccions || user.direccions.length === 0) {
      toast.error("Debes registrar al menos una dirección", {
        className: "toast-error",
      });
      return;
    }
    if (!metodoPago) {
      toast.error("Selecciona un método de pago", { className: "toast-error" });
      return;
    }
    for (const item of detalles) {
      const stockDisponible = getStockEnSucursal(item.producto.id_producto);
      if (item.cantidad_unidad_medida > stockDisponible) {
        toast.error(`No hay suficiente stock de ${item.producto.nombre}`, {
          className: "toast-error",
        });
        return;
      }
    }

    setLoading(true);
    try {
      // ⬅️ USA LOS TOTALES PERSISTIDOS
      const totals = readTotals();
      const total_factura = Number(totals?.total ?? getTotal());
      const descuento_total =
        Number(totals?.descuento_promo_global || 0) +
        Number(totals?.descuento_cupon || 0) +
        Math.max(
          0,
          Number(totals?.subtotal_escalonados || 0) -
            Number(totals?.subtotal_neto || 0)
        ); // incluye el efecto del escalonado

      const id_direccion =
        direccionSeleccionada || user.direccions[0].id_direccion.toString();
      const sucursalId = Number(idSucursal ?? sucursales[0]?.id_sucursal ?? 2);

      const response = await crearPedido(
        user.id_usuario,
        id_direccion,
        sucursalId,
        promoSummary?.promoGlobal?.id_promocion ?? null,
        descuento_total
      );
      const id_pedido = response.data.id_pedido;

      await registrarAuditoriasVenta(detalles, sucursalId);

      // Cupón
      try {
        if (coupon?.id_cupon) {
          await usarCuponHistorial(
            coupon.id_cupon,
            user.id_usuario,
            id_pedido,
            new Date().toISOString()
          );

          if (typeof coupon.uso_maximo_por_usuario !== "undefined") {
            const usosRestantes = Number(coupon.uso_maximo_por_usuario) - 1;
            if (usosRestantes > 0) {
              await editarCupon(
                coupon.id_cupon,
                coupon.codigo,
                coupon.descripcion || "",
                coupon.tipo,
                coupon.valor,
                usosRestantes,
                coupon.termina_en,
                true
              );
            } else {
              await desactivarCupon(coupon.id_cupon);
            }
          }
          localStorage.removeItem("checkout.coupon");
          setCoupon(null);
        }
      } catch (cupErr) {
        console.error("Cupón: error registrando/actualizando:", cupErr);
      }

      // ===== Correo (coherente con los números) =====
      try {
        const productosResumen = (itemBreakdown || detalles).map((it) => {
          const nombre = it?.nombre || it?.producto?.nombre || "";
          const qty = it?.qty ?? it?.cantidad_unidad_medida ?? 0;
          const base = it?.base ?? it?.subtotal_detalle ?? 0;
          const sub = it?.escalonado?.subtotal ?? base;
          return `• ${nombre} - Cantidad: ${qty} - Subtotal: L. ${Number(sub).toFixed(2)}`;
        }).join("\n");

        const direccionEnvio = user.direccions.find(
          (dir) => dir.id_direccion.toString() === id_direccion
        );
        const direccionTexto = direccionEnvio
          ? direccionEnvio.direccion_completa ||
            `${direccionEnvio.calle}, ${direccionEnvio.ciudad}`
          : "Dirección no especificada";

        const sucursalNombre =
          sucursales.find((s) => s.id_sucursal == sucursalId)?.nombre_sucursal ||
          `Sucursal ${sucursalId}`;

        const lineaEsc = promoSummary?.anyEscalonado
          ? `\n• Ahorro Escalonado: -L. ${Number(
              promoSummary.ahorroEscalonados || 0
            ).toFixed(2)}`
          : "";

        const lineaPromo = promoSummary?.promoGlobal
          ? `\n• Descuento Promoción (${promoSummary.promoGlobal.nombre || "Promoción"}): -L. ${Number(
              totals?.descuento_promo_global || 0
            ).toFixed(2)}`
          : "";

        const lineaCupon = coupon
          ? `\n• Descuento Cupón (${coupon.codigo}${
              coupon.tipo === "porcentaje" ? ` ${Number(coupon.valor)}%` : ""
            }): -L. ${Number(totals?.descuento_cupon || 0).toFixed(2)}`
          : "";

        const asunto = `Confirmación de Pedido #${id_pedido}`;

        const descripcion = `
Estimado/a ${user.nombre} ${user.apellido},

Su pedido ha sido procesado exitosamente. A continuación encontrará el resumen de su compra:

═══════════════════════════════════════
INFORMACIÓN DEL PEDIDO
═══════════════════════════════════════
• Número de Pedido: #${id_pedido}
• Fecha: ${new Date().toLocaleDateString("es-HN", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
• Sucursal: ${sucursalNombre}

═══════════════════════════════════════
PRODUCTOS SOLICITADOS
═══════════════════════════════════════
${productosResumen}

═══════════════════════════════════════
RESUMEN DE PAGO
═══════════════════════════════════════
• Subtotal (con escalonados): L. ${Number(
          totals?.subtotal_escalonados || getSubtotalConEscalonados()
        ).toFixed(2)}${lineaEsc}${lineaPromo}${lineaCupon}
• Subtotal con descuentos: L. ${Number(
          totals?.subtotal_neto || getSubtotalNeto()
        ).toFixed(2)}
• Impuesto (15%): L. ${Number(totals?.impuesto || getImpuesto()).toFixed(2)}
• Envío: L. ${Number(totals?.envio || getEnvio()).toFixed(2)}
• TOTAL PAGADO: L. ${Number(total_factura).toFixed(2)}

═══════════════════════════════════════
DIRECCIÓN DE ENVÍO
═══════════════════════════════════════
${direccionTexto}

═══════════════════════════════════════
MÉTODO DE PAGO
═══════════════════════════════════════
${(() => {
  if (metodoPago === "paypal") return "PayPal";
  if (metodoPago === "efectivo") return "Efectivo (Pago contra entrega)";
  const mp = metodosPago.find((m) => m.id_metodo_pago.toString() === metodoPago);
  return mp ? `${mp.nombre_en_tarjeta} (**** **** **** ${mp.tarjeta_ultimo})` : "No especificado";
})()}

¡Gracias por su compra!

Atentamente,
El equipo de EasyWay
`.trim();

        const descripcionHTML =
          `<div style="white-space:pre-wrap; font-family:Arial, sans-serif; font-size:14px; line-height:1.5">` +
          descripcion
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\r?\n/g, "<br/>") +
          `</div>`;

        await enviarCorreo(user.correo, descripcionHTML, asunto);
      } catch (emailError) {
        console.error("Error enviando correo:", emailError);
        toast.warning(
          "Pedido creado, pero no se pudo enviar el correo de confirmación",
          { className: "toast-warn" }
        );
      }

      setPromocionAplicada(null);
      setCount(0);
      toast.success(`¡Pedido #${id_pedido} creado correctamente!`, {
        className: "toast-success",
      });
      navigate("/misPedidos");
    } catch (err) {
      console.error("Error creando pedido:", err);
      const errorMessage =
        err?.response?.data?.error || "No se pudo crear el pedido";
      toast.error(errorMessage, { className: "toast-error" });
    } finally {
      setLoading(false);
    }
  };

  // ====== UI ======
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <header style={styles.headerWrapper}>
          <h1 style={styles.header}>Proceso de Compra</h1>
          <div style={styles.headerLineWrapper}>
            <div style={styles.headerLine}></div>
          </div>
        </header>

        <div style={styles.mainLayout}>
          <div style={styles.leftColumn}>
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Productos en tu carrito</h2>

              {/* Lista de ítems: si hay breakdown lo usamos, si no, la vista original */}
              {(itemBreakdown || detalles).map((it, index) => {
                const nombre = it?.nombre || it?.producto?.nombre || "";
                const qty = it?.qty ?? it?.cantidad_unidad_medida ?? 0;
                const base = Number(it?.base ?? it?.subtotal_detalle ?? 0);
                const escal = it?.escalonado;
                const sub = Number(escal?.subtotal ?? base);
                const packInfo =
                  escal?.applied && escal.packQty
                    ? `Escalonado: ${escal.packQty} por L. ${Number(
                        escal.packPrice
                      ).toFixed(2)}`
                    : "";

                const imgUrl =
                  it?.producto?.imagenes?.[0]?.url_imagen ||
                  it?.imagenes?.[0]?.url_imagen ||
                  "";

                const idProd =
                  it?.id_producto || it?.producto?.id_producto || 0;

                return (
                  <div key={index} style={styles.productItem}>
                    {imgUrl ? (
                      <img
                        src={toPublicFotoSrc(imgUrl)}
                        alt={nombre}
                        style={styles.productImage}
                        onError={(e) => {
                          e.target.src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="%23f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="%23999">No img</text></svg>';
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          ...styles.productImage,
                          backgroundColor: "#f0f0f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.7rem",
                          color: "#999",
                        }}
                      >
                        No img
                      </div>
                    )}

                    <div style={styles.productInfo}>
                      <div style={styles.productName}>{nombre}</div>
                      <div style={styles.productQuantity}>
                        Cantidad: {qty} | Stock disponible:{" "}
                        {getStockEnSucursal(Number(idProd))}
                        {packInfo && (
                          <div style={{ color: "#16a34a", fontSize: "0.8rem" }}>
                            {packInfo}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={styles.productPrice}>
                      L. {sub.toFixed(2)}
                      {base > sub && (
                        <div
                          style={{
                            color: "#94a3b8",
                            textDecoration: "line-through",
                            fontWeight: 400,
                            fontSize: "0.85rem",
                          }}
                        >
                          L. {base.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dirección */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Dirección de Envío</h2>
              <div style={styles.formGroup}>
                <label style={styles.label}>Selecciona una dirección:</label>
                <select
                  style={styles.select}
                  value={direccionSeleccionada}
                  onChange={(e) => setDireccionSeleccionada(e.target.value)}
                >
                  <option value="">Seleccionar dirección...</option>
                  {user.direccions?.map((direccion) => (
                    <option
                      key={direccion.id_direccion}
                      value={direccion.id_direccion.toString()}
                    >
                      {direccion.direccion_completa ||
                        `${direccion.calle}, ${direccion.ciudad}`}
                    </option>
                  ))}
                </select>
              </div>
              {!user.direccions ||
                (user.direccions.length === 0 && (
                  <p style={{ color: "#dc3545", fontSize: "0.9rem" }}>
                    <span>
                      No tienes direcciones registradas.
                      <br />
                      <br />
                    </span>
                    <button
                      onClick={() => navigate("/miPerfil")}
                      style={{ ...styles.buttonSmall, marginLeft: "10px" }}
                    >
                      Agregar Dirección
                    </button>
                  </p>
                ))}
            </div>

            {/* Pago */}
            <div style={styles.lastSection}>
              <h2 style={styles.sectionTitle}>Método de Pago</h2>
              <div style={styles.radioGroup}>
                <div style={styles.radioItem}>
                  <input
                    type="radio"
                    id="paypal"
                    name="metodoPago"
                    value="paypal"
                    style={styles.radioInput}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    checked={metodoPago === "paypal"}
                  />
                  <label htmlFor="paypal" style={styles.radioLabel}>
                    <span>PayPal</span>
                    <span>Pago seguro con paypal</span>
                  </label>
                </div>

                <div style={styles.radioItem}>
                  <input
                    type="radio"
                    id="efectivo"
                    name="metodoPago"
                    value="efectivo"
                    style={styles.radioInput}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    checked={metodoPago === "efectivo"}
                  />
                  <label htmlFor="efectivo" style={styles.radioLabel}>
                    <span>Efectivo</span>
                    <span>Pago contra entrega</span>
                  </label>
                </div>

                {metodosPago.map((metodo) => (
                  <div key={metodo.id_metodo_pago} style={styles.radioItem}>
                    <input
                      type="radio"
                      id={`metodo-${metodo.id_metodo_pago}`}
                      name="metodoPago"
                      value={metodo.id_metodo_pago.toString()}
                      style={styles.radioInput}
                      onChange={(e) => setMetodoPago(e.target.value)}
                      checked={metodoPago === metodo.id_metodo_pago.toString()}
                    />
                    <label
                      htmlFor={`metodo-${metodo.id_metodo_pago}`}
                      style={styles.radioLabel}
                    >
                      <span>{metodo.nombre_en_tarjeta}</span>
                      <span>**** **** **** {metodo.tarjeta_ultimo}</span>
                    </label>
                  </div>
                ))}
              </div>

              {metodosPago.length === 0 && (
                <p style={{ color: "#dc3545", fontSize: "0.9rem" }}>
                  <span>
                    No hay métodos de pago registrados.
                    <br />
                    <br />
                  </span>
                  <button
                    onClick={() => navigate("/miPerfil")}
                    style={{ ...styles.buttonSmall, marginLeft: "10px" }}
                  >
                    Agregar Metodo de Pago
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* Derecha */}
          <div style={styles.rightColumn}>
            <div style={styles.sidebar}>
              <h3 style={styles.sidebarTitle}>Sucursal Seleccionada</h3>
              <div style={styles.sucursalInfo}>
                {sucursales.find((s) => s.id_sucursal == idSucursal)
                  ?.nombre_sucursal || `Sucursal ${idSucursal}`}
              </div>

              {/* Caja: Escalonado activo */}
              {promoSummary?.anyEscalonado && (
                <div style={styles.promoSuccess}>
                  Precio Escalonado activo<br />
                  Ahorro total:{" "}
                  <strong>
                    L. {Number(promoSummary.ahorroEscalonados || 0).toFixed(2)}
                  </strong>
                </div>
              )}

              {/* Promo global */}
              {promoSummary?.promoGlobal && (
                <div style={styles.promoSuccess}>
                  Promoción aplicada: {promoSummary.promoGlobal.nombre || "Promoción"}<br />
                  {promoSummary.promoGlobal.tipo === 1
                    ? `Descuento: ${Number(
                        promoSummary.promoGlobal.valor_porcentaje || 0
                      )}%`
                    : `Descuento: L. ${Number(
                        promoSummary.promoGlobal.valor_fijo || 0
                      ).toFixed(2)}`}
                </div>
              )}

              {/* Cupón */}
              {coupon && (
                <div style={styles.promoSuccess}>
                  Cupón aplicado: <strong>{coupon.codigo}</strong>{" "}
                  {coupon.tipo === "porcentaje"
                    ? `(${Number(coupon.valor)}%)`
                    : `(L. ${Number(coupon.valor).toFixed(2)})`}
                </div>
              )}

              <h3 style={styles.resumenTitle}>Resumen de pago</h3>

              {mostrarResumen && (
                <div
                  style={{
                    marginBottom: "15px",
                    fontSize: "0.9rem",
                    color: "#495057",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <span>Subtotal</span>
                    <span>
                      L. {getSubtotalConEscalonados().toFixed(2)}
                    </span>
                  </div>

                  {getDescPromoGlobal() > 0 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        color: "#16a34a",
                      }}
                    >
                      <span>Promoción</span>
                      <span>-L. {getDescPromoGlobal().toFixed(2)}</span>
                    </div>
                  )}

                  {getDescCupon() > 0 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        color: "#16a34a",
                      }}
                    >
                      <span>Cupón</span>
                      <span>-L. {getDescCupon().toFixed(2)}</span>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                      fontWeight: "500",
                      paddingTop: "8px",
                      borderTop: "1px solid #e9ecef",
                    }}
                  >
                    <span>Subtotal con descuentos</span>
                    <span>L. {getSubtotalNeto().toFixed(2)}</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <span>Impuesto (15%)</span>
                    <span>L. {getImpuesto().toFixed(2)}</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <span>Envío</span>
                    <span>L. {getEnvio().toFixed(2)}</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: "bold",
                      fontSize: "1.1rem",
                      paddingTop: "12px",
                      marginTop: "8px",
                      borderTop: "2px solid #2ca9e3",
                      color: "#2b6daf",
                    }}
                  >
                    <span>Total a pagar</span>
                    <span>L. {getTotal().toFixed(2)}</span>
                  </div>
                </div>
              )}

              <button
                style={styles.buttonSecondary}
                onClick={() => setMostrarResumen(!mostrarResumen)}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#2ca9e3";
                  e.target.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "#2ca9e3";
                }}
              >
                {mostrarResumen ? "Ocultar resumen" : "Ver resumen"}
              </button>

              {hayProductoSinStock ? (
                <div
                  style={{
                    backgroundColor: "#f8d7da",
                    border: "1px solid #f5c6cb",
                    color: "#721c24",
                    padding: "12px",
                    borderRadius: "4px",
                    fontSize: "0.9rem",
                    marginBottom: "15px",
                    textAlign: "center",
                  }}
                >
                  ⚠️ Hay productos sin stock en la sucursal seleccionada
                </div>
              ) : (
                <button
                  style={{
                    ...styles.button,
                    backgroundColor: loading ? "#6c757d" : "#f0833e",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={(e) =>
                    !loading && (e.target.style.backgroundColor = "#d8572f")
                  }
                  onMouseLeave={(e) =>
                    !loading && (e.target.style.backgroundColor = "#f0833e")
                  }
                  onClick={realizarCompra}
                  disabled={loading || !direccionSeleccionada || !metodoPago}
                >
                  {loading ? "Procesando..." : "Finalizar Compra"}
                </button>
              )}

              <div style={styles.proteccionBox}>
                <div style={styles.proteccionIcon}>🛡️</div>
                <div style={styles.proteccionContent}>
                  <div style={styles.proteccionTitle}>
                    Protección del comprador
                  </div>
                  <div style={styles.proteccionText}>
                    Recibe un reembolso de tu dinero si el artículo no llega o
                    es diferente al de la descripción.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recomendaciones */}
      <div style={styles.recommendationsSection}>
        <div style={styles.content}>
          <div style={styles.recommendationsHeader}>
            <h2 style={styles.recommendationsTitle}>Recomendaciones</h2>
            <div style={styles.headerLineWrapper}>
              <div style={styles.headerLine}></div>
            </div>
          </div>

          <div style={styles.scrollWrapper}>
            <button
              style={styles.arrow}
              onClick={() => {
                if (prodRefRecomendados.current) {
                  prodRefRecomendados.current.scrollBy({
                    left: -140,
                    behavior: "smooth",
                  });
                }
              }}
            >
              <img src={arrowL} alt="left" style={{ width: "100%", height: "100%" }} />
            </button>

            <div style={styles.divProducts} ref={prodRefRecomendados}>
              {prodRec.map((p, i) => (
                <div
                  key={i}
                  style={{
                    ...styles.productBox,
                    border:
                      hoveredProductRec === i
                        ? "2px solid #2b6daf"
                        : "2px solid transparent",
                    transform:
                      hoveredProductRec === i ? "scale(1.05)" : "scale(1)",
                    transition: "all 0.2s ease-in-out",
                    cursor: "pointer",
                  }}
                  onMouseEnter={() => setHoveredProductRec(i)}
                  onMouseLeave={() => setHoveredProductRec(null)}
                  onClick={() => navigate(`/producto/${p.id_producto}`)}
                >
                  <div style={styles.topRow}>
                    {bestPromoPriceForProduct(p) && (
                      <span style={styles.offerChip}>OFERTA</span>
                    )}
                    <div style={styles.stars}>
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <span
                          key={idx}
                          style={{
                            color: idx < getStars(p) ? "#2b6daf" : "#ddd",
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  {p.imagenes && p.imagenes.length > 0 && p.imagenes[0].url_imagen ? (
                    <img
                      src={toPublicFotoSrc(p.imagenes[0].url_imagen)}
                      alt={p.nombre}
                      style={styles.productImg}
                      onError={(e) => {
                        e.target.src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 70 70"><rect width="70" height="70" fill="%23f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" fill="%23999">No img</text></svg>';
                      }}
                    />
                  ) : (
                    <div style={styles.productImg}>No img</div>
                  )}

                  <p style={styles.productName}>{p.nombre}</p>

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
                        <span style={styles.productPrice}>
                          L. {Number(p.precio_base).toFixed(2)}
                        </span>
                      );
                    })()}
                  </div>

                  <button
                    style={{
                      ...styles.addButton,
                      backgroundColor:
                        hoveredProductRec === i ? "#2b6daf" : "#F0833E",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAgregar(p.id_producto);
                    }}
                  >
                    Agregar
                  </button>
                </div>
              ))}
            </div>

            <button
              style={styles.arrow}
              onClick={() => {
                if (prodRefRecomendados.current) {
                  prodRefRecomendados.current.scrollBy({
                    left: 140,
                    behavior: "smooth",
                  });
                }
              }}
            >
              <img src={arrowR} alt="right" style={{ width: "100%", height: "100%" }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function getStars(obj) {
  const n = Math.round(
    Number(obj?.estrellas ?? obj?.rating ?? obj?.valoracion ?? 0)
  );
  return Math.max(0, Math.min(5, isNaN(n) ? 0 : n));
}

const styles = {
  container: {
    position: "absolute",
    top: "145px",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#f8f9fa",
    overflow: "auto",
  },
  content: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "20px",
    minHeight: "100%",
  },
  headerWrapper: { marginBottom: "20px" },
  header: { fontSize: "28px", fontWeight: "650", color: "#f97316", margin: 0 },
  headerLineWrapper: { marginTop: "4px" },
  headerLine: { width: "100%", height: "2px", backgroundColor: "#f97316" },
  mainLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 380px",
    gap: "20px",
    alignItems: "start",
  },
  leftColumn: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: "0",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    border: "1px solid #e9ecef",
  },
  rightColumn: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: "20px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    border: "1px solid #e9ecef",
    height: "fit-content",
    position: "sticky",
    top: "20px",
  },
  section: { padding: "20px", borderBottom: "1px solid #e9ecef" },
  lastSection: { padding: "20px", borderBottom: "none" },
  sectionTitle: {
    fontSize: "1.2rem",
    color: "#2b6daf",
    fontWeight: "600",
    marginBottom: "15px",
    margin: "0 0 15px 0",
  },
  formGroup: { marginBottom: "15px" },
  label: {
    display: "block",
    marginBottom: "6px",
    fontWeight: "500",
    color: "#495057",
    fontSize: "0.9rem",
  },
  select: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ced4da",
    borderRadius: "4px",
    fontSize: "0.9rem",
    backgroundColor: "#ffffff",
    color: "#495057",
    outline: "none",
    transition: "border-color 0.15s ease-in-out",
  },
  radioGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  radioItem: { display: "flex", alignItems: "center", padding: "0", borderBottom: "1px solid #ccc" },
  radioInput: { marginRight: "10px", accentColor: "#2ca9e3", cursor: "pointer" },
  radioLabel: { fontSize: "0.9rem", color: "#495057", cursor: "pointer", textAlign: " left" },
  button: {
    backgroundColor: "#2ca9e3",
    color: "#ffffff",
    padding: "12px 24px",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    width: "100%",
    marginBottom: "10px",
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    color: "#2ca9e3",
    padding: "10px 20px",
    border: "1px solid #2ca9e3",
    borderRadius: "6px",
    fontSize: "0.9rem",
    fontWeight: "500",
    cursor: "pointer",
    width: "100%",
    marginBottom: "10px",
    transition: "all 0.2s ease",
  },
  buttonSmall: {
    backgroundColor: "#2ca9e3",
    color: "#ffffff",
    padding: "10px 16px",
    border: "none",
    borderRadius: "4px",
    fontSize: "0.85rem",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  sidebar: { width: "100%" },
  sidebarTitle: { fontSize: "1rem", color: "#495057", fontWeight: "600", marginBottom: "12px" },
  sucursalInfo: {
    width: "100%",
    padding: "12px",
    border: "1px solid #e9ecef",
    borderRadius: "4px",
    fontSize: "0.9rem",
    backgroundColor: "#f8f9fa",
    color: "#495057",
    marginBottom: "20px",
    fontWeight: "500",
  },
  resumenTitle: {
    fontSize: "1rem",
    color: "#6c757d",
    fontWeight: "400",
    marginBottom: "12px",
    paddingBottom: "8px",
    borderBottom: "1px solid #e9ecef",
  },
  proteccionBox: { display: "flex", alignItems: "flex-start", padding: "12px 0" },
  proteccionIcon: { marginRight: "8px", marginTop: "2px", fontSize: "16px" },
  proteccionContent: { flex: "1" },
  proteccionTitle: { fontSize: "0.9rem", color: "#495057", fontWeight: "600", marginBottom: "4px" },
  proteccionText: { fontSize: "0.8rem", color: "#6c757d", lineHeight: "1.3" },
  promoSuccess: {
    backgroundColor: "#d1ecf1",
    border: "1px solid #bee5eb",
    color: "#0c5460",
    padding: "8px",
    borderRadius: "4px",
    fontSize: "0.85rem",
    marginBottom: "12px",
  },
  productItem: {
    display: "flex",
    alignItems: "center",
    padding: "12px",
    borderBottom: "1px solid #e9ecef",
  },
  productImage: {
    width: "50px",
    height: "50px",
    objectFit: "contain",
    marginRight: "12px",
    borderRadius: "4px",
  },
  productInfo: { flex: "1" },
  productName: { fontWeight: "500", marginBottom: "4px", fontSize: "0.95rem" },
  productQuantity: { color: "#6c757d", fontSize: "0.85rem" },
  productPrice: { fontWeight: "600", color: "#2b6daf", fontSize: "0.95rem" },
  emptyState: { textAlign: "center", padding: "40px 20px", color: "#6c757d" },
  emptyIcon: { fontSize: "3rem", marginBottom: "15px" },
  emptyText: { fontSize: "1.3rem", marginBottom: "10px" },
  emptySubtext: { marginBottom: "20px", color: "#868e96" },

  // Recomendaciones
  recommendationsSection: { backgroundColor: "#f8f9fa", paddingTop: "40px", paddingBottom: "40px" },
  recommendationsHeader: { marginBottom: "20px" },
  recommendationsTitle: { fontSize: "24px", fontWeight: "650", color: "#f97316", margin: 0 },
  scrollWrapper: { display: "flex", alignItems: "center", width: "100%", padding: "0 20px" },
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
    gap: "20px",
    overflowX: "auto",
    scrollBehavior: "smooth",
    width: "100%",
    scrollbarWidth: "none",
    padding: "10px 10px",
  },
  productBox: {
    flexShrink: 0,
    width: "200px",
    height: "230px",
    borderRadius: "25px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#fff",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)",
  },
  topRow: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" },
  stars: { color: "#2b6daf", fontSize: "25px" },
  offerChip: {
    backgroundColor: "#ff1744",
    color: "#fff",
    fontWeight: 800,
    fontSize: 12,
    padding: "2px 8px",
    borderRadius: "999px",
    letterSpacing: 1,
  },
  productImg: {
    width: "70px",
    height: "70px",
    objectFit: "contain",
    marginTop: "8px",
    borderRadius: "4px",
    backgroundColor: "#f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    color: "#999",
  },
  productName: { width: "100%", textAlign: "left", fontSize: "18px", marginTop: "auto" },
  priceRow: { width: "100%", display: "flex", alignItems: "baseline", gap: "10px", justifyContent: "center", marginBottom: "10px" },
  productPrice: { width: "100%", textAlign: "left", fontSize: "17px", color: "#999", marginTop: "auto" },
  newPrice: { fontSize: "16px", fontWeight: 900, color: "#16a34a", lineHeight: 1.1 },
  strikePrice: { fontSize: "14px", color: "#94a3b8", textDecoration: "line-through", lineHeight: 1.1 },
  addButton: {
    marginTop: "auto",
    width: "100%",
    backgroundColor: "#F0833E",
    color: "white",
    border: "none",
    borderRadius: "25px",
    padding: "2px 0",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 600,
    marginBottom: "5px",
    paddingTop: "6px",
  },
};

export default ProcesoCompra;
