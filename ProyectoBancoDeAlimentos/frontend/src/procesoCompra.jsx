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
import { getPromociones } from "./api/PromocionesApi";
import { toast } from "react-toastify";
import arrowL from "./images/arrowL.png";
import arrowR from "./images/arrowR.png";
import { enviarCorreo } from "./api/Usuario.Route";
import {
  usarCuponHistorial,
  editarCupon,
  desactivarCupon,
  checkCuponUsuario,
} from "./api/CuponesApi";

// Helper para construir URL de imágenes
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

  // Lee cupón desde navigate(state) o desde localStorage
  const [coupon, setCoupon] = useState(() => {
    return (
      location.state?.coupon ||
      JSON.parse(localStorage.getItem("checkout.coupon") || "null")
    );
  });

  // ==== Helpers fecha cupón (mismos criterios que en Carrito) ====
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
    return today.getTime() >= exp.getTime(); // HOY ya no se puede usar
  };

  // Estados del checkout
  const [direccionSeleccionada, setDireccionSeleccionada] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [mostrarResumen, setMostrarResumen] = useState(false);

  // Estados de datos
  const [detalles, setDetalles] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [idSucursal, setIdSucursal] = useState(null);
  const [metodosPago, setMetodosPago] = useState([]);
  const [stockPorSucursal, setStockPorSucursal] = useState({});
  const [promociones, setPromociones] = useState([]);
  const [promocionAplicada, setPromocionAplicada] = useState(null);

  // Productos recomendados
  const [prodRec, setProdRec] = useState([]);
  const [hoveredProductRec, setHoveredProductRec] = useState(null);
  const prodRefRecomendados = useRef(null);

  // Promos por producto
  const [promosPorProducto, setPromosPorProducto] = useState({});
  const [promosInfo, setPromosInfo] = useState({});

  // Estados calculados
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sucursalGuardada = localStorage.getItem("sucursalSeleccionada");
    if (sucursalGuardada) {
      setIdSucursal(Number(sucursalGuardada));
      cargarStockPorSucursal(Number(sucursalGuardada));
    }
  }, []);

  // Helper para obtener stock en sucursal
  const getStockEnSucursal = (idProducto) => {
    if (!idSucursal || !stockPorSucursal[idSucursal]) return 0;
    const producto = stockPorSucursal[idSucursal].find(
      (p) => p.id_producto === idProducto
    );
    return producto ? producto.stock_en_sucursal : 0;
  };

  // ==== Promos por producto ====
  const isDateInRange = (startStr, endStr) => {
    const today = new Date();
    const start = startStr ? new Date(startStr) : null;
    const end = endStr ? new Date(endStr) : null;
    if (start && today < start) return false;
    if (end && today > end) return false;
    return true;
  };

  const computeDiscountedPriceByPromo = (basePrice, pInfo, cartSubtotal) => {
    if (
      !pInfo?.activa ||
      !isDateInRange(pInfo.fecha_inicio, pInfo.fecha_termina)
    )
      return null;

    const price = Number(basePrice) || 0;
    if (price <= 0) return null;

    const min = pInfo.compra_min != null ? Number(pInfo.compra_min) : 0;
    const subtotalValue = Number(cartSubtotal) || 0;

    if (min > 0 && subtotalValue < min) return null;

    if (pInfo.id_tipo_promo === 1 && Number(pInfo.valor_porcentaje) > 0) {
      const pct = Number(pInfo.valor_porcentaje) / 100;
      return Math.max(0, price * (1 - pct));
    }
    if (pInfo.id_tipo_promo === 2 && Number(pInfo.valor_fijo) > 0) {
      return Math.max(0, price - Number(pInfo.valor_fijo));
    }
    return null;
  };

  const bestPromoPriceForProduct = (prod, cartSubtotal = subtotal) => {
    const base = Number(prod?.precio_base) || 0;
    const ids = promosPorProducto[Number(prod?.id_producto)] || [];
    let best = null;
    for (const idPromo of ids) {
      const info = promosInfo[idPromo];
      const discounted = computeDiscountedPriceByPromo(
        base,
        info,
        cartSubtotal
      );
      if (discounted == null) continue;
      if (best == null || discounted < best.finalPrice) {
        best = { finalPrice: discounted, promoId: idPromo };
      }
    }
    return best;
  };

  // Cargar promos
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

  // Cargar stock por sucursal
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

  // ====== Promociones globales ======
  const validarFechaPromocion = (fechaInicio, fechaTermina) => {
    const hoy = new Date();
    const inicio = new Date(fechaInicio);
    const termina = new Date(fechaTermina);
    return hoy >= inicio && hoy <= termina;
  };

  const obtenerPromocionesValidas = (promociones) => {
    return promociones.filter(
      (promo) =>
        promo.activa &&
        validarFechaPromocion(promo.fecha_inicio, promo.fecha_termina)
    );
  };

  const encontrarMejorPromocion = (totalCarrito, promocionesDisponibles) => {
    const promocionesValidas = obtenerPromocionesValidas(
      promocionesDisponibles
    );
    const promocionesAplicables = promocionesValidas.filter((promo) => {
      const compraMin = Number(promo.compra_min) || 0;
      return compraMin <= totalCarrito;
    });

    if (promocionesAplicables.length === 0) return null;

    let mejorPromocion = null;
    let mayorDescuento = 0;

    for (const promo of promocionesAplicables) {
      const tipo = Number(promo.id_tipo_promo);
      const pct = parseFloat(promo.valor_porcentaje) || 0;
      const fijo = parseFloat(promo.valor_fijo) || 0;

      let descuento = 0;
      if (tipo === 1 && pct > 0) {
        descuento = totalCarrito * (pct / 100);
      } else if (tipo === 2 && fijo > 0) {
        descuento = Math.min(fijo, totalCarrito);
      }

      if (descuento > mayorDescuento) {
        mayorDescuento = descuento;
        mejorPromocion = promo;
      }
    }

    return mejorPromocion;
  };

  // ====== Revalidar cupón al entrar ======
  useEffect(() => {
    (async () => {
      if (!coupon || !user?.id_usuario) return;

      if (isCouponExpired(coupon.termina_en)) {
        toast.info("El cupón expiró antes de finalizar la compra.");
        localStorage.removeItem("checkout.coupon");
        setCoupon(null);
        return;
      }

      try {
        const r = await checkCuponUsuario(coupon.id_cupon, user.id_usuario);
        if (r?.data?.usado) {
          toast.info("Este cupón ya fue usado en otra compra.");
          localStorage.removeItem("checkout.coupon");
          setCoupon(null);
        }
      } catch {
        // Si falla el check, no bloquees; el backend validará igual
      }
    })();
  }, [coupon, user?.id_usuario]);

  // ====== Cálculo de descuentos/totales ======

  // Descuento de promoción solo
  const obtenerDescuentoPromocionSolo = () => {
    if (!promocionAplicada) return 0;
    const porcentaje = parseFloat(promocionAplicada.valor_porcentaje) || 0;
    const valorFijo = parseFloat(promocionAplicada.valor_fijo) || 0;
    if (promocionAplicada.id_tipo_promo === 1) {
      return subtotal * (porcentaje / 100);
    } else if (promocionAplicada.id_tipo_promo === 2) {
      return Math.min(valorFijo, subtotal);
    }
    return 0;
  };

  // Descuento de cupón sobre un subtotal base
  const calcularDescuentoCupon = (base) => {
    if (!coupon) return 0;
    const v = Number(coupon.valor) || 0;
    if (v <= 0) return 0;
    if (coupon.tipo === "porcentaje") {
      return Math.max(0, base * (v / 100));
    } else if (coupon.tipo === "fijo") {
      return Math.min(v, Math.max(0, base));
    }
    return 0;
  };

  // Pipeline: promo -> cupón -> impuesto -> envío
  const obtenerDescuentoTotal = () => {
    const descPromo = obtenerDescuentoPromocionSolo();
    const subtotalTrasPromo = Math.max(0, subtotal - descPromo);
    const descCupon = calcularDescuentoCupon(subtotalTrasPromo);
    return descPromo + descCupon;
  };

  const obtenerSubtotalConDescuento = () => {
    const descPromo = obtenerDescuentoPromocionSolo();
    const subtotalTrasPromo = Math.max(0, subtotal - descPromo);
    const descCupon = calcularDescuentoCupon(subtotalTrasPromo);
    return Math.max(0, subtotalTrasPromo - descCupon);
  };

  const obtenerImpuesto = () => {
    return obtenerSubtotalConDescuento() * 0.15;
  };

  const obtenerTotal = () => {
    return obtenerSubtotalConDescuento() + obtenerImpuesto() + 10; // envío fijo 10
  };

  // Helper estrellas
  const getStars = (obj) => {
    const n = Math.round(
      Number(obj?.estrellas ?? obj?.rating ?? obj?.valoracion ?? 0)
    );
    return Math.max(0, Math.min(5, isNaN(n) ? 0 : n));
  };

  // Scroll recomendaciones
  const scroll = (direction, ref, itemWidth) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === "left" ? -itemWidth : itemWidth,
        behavior: "smooth",
      });
    }
  };

  // Agregar desde recomendados
  const handleAgregar = async (id_producto) => {
    if (!id_producto) {
      toast.error("ID de producto no válido");
      return;
    }

    const stockDisponible = getStockEnSucursal(id_producto);
    if (stockDisponible === 0) {
      toast.error("Sin stock disponible en esta sucursal");
      return;
    }

    try {
      const carritoActual = await ViewCar();
      const carritoDetalles = carritoActual.data.carrito_detalles ?? [];
      const productoExistente = carritoDetalles.find(
        (item) => item.producto.id_producto === id_producto
      );

      if (productoExistente) {
        const cantidadActual = productoExistente.cantidad_unidad_medida || 0;
        const nuevaCantidad = cantidadActual + 1;

        if (nuevaCantidad > stockDisponible) {
          toast.info(
            `Solo hay ${stockDisponible} unidades disponibles en esta sucursal`
          );
          return;
        }

        await SumarItem(id_producto, nuevaCantidad);
        const carritoActualizado = await ViewCar();
        const nuevosDetalles = carritoActualizado.data.carrito_detalles ?? [];
        setDetalles(nuevosDetalles);
        const sub = nuevosDetalles.reduce(
          (acc, item) => acc + (item.subtotal_detalle || 0),
          0
        );
        setSubtotal(sub);
        toast.success("Producto actualizado en el carrito");
      } else {
        await AddNewCarrito(id_producto, 1);
        const carritoActualizado = await ViewCar();
        const nuevosDetalles = carritoActualizado.data.carrito_detalles ?? [];
        setDetalles(nuevosDetalles);
        const sub = nuevosDetalles.reduce(
          (acc, item) => acc + (item.subtotal_detalle || 0),
          0
        );
        setSubtotal(sub);
        incrementCart(1);
        toast.success("Producto agregado al carrito");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("No se pudo agregar el producto al carrito");
    }
  };

  // Realizar compra
  const realizarCompra = async () => {
    if (!user.direccions || user.direccions.length === 0) {
      toast.error(
        "Debes registrar al menos una dirección antes de realizar la compra"
      );
      return;
    }
    if (!metodoPago) {
      toast.error("Selecciona un método de pago");
      return;
    }

    // Validar stock
    for (const item of detalles) {
      const stockDisponible = getStockEnSucursal(item.producto.id_producto);
      if (item.cantidad_unidad_medida > stockDisponible) {
        toast.error(`No hay suficiente stock de ${item.producto.nombre}`);
        return;
      }
    }

    setLoading(true);
    try {
      const total_factura = obtenerTotal();
      const descuento = obtenerDescuentoTotal();
      const id_direccion =
        direccionSeleccionada || user.direccions[0].id_direccion.toString();
      const sucursalId = Number(idSucursal ?? sucursales[0]?.id_sucursal ?? 2);

      const response = await crearPedido(
        user.id_usuario,
        id_direccion,
        sucursalId,
        promocionAplicada ? promocionAplicada.id_promocion : null,
        descuento
      );

      const id_pedido = response.data.id_pedido;

      // === Registrar cupón en historial y actualizar usos ===
      try {
        if (coupon?.id_cupon) {
          await usarCuponHistorial(
            coupon.id_cupon,
            user.id_usuario,
            id_pedido,
            new Date().toISOString()
          );

          if (typeof coupon.uso_maximo_por_usuario !== "undefined") {
            const usosRestantes =
              Number(coupon.uso_maximo_por_usuario) - 1;
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
        // No abortar la compra; el pedido ya existe
      }

      // ===== Preparar correo con los mismos cálculos =====
      try {
        const productosResumen = detalles
          .map(
            (item) =>
              `• ${item.producto.nombre} - Cantidad: ${
                item.cantidad_unidad_medida
              } - Subtotal: L. ${(item.subtotal_detalle || 0).toFixed(2)}`
          )
          .join("\n");

        const direccionEnvio = user.direccions.find(
          (dir) => dir.id_direccion.toString() === id_direccion
        );
        const direccionTexto = direccionEnvio
          ? direccionEnvio.direccion_completa ||
            `${direccionEnvio.calle}, ${direccionEnvio.ciudad}`
          : "Dirección no especificada";

        const sucursalNombre =
          sucursales.find((s) => s.id_sucursal == sucursalId)
            ?.nombre_sucursal || `Sucursal ${sucursalId}`;

        // Cálculos coherentes con el resumen UI
        const descPromo = obtenerDescuentoPromocionSolo();
        const subtotalTrasPromo = Math.max(0, subtotal - descPromo);
        const descCupon = calcularDescuentoCupon(subtotalTrasPromo);
        const subtotalConDesc = obtenerSubtotalConDescuento();
        const impuestoHN = obtenerImpuesto();
        const totalFactura = obtenerTotal();

        const lineaPromo = promocionAplicada
          ? `\n• Descuento Promoción (${promocionAplicada.nombre_promocion}): -L. ${descPromo.toFixed(2)}`
          : "";

        const lineaCupon = coupon
          ? `\n• Descuento Cupón (${coupon.codigo}${
              coupon.tipo === "porcentaje" ? ` ${Number(coupon.valor)}%` : ""
            }): -L. ${descCupon.toFixed(2)}`
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
• Subtotal: L. ${subtotal.toFixed(2)}${lineaPromo}${lineaCupon}
• Subtotal con descuentos: L. ${subtotalConDesc.toFixed(2)}
• Impuesto (15%): L. ${impuestoHN.toFixed(2)}
• Envío: L. 10.00
• TOTAL PAGADO: L. ${totalFactura.toFixed(2)}

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
  const metodo = metodosPago.find(
    (m) => m.id_metodo_pago.toString() === metodoPago
  );
  return metodo
    ? `${metodo.nombre_en_tarjeta} (**** **** **** ${metodo.tarjeta_ultimo})`
    : "No especificado";
})()}

¡Gracias por su compra!

Atentamente,
El equipo de EasyWay
`.trim();

// Convierte texto plano -> HTML respetando saltos de línea
const descripcionHTML =
  `<div style="white-space:pre-wrap; font-family:Arial, sans-serif; font-size:14px; line-height:1.5">` +
  descripcion
    .replace(/&/g, "&amp;")   // escape básico por si hay < o &
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r?\n/g, "<br/>") // << aquí forzamos los saltos en HTML
  + `</div>`;

        await enviarCorreo(user.correo, descripcionHTML, asunto);
      } catch (emailError) {
        console.error("Error enviando correo de confirmación:", emailError);
        toast.warning(
          "Pedido creado correctamente, pero no se pudo enviar el correo de confirmación"
        );
      }

      // Limpiar estados UI
      setPromocionAplicada(null);
      setCount(0);
      toast.success(`¡Pedido #${id_pedido} creado correctamente!`);
      navigate("/misPedidos");
    } catch (err) {
      console.error("Error creando pedido:", err);
      const errorMessage =
        err?.response?.data?.error || "No se pudo crear el pedido";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ===== Effects iniciales =====
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const carritoRes = await ViewCar();
        const carritoDetalles = carritoRes.data.carrito_detalles ?? [];
        setDetalles(carritoDetalles);

        const sub = carritoDetalles.reduce(
          (acc, item) => acc + (item.subtotal_detalle || 0),
          0
        );
        setSubtotal(sub);

        const sucursalesRes = await getAllSucursales();
        const sucursalesData = sucursalesRes?.data ?? [];
        setSucursales(sucursalesData);

        const metodosRes = await getAllMetodoPago();
        setMetodosPago(metodosRes.data || []);

        const promocionesRes = await getPromociones();
        setPromociones(promocionesRes.data || []);

        const recRes = await getProductosRecomendados();
        setProdRec(recRes.data || []);

        await cargarPromosDetalles();
        await cargarPromosInfo();

        if (user.direccions && user.direccions.length > 0) {
          setDireccionSeleccionada(user.direccions[0].id_direccion.toString());
        }
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
        toast.error("Error cargando datos del checkout");
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

  useEffect(() => {
    if (subtotal > 0 && promociones.length > 0) {
      const mejorPromocion = encontrarMejorPromocion(subtotal, promociones);
      if (mejorPromocion?.id_promocion !== promocionAplicada?.id_promocion) {
        setPromocionAplicada(mejorPromocion);
      }
    } else {
      if (promocionAplicada) setPromocionAplicada(null);
    }
  }, [subtotal, promociones]);

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
              {detalles.map((item, index) => (
                <div key={index} style={styles.productItem}>
                  {item.producto.imagenes &&
                  item.producto.imagenes.length > 0 &&
                  item.producto.imagenes[0].url_imagen ? (
                    <img
                      src={toPublicFotoSrc(
                        item.producto.imagenes[0].url_imagen
                      )}
                      alt={item.producto.nombre}
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
                    <div style={styles.productName}>{item.producto.nombre}</div>
                    <div style={styles.productQuantity}>
                      Cantidad: {item.cantidad_unidad_medida} | Stock disponible:{" "}
                      {getStockEnSucursal(item.producto.id_producto)}
                    </div>
                  </div>
                  <div style={styles.productPrice}>
                    L. {(item.subtotal_detalle || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

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

            <div style={styles.lastSection}>
              <h2 style={styles.sectionTitle}>Método de Pago</h2>
              <div style={styles.radioGroup}>
                {/* PayPal */}
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

                {/* Efectivo */}
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

                {/* Tarjetas registradas */}
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

          <div style={styles.rightColumn}>
            <div style={styles.sidebar}>
              <h3 style={styles.sidebarTitle}>Sucursal Seleccionada</h3>
              <div style={styles.sucursalInfo}>
                {sucursales.find((s) => s.id_sucursal == idSucursal)
                  ?.nombre_sucursal || `Sucursal ${idSucursal}`}
              </div>

              {/* Promoción automática */}
              {promocionAplicada && (
                <div style={styles.promoSuccess}>
                  Promoción aplicada: {promocionAplicada.nombre_promocion}
                  <br />
                  Descuento:{" "}
                  {promocionAplicada.id_tipo_promo === 1
                    ? `${parseFloat(
                        promocionAplicada.valor_porcentaje
                      )}%`
                    : `L. ${parseFloat(
                        promocionAplicada.valor_fijo
                      ).toFixed(2)}`}
                </div>
              )}

              {/* Cupón aplicado */}
              {coupon && (
                <div style={styles.couponSuccess}>
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
                  {/* Subtotal original */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <span>Subtotal:</span>
                    <span>L. {subtotal.toFixed(2)}</span>
                  </div>

                  {/* Promoción aplicada */}
                  {promocionAplicada && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        color: "#16a34a",
                      }}
                    >
                      <span>
                        Promoción ({promocionAplicada.nombre_promocion}):
                      </span>
                      <span>-L. {obtenerDescuentoPromocionSolo().toFixed(2)}</span>
                    </div>
                  )}

                  {/* Cupón aplicado */}
                  {coupon && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        color: "#16a34a",
                      }}
                    >
                      <span>
                        Cupón ({coupon.codigo}
                        {coupon.tipo === "porcentaje"
                          ? ` ${Number(coupon.valor)}%`
                          : ""}):
                      </span>
                      <span>
                        -L.{" "}
                        {calcularDescuentoCupon(
                          Math.max(
                            0,
                            subtotal - obtenerDescuentoPromocionSolo()
                          )
                        ).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Subtotal con descuentos */}
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
                    <span>Subtotal con descuentos:</span>
                    <span>L. {obtenerSubtotalConDescuento().toFixed(2)}</span>
                  </div>

                  {/* Impuesto */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <span>Impuesto (15%):</span>
                    <span>L. {obtenerImpuesto().toFixed(2)}</span>
                  </div>

                  {/* Envío */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <span>Envío:</span>
                    <span>L. 10.00</span>
                  </div>

                  {/* Total final */}
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
                    <span>Total a pagar:</span>
                    <span>L. {obtenerTotal().toFixed(2)}</span>
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
              onClick={() => scroll("left", prodRefRecomendados, 140)}
            >
              <img
                src={arrowL}
                alt="left"
                style={{ width: "100%", height: "100%" }}
              />
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

                  {p.imagenes &&
                  p.imagenes.length > 0 &&
                  p.imagenes[0].url_imagen ? (
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
              onClick={() => scroll("right", prodRefRecomendados, 140)}
            >
              <img
                src={arrowR}
                alt="right"
                style={{ width: "100%", height: "100%" }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  headerWrapper: {
    marginBottom: "20px",
  },
  header: {
    fontSize: "28px",
    fontWeight: "650",
    color: "#f97316",
    margin: 0,
  },
  headerLineWrapper: {
    marginTop: "4px",
  },
  headerLine: {
    width: "100%",
    height: "2px",
    backgroundColor: "#f97316",
  },
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
  section: {
    padding: "20px",
    borderBottom: "1px solid #e9ecef",
  },
  lastSection: {
    padding: "20px",
    borderBottom: "none",
  },
  sectionTitle: {
    fontSize: "1.2rem",
    color: "#2b6daf",
    fontWeight: "600",
    marginBottom: "15px",
    margin: "0 0 15px 0",
  },
  formGroup: {
    marginBottom: "15px",
  },
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
  input: {
    flex: "1",
    padding: "10px",
    border: "1px solid #ced4da",
    borderRadius: "4px",
    fontSize: "0.9rem",
    backgroundColor: "#ffffff",
    color: "#495057",
    outline: "none",
  },
  radioGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  radioItem: {
    display: "flex",
    alignItems: "center",
    padding: "0",
    borderBottom: "1px solid #ccc",
  },
  radioInput: {
    marginRight: "10px",
    accentColor: "#2ca9e3",
    cursor: "pointer",
  },
  radioLabel: {
    fontSize: "0.9rem",
    color: "#495057",
    cursor: "pointer",
    textAlign: " left",
  },
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
  sidebar: {
    width: "100%",
  },
  sidebarTitle: {
    fontSize: "1rem",
    color: "#495057",
    fontWeight: "600",
    marginBottom: "12px",
  },
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
  proteccionBox: {
    display: "flex",
    alignItems: "flex-start",
    padding: "12px 0",
  },
  proteccionIcon: {
    marginRight: "8px",
    marginTop: "2px",
    fontSize: "16px",
  },
  proteccionContent: {
    flex: "1",
  },
  proteccionTitle: {
    fontSize: "0.9rem",
    color: "#495057",
    fontWeight: "600",
    marginBottom: "4px",
  },
  proteccionText: {
    fontSize: "0.8rem",
    color: "#6c757d",
    lineHeight: "1.3",
  },
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
  productInfo: {
    flex: "1",
  },
  productName: {
    fontWeight: "500",
    marginBottom: "4px",
    fontSize: "0.95rem",
  },
  productQuantity: {
    color: "#6c757d",
    fontSize: "0.85rem",
  },
  productPrice: {
    fontWeight: "600",
    color: "#2b6daf",
    fontSize: "0.95rem",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#6c757d",
  },
  emptyIcon: {
    fontSize: "3rem",
    marginBottom: "15px",
  },
  emptyText: {
    fontSize: "1.3rem",
    marginBottom: "10px",
  },
  emptySubtext: {
    marginBottom: "20px",
    color: "#868e96",
  },

  // Estilos para productos recomendados
  recommendationsSection: {
    backgroundColor: "#f8f9fa",
    paddingTop: "40px",
    paddingBottom: "40px",
  },
  recommendationsHeader: {
    marginBottom: "20px",
  },
  recommendationsTitle: {
    fontSize: "24px",
    fontWeight: "650",
    color: "#f97316",
    margin: 0,
  },
  scrollWrapper: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "0 20px",
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
  topRow: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "3px",
  },
  stars: {
    color: "#2b6daf",
    fontSize: "25px",
  },
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
  productName: {
    width: "100%",
    textAlign: "left",
    fontSize: "18px",
    marginTop: "auto",
  },
  priceRow: {
    width: "100%",
    display: "flex",
    alignItems: "baseline",
    gap: "10px",
    justifyContent: "center",
    marginBottom: "10px",
  },
  productPrice: {
    width: "100%",
    textAlign: "left",
    fontSize: "17px",
    color: "#999",
    marginTop: "auto",
  },
  newPrice: {
    fontSize: "16px",
    fontWeight: 900,
    color: "#16a34a", // verde
    lineHeight: 1.1,
  },
  strikePrice: {
    fontSize: "14px",
    color: "#94a3b8", // gris
    textDecoration: "line-through",
    lineHeight: 1.1,
  },
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