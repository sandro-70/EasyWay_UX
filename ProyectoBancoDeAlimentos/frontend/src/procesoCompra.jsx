import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "./api/axiosInstance";
import { UserContext } from "./components/userContext";
import { useCart } from "./utils/CartContext";
import { ViewCar } from "./api/CarritoApi";
import {
  getAllSucursales,
  listarProductosporsucursal,
  getProductosRecomendados,
} from "./api/InventarioApi";
import { getAllMetodoPago } from "./api/metodoPagoApi";
import { crearPedido } from "./api/PedidoApi";
import { getPromociones } from "./api/PromocionesApi";
import { AddNewCarrito, SumarItem } from "./api/CarritoApi";
import { toast } from "react-toastify";
import { useRef } from "react";
import arrowL from "./images/arrowL.png";
import arrowR from "./images/arrowR.png";
import { enviarCorreo } from "./api/Usuario.Route";

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
  const { setCount } = useCart();
  const navigate = useNavigate();

  // Estados del checkout
  const [direccionSeleccionada, setDireccionSeleccionada] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [checklistCompleto, setChecklistCompleto] = useState({});

  // Estados de datos
  const [detalles, setDetalles] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [idSucursal, setIdSucursal] = useState(null);
  const [metodosPago, setMetodosPago] = useState([]);
  const [stockPorSucursal, setStockPorSucursal] = useState({});
  const [promociones, setPromociones] = useState([]);
  const [promocionAplicada, setPromocionAplicada] = useState(null);

  // Estados para productos recomendados
  const [prodRec, setProdRec] = useState([]);
  const [hoveredProductRec, setHoveredProductRec] = useState(null);
  const prodRefRecomendados = useRef(null);

  // Estados para promociones por producto (igual que en Carrito)
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

  // Funciones para promociones por producto (igual que en Carrito)
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

  // Funciones auxiliares para cargar promociones
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

  // Validar promoción
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

  // Encontrar mejor promoción
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

  // Calcular descuentos
  const calcularDescuentoPromocion = () => {
    if (!promocionAplicada) return { descuento: 0 };
    const porcentaje = parseFloat(promocionAplicada.valor_porcentaje) || 0;
    const valorFijo = parseFloat(promocionAplicada.valor_fijo) || 0;

    switch (promocionAplicada.id_tipo_promo) {
      case 1:
        return { descuento: subtotal * (porcentaje / 100) };
      case 2:
        return { descuento: Math.min(valorFijo, subtotal) };
      default:
        return { descuento: 0 };
    }
  };

  const obtenerDescuentoTotal = () => {
    let total = 0;

    // Solo descuento promoción (se eliminó cupón)
    if (promocionAplicada) {
      const { descuento } = calcularDescuentoPromocion();
      total += descuento;
    }

    return total;
  };

  const obtenerSubtotalConDescuento = () => {
    return Math.max(0, subtotal - obtenerDescuentoTotal());
  };

  const obtenerImpuesto = () => {
    const subtotalConDescuento = obtenerSubtotalConDescuento();
    return subtotalConDescuento * 0.15;
  };

  const obtenerTotal = () => {
    const subtotalConDescuento = obtenerSubtotalConDescuento();
    const impuesto = obtenerImpuesto();
    return subtotalConDescuento + impuesto + 10; // +10 por envío
  };

  // Helper para estrellas
  const getStars = (obj) => {
    const n = Math.round(
      Number(obj?.estrellas ?? obj?.rating ?? obj?.valoracion ?? 0)
    );
    return Math.max(0, Math.min(5, isNaN(n) ? 0 : n));
  };

  // Función de scroll para productos recomendados
  const scroll = (direction, ref, itemWidth) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === "left" ? -itemWidth : itemWidth,
        behavior: "smooth",
      });
    }
  };

  // Función para agregar productos al carrito desde recomendados
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
      console.log("Agregando producto:", id_producto);
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
        // Recargar el carrito
        const carritoActualizado = await ViewCar();
        const nuevosDetalles = carritoActualizado.data.carrito_detalles ?? [];
        setDetalles(nuevosDetalles);

        // Recalcular subtotal
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

        // Recalcular subtotal
        const sub = nuevosDetalles.reduce(
          (acc, item) => acc + (item.subtotal_detalle || 0),
          0
        );
        setSubtotal(sub);

        toast.success("Producto agregado al carrito");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("No se pudo agregar el producto al carrito");
    }
  };

  // Manejar checkbox del checklist
  const handleCheckboxChange = (index) => {
    setChecklistCompleto((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Realizar compra
  // Realizar compra con envío de correo
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

      // **NUEVO: Enviar correo con resumen de factura**
      try {
        // Preparar la lista de productos para el correo
        const productosResumen = detalles
          .map(
            (item) =>
              `• ${item.producto.nombre} - Cantidad: ${
                item.cantidad_unidad_medida
              } - Subtotal: L. ${(item.subtotal_detalle || 0).toFixed(2)}`
          )
          .join("\n");

        // Obtener información de la dirección seleccionada
        const direccionEnvio = user.direccions.find(
          (dir) => dir.id_direccion.toString() === id_direccion
        );
        const direccionTexto = direccionEnvio
          ? direccionEnvio.direccion_completa ||
            `${direccionEnvio.calle}, ${direccionEnvio.ciudad}`
          : "Dirección no especificada";

        // Obtener nombre de la sucursal
        const sucursalNombre =
          sucursales.find((s) => s.id_sucursal == sucursalId)
            ?.nombre_sucursal || `Sucursal ${sucursalId}`;

        // Crear el contenido del correo
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
• Subtotal: L. ${subtotal.toFixed(2)}${
          promocionAplicada
            ? `
• Descuento (${
                promocionAplicada.nombre_promocion
              }): -L. ${calcularDescuentoPromocion().descuento.toFixed(2)}
• Subtotal con descuentos: L. ${obtenerSubtotalConDescuento().toFixed(2)}`
            : ""
        }
• Impuesto (15%): L. ${obtenerImpuesto().toFixed(2)}
• Envío: L. 10.00
• TOTAL PAGADO: L. ${total_factura.toFixed(2)}

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

Su pedido será procesado y enviado a la brevedad posible. Recibirá actualizaciones sobre el estado de su envío.

¡Gracias por su compra!

Atentamente,
El equipo de EasyWay
      `.trim();

        // Enviar el correo
        await enviarCorreo(user.correo, descripcion, asunto);

        console.log("Correo de confirmación enviado exitosamente");
      } catch (emailError) {
        console.error("Error enviando correo de confirmación:", emailError);
        // No interrumpir el flujo de compra si falla el correo
        toast.warning(
          "Pedido creado correctamente, pero no se pudo enviar el correo de confirmación"
        );
      }

      // Limpiar estados
      setPromocionAplicada(null);
      setCount(0);

      toast.success("¡Pedido creado correctamente!");
      navigate("/misPedidos"); // Redirigir a página de pedidos
    } catch (err) {
      console.error("Error creando pedido:", err);
      const errorMessage =
        err?.response?.data?.error || "No se pudo crear el pedido";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  // Effects
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        // Cargar carrito
        const carritoRes = await ViewCar();
        const carritoDetalles = carritoRes.data.carrito_detalles ?? [];
        setDetalles(carritoDetalles);

        // Calcular subtotal
        const sub = carritoDetalles.reduce(
          (acc, item) => acc + (item.subtotal_detalle || 0),
          0
        );
        setSubtotal(sub);

        // Cargar sucursales
        const sucursalesRes = await getAllSucursales();
        const sucursalesData = sucursalesRes?.data ?? [];
        setSucursales(sucursalesData);

        // Cargar métodos de pago
        const metodosRes = await getAllMetodoPago();
        setMetodosPago(metodosRes.data || []);

        // Cargar promociones
        const promocionesRes = await getPromociones();
        setPromociones(promocionesRes.data || []);

        // Cargar productos recomendados
        const recRes = await getProductosRecomendados();
        setProdRec(recRes.data || []);

        // Cargar promociones por producto
        await cargarPromosDetalles();
        await cargarPromosInfo();

        // Seleccionar primera dirección si existe
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

  // Cargar stock cuando cambie la sucursal
  useEffect(() => {
    if (idSucursal) {
      cargarStockPorSucursal(idSucursal);
    }
  }, [idSucursal]);

  // Aplicar promoción automática cuando cambie el subtotal
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

  // Verificar si hay productos sin stock
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
                      Cantidad: {item.cantidad_unidad_medida} | Stock
                      disponible:{" "}
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
                {/* Opción PayPal */}
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

                {/* Opción Efectivo */}
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

                {/* Métodos de pago existentes (tarjetas) */}
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

              {/* Mensaje cuando no hay métodos de pago registrados */}
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
                    ? `${parseFloat(promocionAplicada.valor_porcentaje)}%`
                    : `L. ${parseFloat(promocionAplicada.valor_fijo).toFixed(
                        2
                      )}`}
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

                  {/* Promoción/cupón aplicado */}
                  {promocionAplicada && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        color: "#16a34a", // verde para mostrar el descuento
                      }}
                    >
                      <span>
                        Promoción ({promocionAplicada.nombre_promocion}):
                      </span>
                      <span>
                        -L. {calcularDescuentoPromocion().descuento.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Subtotal con descuentos aplicados */}
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

      {/* Sección de productos recomendados */}
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
