import axiosInstance from "../src/api/axiosInstance";
import { useState, useEffect, useContext, useRef, useCallback } from "react";
import React from "react";
import carrito from "./images/carrito_icon.png";
import arrowL from "./images/arrowL.png";
import arrowR from "./images/arrowR.png";
import { useParams, useNavigate } from "react-router-dom";
import {
  SumarItem,
  ViewCar,
  eliminarItem,
  AddNewCarrito,
} from "./api/CarritoApi";
import {
  GetCupones,
  desactivarCupon,
  editarCupon,
  usarCuponHistorial,
  checkCuponUsuario,
} from "./api/CuponesApi";
import { getPromociones } from "./api/PromocionesApi";
import {
  getProductosRecomendados,
  getAllSucursales,
  listarProductosporsucursal,
} from "./api/InventarioApi";
import { crearPedido, getPedidosConDetalles, getTopVendidos, getMasNuevos } from "./api/PedidoApi";
import { getAllMetodoPago } from "./api/metodoPagoApi";
import { UserContext } from "./components/userContext";
import { useCart } from "../src/utils/CartContext";
import { toast } from "react-toastify";
import "./toast.css";

// ====== helpers URL backend ======
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
  fileName
    ? `${BACKEND_ORIGIN}/api/images/productos/${encodeURIComponent(fileName)}`
    : "";
const toPublicFotoSrc = (nameOrPath) => {
  if (!nameOrPath) return "";
  const s = String(nameOrPath);
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/api/images/")) return `${BACKEND_ORIGIN}${encodeURI(s)}`;
  if (s.startsWith("/images/")) return `${BACKEND_ORIGIN}/api${encodeURI(s)}`;
  return backendImageUrl(s);
};

function Carrito() {
  const [topSellerId, setTopSellerId] = useState(null);
  const [newestId, setNewestId] = useState(null);

  const { setCount, incrementCart, decrementCart } = useCart();
  const [detalles, setDetalles] = useState([]);
  const [prodRec, setRec] = useState([]);
  const [stockPorSucursal, setStockPorSucursal] = useState({});
  const { id } = useParams();
  const prodRefRecomendados = useRef(null);
  const [hoveredProductDest, setHoveredProductDest] = useState(null);
  const productosCarrito = useState(0);
  const [discount, setVisible] = useState(false);
  const [cupon, setCupon] = useState("EMPTY");
  const [descCupon, setDesc] = useState(0);
  const [showProducts, setShowProd] = useState(true);

  // Subtotal "base" (sin impuestos/envío) — lo recalculamos nosotros con escalonados
  const [subtotalCart, setSubtotalCart] = useState(0);

  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [qtyDraft, setQtyDraft] = useState({});
  const [sucursales, setSucursales] = useState([]);
  const [idSucursal, setIdSucursal] = useState(null);
  const [promociones, setPromociones] = useState([]);
  const [promocionAplicada, setPromocionAplicada] = useState(null); // solo % o fijo (no escalonado)

  // Promos por producto
  const [promosPorProducto, setPromosPorProducto] = useState({}); // { id_producto: [id_promocion, ...] }
  const [promosInfo, setPromosInfo] = useState({}); // { id_promocion: {...} }

  // ====== UTIL UI ======
  const getStars = (obj) => {
    const n = Math.round(Number(obj?.estrellas ?? obj?.rating ?? obj?.valoracion ?? 0));
    return Math.max(0, Math.min(5, isNaN(n) ? 0 : n));
  };

  // ====== STOCK ======
  const getStockEnSucursal = (idProducto) => {
    if (!idSucursal || !stockPorSucursal[idSucursal]) return 0;
    const producto = stockPorSucursal[idSucursal].find((p) => p.id_producto === idProducto);
    return producto ? producto.stock_en_sucursal : 0;
  };
  const cargarStockPorSucursal = async (idSucursalParam) => {
    if (!idSucursalParam) return;
    try {
      const response = await listarProductosporsucursal(idSucursalParam);
      const productos = response.data || [];
      setStockPorSucursal((prev) => ({ ...prev, [idSucursalParam]: productos }));
    } catch (error) {
      console.error(`Error cargando stock para sucursal ${idSucursalParam}:`, error);
    }
  };
  const hayProductoSinStock = (detalles ?? []).some(
    (p) => getStockEnSucursal(p.producto.id_producto) === 0
  );

  // ====== PROMOS (fechas) ======
  const isDateInRange = (startStr, endStr) => {
    const today = new Date();
    const start = startStr ? new Date(startStr) : null;
    const end = endStr ? new Date(endStr) : null;
    if (start && today < start) return false;
    if (end && today > end) return false;
    return true;
  };

  // ====== MAPA PROMOS (productos -> promos) ======
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
  useEffect(() => {
    const fetchPromosInfo = async () => {
      try {
        const res = await axiosInstance.get("/api/promociones/listarorden");
        const arr = Array.isArray(res?.data) ? res.data : [];
        const map = {};
        for (const p of arr) {
          map[Number(p.id_promocion)] = {
            id_promocion: Number(p.id_promocion),
            id_tipo_promo: Number(p.id_tipo_promo), // 1=% 2=fijo 3=escalonado
            valor_porcentaje: p.valor_porcentaje != null ? parseFloat(p.valor_porcentaje) : null,
            valor_fijo: p.valor_fijo != null ? Number(p.valor_fijo) : null,
            compra_min: p.compra_min != null ? Number(p.compra_min) : null, // en escalonado = cantidad por pack
            fecha_inicio: p.fecha_inicio || null,
            fecha_termina: p.fecha_termina || null,
            activa: p.activa === true || p.activa === 1 || p.activa === "true",
            nombre_promocion: p.nombre_promocion || p.nombre || "Promoción",
          };
        }
        setPromosInfo(map);
      } catch (err) {
        console.error("[PROMOS LISTARORDEN] error:", err?.response?.data || err);
      }
    };
    fetchPromosInfo();
  }, []);

  // set de promos que tienen al menos 1 producto asociado
  const promoIdsConProductos = React.useMemo(() => {
    const s = new Set();
    for (const arr of Object.values(promosPorProducto)) {
      if (Array.isArray(arr)) {
        for (const pidPromo of arr) s.add(Number(pidPromo));
      }
    }
    return s;
  }, [promosPorProducto]);

  const carritoTieneProductoDePromo = (promoId) => {
    const pidPromo = Number(promoId);
    for (const item of detalles || []) {
      const pid = Number(item?.producto?.id_producto);
      const promosDeEsteProducto = promosPorProducto[pid];
      if (Array.isArray(promosDeEsteProducto) && promosDeEsteProducto.some((x) => Number(x) === pidPromo)) {
        return true;
      }
    }
    return false;
  };

  // ====== PRECIO CON %/FIJO POR PRODUCTO (no escalonado) ======
  const computeDiscountedPriceByPromo = (basePrice, pInfo, cartSubtotal) => {
    if (!pInfo?.activa || !isDateInRange(pInfo.fecha_inicio, pInfo.fecha_termina)) return null;
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

  // ====== ESCALONADO POR PRODUCTO ======
  // Devuelve el mejor escalonado para un producto dado su qty y precio base.
  // Aplica SOLO si qty >= compra_min al menos 1 pack.
  const bestEscalonadoForItem = (prod, qty) => {
    const unit = Number(prod?.precio_base) || 0;
    const pid = Number(prod?.id_producto);
    const ids = promosPorProducto[pid] || [];
    let best = null; // {subtotal, packs, packQty, packPrice, promoId}

    ids.forEach((idPromo) => {
      const info = promosInfo[idPromo];
      if (
        info &&
        info.id_tipo_promo === 3 &&
        info.activa &&
        isDateInRange(info.fecha_inicio, info.fecha_termina) &&
        Number(info.compra_min) > 0 &&
        Number(info.valor_fijo) > 0
      ) {
        const k = Number(info.compra_min);
        if (qty < k) return; // ⚠️ NO aplica si no alcanza el primer tramo
        const packPrice = Number(info.valor_fijo);
        const packs = Math.floor(qty / k);
        const resto = qty - packs * k;
        const subPromo = packs * packPrice + resto * unit; // 3x pack + resto normal
        if (!best || subPromo < best.subtotal) {
          best = { subtotal: subPromo, packs, packQty: k, packPrice, promoId: idPromo };
        }
      }
    });

    if (!best) {
      // No alcanzó ningún escalón
      return { applied: false, subtotal: qty * unit, ahorro: 0, packs: 0, packQty: 0, packPrice: 0, promoId: null };
    }
    const base = qty * unit;
    const ahorro = Math.max(0, base - best.subtotal);
    return { applied: true, subtotal: best.subtotal, ahorro, packs: best.packs, packQty: best.packQty, packPrice: best.packPrice, promoId: best.promoId };
  };

  // ====== PRECIO CON %/FIJO (no escalonado) POR PRODUCTO ======
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

  // ====== PROMO GLOBAL (SOLO % o FIJO). NO incluye escalonado ======
  const obtenerPromocionesValidas = (arr) =>
    (arr || []).filter((promo) => promo.activa && isDateInRange(promo.fecha_inicio, promo.fecha_termina));

  const encontrarMejorPromocion = (subtotal, promocionesDisponibles) => {
    const promocionesValidas = obtenerPromocionesValidas(promocionesDisponibles).filter(
      (p) => Number(p.id_tipo_promo) !== 3 // ⚠️ escalonado es por producto
    );

    const promocionesAplicables = promocionesValidas.filter((promo) => {
      const compraMin = Number(promo.compra_min) || 0;
      if (compraMin > 0 && subtotal < compraMin) return false;
      const idPromo = Number(promo.id_promocion);
      const esPromoDeLista = promoIdsConProductos.has(idPromo);
      if (esPromoDeLista && !carritoTieneProductoDePromo(idPromo)) return false;
      return true;
    });

    if (promocionesAplicables.length === 0) return null;

    let mejorPromocion = null;
    let mayorDescuento = 0;

    for (const promo of promocionesAplicables) {
      const tipo = Number(promo.id_tipo_promo);
      const pct = parseFloat(promo.valor_porcentaje) || 0;
      const fijo = parseFloat(promo.valor_fijo) || 0;

      let descuento = 0;
      if (tipo === 1 && pct > 0) descuento = subtotal * (pct / 100);
      else if (tipo === 2 && fijo > 0) descuento = Math.min(fijo, subtotal);

      if (descuento > mayorDescuento) {
        mayorDescuento = descuento;
        mejorPromocion = promo;
      }
    }
    return mejorPromocion;
  };

  // ====== CUPÓN ======
  const parseCouponDateLocal = (input) => {
    if (!input) return null;
    const s = String(input).trim();
    const ymd = s.split("T")[0];
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(ymd);
    if (!m) {
      const d = new Date(s);
      return isNaN(d) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    }
    const y = Number(m[1]), mo = Number(m[2]) - 1, d = Number(m[3]);
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
  const checkCupon = async (e) => {
    e.preventDefault();
    try {
      const res = await GetCupones();
      const all = res?.data ?? [];
      const normActivo = (v) => v === true || v === 1 || v === "true";
      const c = all.find((x) => x.codigo?.toLowerCase() === cupon.toLowerCase() && normActivo(x.activo));
      if (!c) {
        setVisible(false);
        setDesc(0);
        toast.error("Cupón inválido o inactivo", { className: "toast-error" });
        return;
      }
      if (isCouponExpired(c.termina_en || c.fecha_expiracion)) {
        setVisible(false);
        setDesc(0);
        toast.error("El cupón ya expiró", { className: "toast-error" });
        return;
      }

      const r = await checkCuponUsuario(c.id_cupon, user.id_usuario);
      if (r?.data?.usado) {
        setVisible(false);
        setDesc(0);
        toast.info("Ya has usado este cupón anteriormente", { className: "toast-info" });
        return;
      }

      const usosMax = Number(c.uso_maximo_por_usuario ?? c.uso_por_usuario ?? 1);
      if (usosMax <= 0) {
        setVisible(false);
        setDesc(0);
        toast.info("El cupón ya no tiene usos disponibles.", { className: "toast-info" });
        return;
      }

      setVisible(true);
      setDesc(c);
      const payload = {
        id_cupon: c.id_cupon,
        codigo: c.codigo,
        tipo: c.tipo,
        valor: Number(c.valor) || 0,
        termina_en: c.termina_en || c.fecha_expiracion || null,
      };
      localStorage.setItem("checkout.coupon", JSON.stringify(payload));
      toast.success(
        `Cupón agregado: ${c.codigo} (${c.tipo === "porcentaje" ? `${payload.valor}%` : `L. ${payload.valor.toFixed(2)}`})`,
        { className: "toast-success" }
      );
    } catch (err) {
      console.error("Error verificando cupón:", err);
      setVisible(false);
      setDesc(0);
      toast.error("Error al verificar el cupón", { className: "toast-error" });
    }
  };

  // ====== CÁLCULOS DE CARRITO (escalonado + global + cupón + impuesto) ======
  const buildCartBreakdown = () => {
    const items = [];
    let subtotalEscalonados = 0;
    let ahorroEscalonados = 0;
    let anyEscalonado = false;

    (detalles || []).forEach((it) => {
      const qty = Number(it.cantidad_unidad_medida) || 0;
      const unit = Number(it?.producto?.precio_base) || 0;
      const base = qty * unit;

      // Escalonado por producto
      const esc = bestEscalonadoForItem(it.producto, qty); // respeta compra_min
      const itemSubtotal = esc.subtotal;
      const itemAhorro = esc.ahorro;
      subtotalEscalonados += itemSubtotal;
      ahorroEscalonados += itemAhorro;
      anyEscalonado = anyEscalonado || esc.applied;

      items.push({
        id_producto: Number(it?.producto?.id_producto),
        nombre: it?.producto?.nombre,
        qty,
        unit,
        base,
        escalonado: {
          applied: esc.applied,
          packs: esc.packs,
          packQty: esc.packQty,
          packPrice: esc.packPrice,
          promoId: esc.promoId,
          ahorro: itemAhorro,
          subtotal: itemSubtotal,
        },
      });
    });

    // Promo global (% o fijo) sobre subtotal con escalonados
    const promoGlobal = encontrarMejorPromocion(subtotalEscalonados, promociones);
    let descPromoGlobal = 0;
    if (promoGlobal) {
      const tipo = Number(promoGlobal.id_tipo_promo);
      if (tipo === 1 && Number(promoGlobal.valor_porcentaje) > 0) {
        descPromoGlobal = subtotalEscalonados * (Number(promoGlobal.valor_porcentaje) / 100);
      } else if (tipo === 2 && Number(promoGlobal.valor_fijo) > 0) {
        descPromoGlobal = Math.min(Number(promoGlobal.valor_fijo), subtotalEscalonados);
      }
    }

    // Cupón sobre (subtotal escalonados - promo global)
    const baseCupon = Math.max(0, subtotalEscalonados - descPromoGlobal);
    let descCuponMonto = 0;
    if (discount && descCupon) {
      const v = Number(descCupon.valor) || 0;
      if (descCupon.tipo === "porcentaje") descCuponMonto = baseCupon * (v / 100);
      else if (descCupon.tipo === "fijo") descCuponMonto = Math.min(v, baseCupon);
    }

    const subtotalNeto = Math.max(0, subtotalEscalonados - descPromoGlobal - descCuponMonto);
    const impuesto = subtotalNeto * 0.15;
    const envio = 10;
    const totalFinal = subtotalNeto + impuesto + envio;

    return {
      items,
      anyEscalonado,
      ahorroEscalonados,
      subtotalEscalonados,
      promoGlobal,
      descPromoGlobal,
      descCuponMonto,
      subtotalNeto,
      impuesto,
      envio,
      totalFinal,
    };
  };

  // Recalcular y persistir breakdown en localStorage para procesoCompra
  useEffect(() => {
    const b = buildCartBreakdown();
    setSubtotalCart(b.subtotalEscalonados); // para mostrar Subtotal en UI

    localStorage.setItem(
      "checkout.itemBreakdown",
      JSON.stringify(b.items)
    );
    localStorage.setItem(
      "checkout.promotions",
      JSON.stringify({
        anyEscalonado: b.anyEscalonado,
        ahorroEscalonados: b.ahorroEscalonados,
        promoGlobal: b.promoGlobal
          ? {
              id_promocion: b.promoGlobal.id_promocion,
              nombre: b.promoGlobal.nombre_promocion || "Promoción",
              tipo: b.promoGlobal.id_tipo_promo,
              valor_porcentaje: b.promoGlobal.valor_porcentaje,
              valor_fijo: b.promoGlobal.valor_fijo,
            }
          : null,
        cupon: discount
          ? {
              id_cupon: descCupon?.id_cupon ?? null,
              codigo: descCupon?.codigo ?? null,
              tipo: descCupon?.tipo ?? null,
              valor: Number(descCupon?.valor) || 0,
            }
          : null,
      })
    );
    localStorage.setItem(
      "checkout.totals",
      JSON.stringify({
        subtotal_escalonados: b.subtotalEscalonados,
        descuento_promo_global: b.descPromoGlobal,
        descuento_cupon: b.descCuponMonto,
        subtotal_neto: b.subtotalNeto,
        impuesto: b.impuesto,
        envio: b.envio,
        total: b.totalFinal,
      })
    );
  }, [detalles, promociones, promosPorProducto, promosInfo, discount, descCupon]);

  // ====== NAV / API / ESTADO ======
  const SumarBackend = async (id, n) => { await SumarItem(id, n); };

  const updateQuantity = async (idDetalle, id, n) => {
    if (n < 1) return;
    const stockDisponible = getStockEnSucursal(id);
    if (n > stockDisponible) {
      toast.info(`Solo hay ${stockDisponible} unidades disponibles en esta sucursal`, { className: "toast-info" });
      return;
    }
    try {
      await SumarBackend(id, n);
      setDetalles((prev) =>
        prev.map((p) =>
          p.id_carrito_detalle === idDetalle
            ? { ...p, cantidad_unidad_medida: n, subtotal_detalle: p.producto.precio_base * n }
            : p
        )
      );
    } catch (err) {
      console.error("Error updating quantity:", err);
      toast.error("No se pudo actualizar la cantidad", { className: "toast-error" });
    }
  };

  const handleQtyInputChange = (idDetalle, raw) => {
    const clean = raw.replace(/[^\d]/g, "");
    setQtyDraft((prev) => ({ ...prev, [idDetalle]: clean }));
  };
  const commitQtyChange = async (p, raw) => {
    let n = parseInt(raw, 10);
    if (isNaN(n) || n < 1) n = 1;
    const stockDisponible = getStockEnSucursal(p.producto.id_producto);
    if (n > stockDisponible) {
      toast.error(`Solo hay ${stockDisponible} unidades disponibles en esta sucursal`, { className: "toast-error" });
      setQtyDraft((prev) => { const { [p.id_carrito_detalle]: _, ...rest } = prev; return rest; });
      return;
    }
    try { await updateQuantity(p.id_carrito_detalle, p.producto.id_producto, n); }
    catch (err) { console.error("Error confirmando cantidad:", err); toast.error("No se pudo actualizar la cantidad", { className: "toast-error" }); }
    finally {
      setQtyDraft((prev) => { const { [p.id_carrito_detalle]: _, ...rest } = prev; return rest; });
    }
  };

  const eliminarEnBackend = async (idToDelete) => { await eliminarItem({ id_producto: idToDelete }); };
  const eliminarProducto = async (idToDelete, idProd) => {
    try {
      await eliminarEnBackend(idProd);
      setDetalles((prev) => prev.filter((p) => p.id_carrito_detalle !== idToDelete));
      decrementCart(1);
    } catch (err) { console.error("Error eliminando item:", err); }
  };

  const handleAgregar = async (id_producto) => {
    if (!id_producto) {
      toast.error("ID de producto no válido", { className: "toast-error" });
      return;
    }
    const stockDisponible = getStockEnSucursal(id_producto);
    try {
      const carritoActual = await ViewCar();
      const carritoDetalles = carritoActual.data.carrito_detalles ?? [];
      const productoExistente = carritoDetalles.find((item) => item.producto.id_producto === id_producto);

      if (productoExistente) {
        const cantidadActual = productoExistente.cantidad_unidad_medida || 0;
        const nuevaCantidad = cantidadActual + 1;
        if (nuevaCantidad > stockDisponible) {
          toast.info(`Solo hay ${stockDisponible} unidades disponibles en esta sucursal`, { className: "toast-info" });
          return;
        }
        await SumarItem(id_producto, nuevaCantidad);
        setDetalles((prev) =>
          Array.isArray(prev)
            ? prev.map((item) =>
                item.producto.id_producto === id_producto
                  ? { ...item, cantidad_unidad_medida: nuevaCantidad, subtotal_detalle: item.producto.precio_base * nuevaCantidad }
                  : item
              )
            : prev
        );
        toast(`Actualizando a ${nuevaCantidad}`, { className: "toast-default" });
      } else {
        await AddNewCarrito(id_producto, 1);
        incrementCart(1);
        const carritoActualizado = await ViewCar();
        const nuevosDetalles = carritoActualizado.data.carrito_detalles ?? [];
        setDetalles(nuevosDetalles);
        toast("Producto agregado al carrito", { className: "toast-default" });
      }
    } catch (error) {
      console.error("Error:", error);
      if (error?.response?.status === 404) {
        try {
          await AddNewCarrito(id_producto, 1);
          const carritoNuevo = await ViewCar();
          const nuevosDetalles = carritoNuevo.data.carrito_detalles ?? [];
          setDetalles(nuevosDetalles);
          toast("Producto agregado al carrito", { className: "toast-default" });
        } catch (err) {
          console.error("Error creando carrito:", err);
          toast.error("No se pudo agregar el producto al carrito", { className: "toast-error" });
        }
      } else {
        const errorMessage = error?.response?.data?.msg || error?.response?.data?.message || error?.message || "No se pudo procesar el carrito";
        toast.error(errorMessage, { className: "toast-error" });
      }
    }
  };

  // ====== CARGA INICIAL ======
  useEffect(() => {
    const productos = async () => {
      try {
        const res = await ViewCar();
        const rec = await getProductosRecomendados();
        const carritoDetalles = res.data.carrito_detalles ?? [];
        setDetalles(carritoDetalles);
        setRec(rec.data);
        setShowProd(carritoDetalles.length > 0);
      } catch (err) {
        console.error("[REGISTER] error:", err?.response?.data || err);
        toast.error(err?.response?.data?.message || "Error", { className: "toast-error" });
      }
    };
    productos();
  }, []);

  useEffect(() => {
    const cargarPromos = async () => {
      try {
        const res = await getPromociones();
        setPromociones(res.data || []);
      } catch (e) { console.error("Error cargando promociones:", e); }
    };
    cargarPromos();
  }, []);

  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const res = await getAllSucursales();
        const arr = res?.data ?? [];
        setSucursales(arr);
        if (arr.length && !idSucursal) {
          const primera = arr[0].id_sucursal ?? arr[0].id;
          setIdSucursal(primera);
          cargarStockPorSucursal(primera);
        }
      } catch (err) { console.error("Error cargando sucursales:", err); }
    };
    fetchSucursales();
  }, []);
  useEffect(() => { if (idSucursal) cargarStockPorSucursal(idSucursal); }, [idSucursal]);
  useEffect(() => { if (idSucursal) localStorage.setItem("sucursalSeleccionada", idSucursal); }, [idSucursal]);

  // ====== TOP SELLER / MÁS NUEVOS (igual que antes) ======
  const refreshTopSeller = useCallback(async () => {
    try {
      const rep = await getTopVendidos({ days: 30, limit: 50, estado: "Enviado" });
      const rows = Array.isArray(rep?.data?.topProductos) ? rep.data.topProductos : (Array.isArray(rep?.data) ? rep.data : []);
      const best = rows.reduce((a, b) => ((Number(b?.total_cantidad ?? b?.cantidad ?? b?.total ?? 0) || 0) > (Number(a?.total_cantidad ?? a?.cantidad ?? a?.total ?? 0) || 0) ? b : a), rows[0]);
      const idTop = Number(best?.id_producto ?? best?.producto_id ?? best?.id);
      setTopSellerId(Number.isFinite(idTop) ? idTop : null);
    } catch {
      try {
        const res = await getPedidosConDetalles();
        const pedidos = Array.isArray(res?.data) ? res.data : [];
        const counts = new Map();
        for (const ped of pedidos) {
          const detalles =
            ped?.factura?.factura_detalles ||
            ped?.detalles || ped?.pedidos_detalle || ped?.items || ped?.carrito_detalles || [];
          for (const d of detalles) {
            const pid = Number(d?.id_producto ?? d?.producto_id ?? d?.producto?.id_producto ?? d?.producto?.id);
            if (!Number.isFinite(pid)) continue;
            const qty = Number(d?.cantidad_unidad_medida ?? d?.cantidad ?? d?.cantidad_pedida ?? d?.qty ?? d?.quantity) || 1;
            counts.set(pid, (counts.get(pid) || 0) + qty);
          }
        }
        let bestId = null, bestQty = -Infinity;
        for (const [pid, qty] of counts) { if (qty > bestQty) { bestQty = qty; bestId = pid; } }
        setTopSellerId(bestId ?? null);
      } catch (e2) {
        console.error("[TOP-SELLER fallback] error:", e2);
        setTopSellerId(null);
      }
    }
  }, []);
  useEffect(() => { refreshTopSeller(); }, [refreshTopSeller]);
  useEffect(() => {
    (async () => {
      try {
        const r = await getMasNuevos({ days: 30, limit: 1 });
        const list = Array.isArray(r?.data?.nuevos) ? r.data.nuevos : [];
        const first = list[0];
        const id = Number(first?.id_producto ?? first?.id);
        setNewestId(Number.isFinite(id) ? id : null);
      } catch (e) { setNewestId(null); }
    })();
  }, []);

  // ====== SUBTOTAL/IMPUESTO/TOTAL PARA EL PANEL ======
  const obtenerImpuesto = () => {
    const totals = JSON.parse(localStorage.getItem("checkout.totals") || "{}");
    return Number(totals?.impuesto || 0).toFixed(2);
  };
  const obtenerTotal = () => {
    const totals = JSON.parse(localStorage.getItem("checkout.totals") || "{}");
    return Number(totals?.total || 0).toFixed(2);
  };

  // ====== PEDIDO ======
  const realizarCompra = async () => {
    if (!user.direccions || user.direccions.length === 0) {
      toast.info("Debes registrar al menos una dirección antes de realizar la compra", { className: "toast-info" });
      return;
    }
    for (const item of detalles) {
      const stockDisponible = getStockEnSucursal(item.producto.id_producto);
      if (item.cantidad_unidad_medida > stockDisponible) {
        toast.error(`No hay suficiente stock de ${item.producto.nombre}. Disponible: ${stockDisponible}, Solicitado: ${item.cantidad_unidad_medida}`, { className: "toast-error" });
        return;
      }
    }

    try {
      const totals = JSON.parse(localStorage.getItem("checkout.totals") || "{}");
      const desc = Number(totals?.descuento_promo_global || 0) + Number(totals?.descuento_cupon || 0) + Number(totals?.subtotal_escalonados || 0) - Number(totals?.subtotal_neto || 0); // descuento total aplicado (incluye escalonados como reducción)
      const id_direccion = user.direccions[0].id_direccion.toString();
      const sucursalId = Number(idSucursal ?? sucursales[0]?.id_sucursal ?? 2);

      const metodosPagoResponse = await getAllMetodoPago();
      const metodosPago = metodosPagoResponse.data || [];
      const metodoPagoDefault = metodosPago.find((mp) => mp.metodo_predeterminado === true);
      if (!metodoPagoDefault) {
        toast.error("No tienes un método de pago predeterminado configurado", { className: "toast-error" });
        return;
      }

      const response = await crearPedido(
        user.id_usuario,
        id_direccion,
        sucursalId,
        promocionAplicada ? promocionAplicada.id_promocion : null,
        desc
      );
      const id_pedido = response.data.id_pedido;

      if (descCupon?.id_cupon) {
        await usarCuponHistorial(descCupon.id_cupon, user.id_usuario, id_pedido, new Date().toISOString());
        const usosRestantes = descCupon.uso_maximo_por_usuario - 1;
        if (usosRestantes > 0) {
          await editarCupon(descCupon.id_cupon, descCupon.codigo, descCupon.descripcion, descCupon.tipo, descCupon.valor, usosRestantes, descCupon.termina_en, true);
        } else {
          await desactivarCupon(descCupon.id_cupon);
        }
      }

      setPromocionAplicada(null);
      setCount(0);
      setShowProd(false);
      setVisible(false);
      toast(`¡Pedido #${id_pedido} creado correctamente!`, { className: "toast-default" });
    } catch (err) {
      console.error("Error creando pedido:", err);
      const errorMessage = err?.response?.data?.error || "No se pudo crear el pedido";
      toast.error(errorMessage, { className: "toast-error" });
    }
  };

  // ====== UI Helpers ======
  const scroll = (direction, ref, itemWidth) => {
    if (ref.current) {
      ref.current.scrollBy({ left: direction === "left" ? -itemWidth : itemWidth, behavior: "smooth" });
    }
  };

  // ====== RENDER ======
  return (
    <div className="bg-gray-100 w-screen min-h-screen py-4 overflow-x-hidden items-center" style={{ ...styles.fixedShell, backgroundColor: "#f3f4f6" }}>
      <div className="px-32">
        <div>
          <h1 className="font-roboto text-[#f0833e] text-5xl justify-center pb-3 text-left">Carrito</h1>
          <hr className="bg-[#f0833e] h-[2px] mb-4" />
        </div>

        <div className="grid grid-cols-3 gap-8 h-[350px]">
          {/* LISTA */}
          <div className="col-span-2 w-full rounded-md border-gray-200 border-2 overflow-y-auto">
            {!showProducts && (
              <div className="flex flex-row justify-center items-center gap-8">
                <img src={carrito} className="object-cover mt-16" />
                <div className="mx-4 flex flex-col gap-y-6 font-medium">
                  <p className="text-[24px] mt-8">Tu carrito esta vacio</p>
                  <button onClick={() => navigate("/")} className="bg-[#2B6DAF] text-[28px] text-white rounded-[10px] p-3 px-6">
                    Explora articulos
                  </button>
                </div>
              </div>
            )}

            {showProducts && (
              <div className="px-6 py-4">
                <ul className="flex flex-col space-y-4">
                  {detalles.map((p, i) => {
                    const stockDisponible = getStockEnSucursal(p.producto.id_producto);
                    const sinStock = stockDisponible === 0;

                    // Totales por item (mostrar si escalonado aplica)
                    const qty = Number(p.cantidad_unidad_medida) || 0;
                    const unitBase = Number(p.producto.precio_base) || 0;
                    const base = qty * unitBase;
                    const esc = bestEscalonadoForItem(p.producto, qty);

                    // Si NO hay escalonado, miro %/fijo por producto (visual)
                    let subMostrar = esc.subtotal;
                    let etiquetaExtra = esc.applied
                      ? `Escalonado: ${esc.packQty} por L. ${esc.packPrice.toFixed(2)}`
                      : "";
                    if (!esc.applied) {
                      const best = bestPromoPriceForProduct(p.producto);
                      if (best) {
                        subMostrar = (best.finalPrice || 0) * qty;
                        etiquetaExtra = "OFERTA";
                      } else {
                        subMostrar = base;
                      }
                    }

                    return (
                      <li key={i}>
                        <div className="flex flex-row gap-8">
                          {p.producto.imagenes?.length > 0 && p.producto.imagenes[0]?.url_imagen ? (
                            <img
                              src={toPublicFotoSrc(p.producto.imagenes[0].url_imagen)}
                              alt={p.producto.nombre}
                              style={styles.productImg}
                              onClick={() => navigate(`/producto/${p.producto.id_producto}`)}
                              className="cursor-pointer"
                              onError={(e) => {
                                e.currentTarget.src =
                                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%23999">Imagen no disponible</text></svg>';
                              }}
                            />
                          ) : (
                            <div
                              style={styles.productImg}
                              onClick={() => navigate(`/producto/${p.producto.id_producto}`)}
                              className="cursor-pointer flex items-center justify-center text-xs text-gray-500"
                            >
                              Imagen no disponible
                            </div>
                          )}

                          <div className="flex flex-col w-full text-left font-medium flex-1">
                            <p className="py-2 text-xl cursor-pointer" onClick={() => navigate(`/producto/${p.producto.id_producto}`)}>
                              {p.producto.nombre}
                              {!!etiquetaExtra && <span style={{ ...styles.offerChip, marginLeft: 8 }}>{etiquetaExtra}</span>}
                              {Number(p.producto.id_producto) === Number(topSellerId) && (
                                <span style={{ ...styles.offerChip, marginLeft: 8 }}>MÁS COMPRADO</span>
                              )}
                              {Number(p.producto.id_producto) === Number(newestId) && (
                                <span style={{ ...styles.offerChip, marginLeft: 6 }}>MÁS NUEVO</span>
                              )}
                            </p>

                            <div className="flex -mt-1 mb-1">
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <span key={idx} className="text-xl" style={{ color: idx < getStars(p.producto) ? "#2b6daf" : "#ddd" }}>
                                  ★
                                </span>
                              ))}
                            </div>

                            <div className="mb-2">
                              {sinStock ? (
                                <span className="text-red-600 font-semibold text-sm">Sin stock en esta sucursal</span>
                              ) : (
                                <span className="text-green-600 text-sm">{stockDisponible} disponibles</span>
                              )}
                            </div>

                            <div className="flex flex-row gap-1">
                              <button
                                onClick={() => updateQuantity(p.id_carrito_detalle, p.producto.id_producto, p.cantidad_unidad_medida - 1)}
                                className=" bg-[#114C87] text-white rounded-md h-9 px-1"
                                disabled={sinStock}
                              >
                                <span className="material-symbols-outlined text-5xl">check_indeterminate_small</span>
                              </button>

                              <input
                                type="number"
                                min={1}
                                max={stockDisponible}
                                step={1}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className={`border-2 rounded-md text-center ${sinStock ? "border-red-400 bg-red-50" : "border-black"}`}
                                value={qtyDraft[p.id_carrito_detalle] ?? p.cantidad_unidad_medida}
                                onChange={(e) => handleQtyInputChange(p.id_carrito_detalle, e.target.value)}
                                onBlur={(e) => commitQtyChange(p, e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                                onFocus={(e) => e.target.select()}
                                disabled={sinStock}
                              />

                              <button
                                onClick={() => updateQuantity(p.id_carrito_detalle, p.producto.id_producto, p.cantidad_unidad_medida + 1)}
                                className="bg-[#114C87] text-white rounded-md h-9 px-1"
                                disabled={sinStock}
                              >
                                <span className="material-symbols-outlined text-3xl">add</span>
                              </button>

                              <div className="flex w-full h-full justify-end items-center">
                                <div className="text-right">
                                  <div className="text-2xl font-extrabold text-green-600">L. {subMostrar.toFixed(2)}</div>
                                  {esc.applied && (
                                    <div className="text-xs text-green-700 font-semibold">
                                      Escalonado: {esc.packQty} por L. {esc.packPrice.toFixed(2)}
                                    </div>
                                  )}
                                  {base > subMostrar && (
                                    <div className="text-sm text-slate-400 line-through">L. {base.toFixed(2)}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => eliminarProducto(p.id_carrito_detalle, p.producto.id_producto)}
                            className=" text-black hover:bg-red-500 hover:text-white rounded-md p-8"
                          >
                            <span className="material-symbols-outlined text-5xl ">delete</span>
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* PANEL DERECHO */}
          <div className="flex flex-col col-span-1 w-full rounded-md border-gray-200 border-2 px-6 py-1 pb-2">
            {showProducts && (
              <div className="pb-2">
                <p className="text-left pb-2 font-medium">¿Tienes un cupón?</p>

                <form className="flex gap-2 mb-2" onSubmit={checkCupon}>
                  <input
                    type="text"
                    placeholder="Código de cupón"
                    value={cupon === "EMPTY" ? "" : cupon}
                    onChange={(e) => setCupon(e.target.value)}
                    className="input-field rounded-xl bg-gray-100 border-black border-2 pl-2 text-sm"
                  />
                  <button type="submit" className="bg-[#114C87] rounded-md py-1 text-white px-6 text-sm">
                    Aplicar Cupón
                  </button>
                </form>

                {/* Caja de promo escalonada (agregada si hay al menos una aplicada) */}
                {(() => {
                  const prom = JSON.parse(localStorage.getItem("checkout.promotions") || "{}");
                  if (!prom?.anyEscalonado) return null;
                  return (
                    <div className="mt-2 p-3 bg-green-50 border border-green-300 rounded-md text-left">
                      <p className="text-sm font-semibold text-green-800">Precio Escalonado activo</p>
                      <p className="text-xs text-green-700">Ahorro total: <strong>L. {(Number(prom?.ahorroEscalonados) || 0).toFixed(2)}</strong></p>
                    </div>
                  );
                })()}

                {/* Promo global (solo % o fijo) */}
                {promocionAplicada && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-300 rounded-md text-left">
                    <p className="text-sm font-semibold text-green-800">
                      Promoción aplicada: {promocionAplicada.nombre_promocion}
                    </p>
                    {Number(promocionAplicada.id_tipo_promo) === 1 && (
                      <p className="text-xs text-green-700">
                        Descuento: {(Number(promocionAplicada.valor_porcentaje) || 0).toFixed(2)}%
                      </p>
                    )}
                    {Number(promocionAplicada.id_tipo_promo) === 2 && (
                      <p className="text-xs text-green-700">
                        Descuento: L. {(Number(promocionAplicada.valor_fijo) || 0).toFixed(2)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Sucursal */}
            <div className="pb-2">
              <label htmlFor="select-sucursal" className="block text-left font-bold pb-2">Sucursal</label>
              <select
                id="select-sucursal"
                value={idSucursal ?? ""}
                onChange={(e) => setIdSucursal(e.target.value)}
                className="w-full border border-gray-300 bg-white rounded-md px-2 py-1 text-sm"
              >
                {(sucursales ?? []).map((s) => (
                  <option key={s.id_sucursal ?? s.id} value={s.id_sucursal ?? s.id}>
                    {s.nombre_sucursal ?? s.nombre ?? `Sucursal ${s.id_sucursal ?? s.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* RESUMEN */}
            <div>
              <h1 className="font-roboto text-[#80838A] text-2xl font-medium justify-center pb-1 text-left">Resumen de pago</h1>
              <hr className="bg-[#80838A] h-[2px] w-full mb-1" />
            </div>

            {hayProductoSinStock ? (
              <div className="mt-2 p-4 bg-red-50 border border-red-400 rounded-md text-red-800 font-medium max-w-xs">
                ⚠️ Tienes uno o más productos sin stock en la sucursal seleccionada. No puedes realizar la compra hasta ajustar la cantidad o cambiar de sucursal.
              </div>
            ) : (
              showProducts && (
                <div>
                  <ul className="text-left space-y-3 font-medium text-md">
                    <li className="flex justify-between">
                      <span>Subtotal</span>
                      <span>L. {Number(subtotalCart || 0).toFixed(2)}</span>
                    </li>

                    {/* Cupón (negativo) */}
                    {(() => {
                      const totals = JSON.parse(localStorage.getItem("checkout.totals") || "{}");
                      const monto = Number(totals?.descuento_cupon || 0);
                      if (!monto) return null;
                      return (
                        <li className="flex justify-between text-blue-600">
                          <span>Descuento cupón</span>
                          <span>-L. {monto.toFixed(2)}</span>
                        </li>
                      );
                    })()}

                    {/* Promo global %/fijo (negativo) */}
                    {(() => {
                      const totals = JSON.parse(localStorage.getItem("checkout.totals") || "{}");
                      const monto = Number(totals?.descuento_promo_global || 0);
                      if (!monto) return null;
                      return (
                        <li className="flex justify-between text-green-600">
                          <span>Promoción</span>
                          <span>-L. {monto.toFixed(2)}</span>
                        </li>
                      );
                    })()}

                    <li className="flex justify-between">
                      <span>Impuesto (15%)</span>
                      <span>L. {obtenerImpuesto()}</span>
                    </li>

                    <li className="flex justify-between">
                      <span>Costo de Envío</span>
                      <span>L. 10.00</span>
                    </li>

                    <hr className="bg-black h-[3px] w-full" />

                    <li className="text-lg font-bold flex justify-between">
                      <span>Total</span>
                      <span>L. {obtenerTotal()}</span>
                    </li>

                    <button
                      onClick={() => {
                        const coupon = JSON.parse(localStorage.getItem("checkout.coupon") || "null");
                        navigate("/procesoCompra", { state: { coupon } });
                      }}
                      className="bg-[#F0833E] rounded-md text-white text-xl w-full p-1"
                    >
                      Efectuar Compra
                    </button>
                  </ul>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* RECOMENDACIONES */}
      <div className="" style={{ ...styles.fixedShell2, backgroundColor: "#f3f4f6" }}>
        <h1 className="font-roboto text-[#f0833e] text-3xl justify-center text-left px-32">Recomendaciones</h1>
        <hr className="bg-[#f0833e] h-[2px]" />
        <div className="p-4">
          <div style={styles.scrollWrapper}>
            <button style={styles.arrow} onClick={() => scroll("left", prodRefRecomendados, 140)}>
              <img src={arrowL} alt="left" style={{ width: "100%", height: "100%" }} />
            </button>

            <div style={styles.divProducts} ref={prodRefRecomendados}>
              {prodRec.map((p, i) => (
                <div
                  key={i}
                  style={{
                    ...styles.productBox,
                    border: hoveredProductDest === i ? "2px solid #2b6daf" : "2px solid transparent",
                    transform: hoveredProductDest === i ? "scale(1.05)" : "scale(1)",
                    transition: "all 0.2s ease-in-out",
                    cursor: "pointer",
                  }}
                  onMouseEnter={() => setHoveredProductDest(i)}
                  onMouseLeave={() => setHoveredProductDest(null)}
                  onClick={() => navigate(`/producto/${p.id_producto}`)}
                >
                  <div style={styles.topRow}>
                    {bestPromoPriceForProduct(p) && <span style={{ ...styles.offerChip, marginLeft: 8 }}>OFERTA</span>}
                    {Number(p.id_producto) === Number(topSellerId) && (
                      <span style={{ ...styles.offerChip, marginLeft: 8 }}>MÁS COMPRADO</span>
                    )}
                    <div style={styles.stars}>
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <span key={idx} style={{ color: idx < getStars(p) ? "#2b6daf" : "#ddd" }}>★</span>
                      ))}
                    </div>
                  </div>

                  {p.imagenes?.length > 0 && p.imagenes[0]?.url_imagen ? (
                    <img
                      src={toPublicFotoSrc(p.imagenes[0].url_imagen)}
                      alt={p.nombre}
                      style={styles.productImg}
                      onError={(e) => {
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
                        const info = promosInfo[best.promoId];
                        const esFijo = Number(info?.id_tipo_promo) === 2;
                        const esGratis = esFijo && (best.finalPrice || 0) <= 0.009;
                        if (esGratis) {
                          return (
                            <>
                              <span style={styles.newPrice}>L. 0.00</span>
                              <span style={styles.strikePrice}>L. {Number(p.precio_base).toFixed(2)}</span>
                            </>
                          );
                        }
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
                    style={{ ...styles.addButton, backgroundColor: hoveredProductDest === i ? "#2b6daf" : "#F0833E" }}
                    onClick={(e) => { e.stopPropagation(); handleAgregar(p.id_producto, 1); }}
                  >
                    Agregar
                  </button>
                </div>
              ))}
            </div>

            <button style={styles.arrow} onClick={() => scroll("right", prodRefRecomendados, 140)}>
              <img src={arrowR} alt="right" style={{ width: "100%", height: "100%" }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  divProducts: { display: "flex", gap: "13px", overflowX: "auto", scrollBehavior: "smooth", width: "100%", scrollbarWidth: "none", padding: "10px 10px" },
  scrollWrapper: { display: "flex", alignItems: "center", width: "100%", padding: "0 20px" },
  arrow: { background: "transparent", width: "35px", height: "35px", cursor: "pointer", margin: "0 10px", display: "flex", alignItems: "center", justifyContent: "center" },
  productBox: { flexShrink: 0, width: "200px", height: "220px", borderRadius: "25px", padding: "10px", display: "flex", flexDirection: "column", alignItems: "center", backgroundColor: "#fff", boxShadow: "0px 4px 10px rgba(0,0,0,0.15)" },
  topRow: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" },
  stars: { color: "#2b6daf", fontSize: "25px" },
  productName: { width: "100%", textAlign: "left", fontSize: "18px", marginTop: "auto" },
  productPrice: { width: "100%", textAlign: "left", fontSize: "17px", color: "#999", marginTop: "auto" },
  addButton: { marginTop: "auto", width: "100%", backgroundColor: "#F0833E", color: "white", border: "#D8572F", borderRadius: "25px", padding: "2px 0", cursor: "pointer", fontSize: "16px", fontWeight: 600 },
  productImg: { width: "70px", height: "70px", objectFit: "contain", marginTop: "8px" },
  fixedShell: { position: "absolute", top: "145px", left: 0, right: 0, width: "100%", display: "flex", flexDirection: "column" },
  fixedShell2: { position: "relative", top: "200px", left: 0, right: 0, width: "100%", display: "flex", flexDirection: "column" },
  priceRow: { width: "100%", display: "flex", alignItems: "baseline", gap: "10px", marginTop: "auto" },
  newPrice: { fontSize: "17px", fontWeight: 900, lineHeight: 1.1, color: "#16a34a" },
  strikePrice: { fontSize: "14px", color: "#94a3b8", textDecoration: "line-through", lineHeight: 1.1 },
  offerChip: { backgroundColor: "#ff1744", color: "#fff", fontWeight: 800, fontSize: 12, padding: "2px 8px", borderRadius: "999px", letterSpacing: 1, display: "inline-block", transform: "skewX(-12deg)" },
};

export default Carrito;
