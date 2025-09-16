// src/Carrito.jsx
import axiosInstance from "../src/api/axiosInstance"; // ⬅️ nuevo
import { useState, useEffect, useContext } from "react";
import carrito from "./images/carrito_icon.png";

import { useRef } from "react";
import arrowL from "./images/arrowL.png";
import arrowR from "./images/arrowR.png";
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  SumarItem,
  ViewCar,
  eliminarItem,
  AddNewCarrito,
} from "./api/CarritoApi";
import { GetCupones, desactivarCupon } from "./api/CuponesApi";
import { getPromociones } from "./api/PromocionesApi";
import {
  getProductosRecomendados,
  getAllSucursales,
  listarProductosporsucursal,
} from "./api/InventarioApi";
import { crearPedido } from "./api/PedidoApi";
import { UserContext } from "./components/userContext";
import { useCart } from "../src/utils/CartContext";

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
const toPublicFotoSrc = (nameOrPath) => {
  if (!nameOrPath) return "";
  const s = String(nameOrPath);
  if (/^https?:\/\//i.test(s)) return s; // ya es absoluta
  if (s.startsWith("/api/images/")) return `${BACKEND_ORIGIN}${encodeURI(s)}`;
  if (s.startsWith("/images/"))      return `${BACKEND_ORIGIN}/api${encodeURI(s)}`;
  return backendImageUrl(s); // nombre suelto => /images/productos/<archivo>
};

function Carrito() {
  const { setCount, incrementCart, decrementCart } = useCart();

  const [detalles, setDetalles] = useState([]);
  const [prodRec, setRec] = useState([]);
  const [stockPorSucursal, setStockPorSucursal] = useState({});
  const { id } = useParams();
  const prodRefRecomendados = useRef(null);
  const [hoveredProductDest, setHoveredProductDest] = React.useState(null);
  const productosCarrito = useState(0);
  const [discount, setVisible] = useState(false);
  const [cupon, setCupon] = useState("EMPTY");
  const [idCuponDesactivar, setIDCuponDesactivar] = useState(0);
  const [descCupon, setDesc] = useState(0);
  const [showProducts, setShowProd] = useState(true);
  const [total, setTotal] = useState(0);
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [qtyDraft, setQtyDraft] = useState({});

  const [sucursales, setSucursales] = useState([]);
  const [idSucursal, setIdSucursal] = useState(null);

  const [promociones, setPromociones] = useState([]);
  const [promocionAplicada, setPromocionAplicada] = useState(null);

  console.log("Header user carrito", user);

  // Helper estrellas
  const getStars = (obj) => {
    const n = Math.round(
      Number(obj?.estrellas ?? obj?.rating ?? obj?.valoracion ?? 0)
    );
    return Math.max(0, Math.min(5, isNaN(n) ? 0 : n));
  };

  const getStockEnSucursal = (idProducto) => {
    if (!idSucursal || !stockPorSucursal[idSucursal]) return 0;
    const producto = stockPorSucursal[idSucursal].find(
      (p) => p.id_producto === idProducto
    );
    return producto ? producto.stock_en_sucursal : 0;
  };

  const cargarStockPorSucursal = async (idSucursalParam) => {
    if (!idSucursalParam) return;

    try {
      const response = await listarProductosporsucursal(idSucursalParam);
      const productos = response.data || [];

      setStockPorSucursal((prev) => ({
        ...prev,
        [idSucursalParam]: productos,
      }));

      console.log(`Stock cargado para sucursal ${idSucursalParam}:`, productos);
    } catch (error) {
      console.error(
        `Error cargando stock para sucursal ${idSucursalParam}:`,
        error
      );
    }
  };

  //validar si una promoción está activa
  const validarFechaPromocion = (fechaInicio, fechaTermina) => {
    const hoy = new Date();
    const inicio = new Date(fechaInicio);
    const termina = new Date(fechaTermina);

    return hoy >= inicio && hoy <= termina;
  };

  //obtener promociones válidas
  const obtenerPromocionesValidas = (promociones) => {
    return promociones.filter(
      (promo) =>
        promo.activa &&
        validarFechaPromocion(promo.fecha_inicio, promo.fecha_termina)
    );
  };

  //encontrar mayor promoción aplicable
  const encontrarMejorPromocion = (totalCarrito, promocionesDisponibles) => {
    const promocionesValidas = obtenerPromocionesValidas(
      promocionesDisponibles
    );

    //compra mínima
    const promocionesAplicables = promocionesValidas.filter((promo) => {
      if (promo.compra_min && totalCarrito < promo.compra_min) {
        return false;
      }
      return true;
    });

    if (promocionesAplicables.length === 0) return null;

    let mejorPromocion = null;
    let mayorDescuento = 0;

    promocionesAplicables.forEach((promo) => {
      let descuento = 0;

      switch (promo.id_tipo_promo) {
        case 1: // Porcentual
          descuento = totalCarrito * (parseFloat(promo.valor_porcentaje) / 100);
          break;
        case 2: // Fijo
          descuento = Math.min(parseFloat(promo.valor_fijo), totalCarrito);
          break;
        default:
          descuento = 0;
      }

      if (descuento > mayorDescuento) {
        mayorDescuento = descuento;
        mejorPromocion = promo;
      }
    });

    return mejorPromocion;
  };

  const calcularDescuentoPromocion = () => {
    if (!promocionAplicada) return 0;

    switch (promocionAplicada.id_tipo_promo) {
      case 1: // Descuento porcentual
        const porcentaje = parseFloat(promocionAplicada.valor_porcentaje) || 0;
        return total * (porcentaje / 100);

      case 2: // Descuento fijo
        const valorFijo = parseFloat(promocionAplicada.valor_fijo) || 0;
        return Math.min(valorFijo, total); // No puede ser mayor al total

      default:
        return 0;
    }
  };

  //(cupones + promociones)
  const obtenerDescuentoTotal = () => {
    const descuentoCupon = descCupon > 0 ? total * (descCupon / 100) : 0;
    const descuentoPromocion = calcularDescuentoPromocion();

    return descuentoCupon + descuentoPromocion;
  };

  const obtenerTotal = () => {
    const descuentoTotal = obtenerDescuentoTotal();
    const subtotalConDescuentos = total - descuentoTotal;
    const totalConImpuestos = subtotalConDescuentos * 1.15;

    return Math.max(0, totalConImpuestos).toFixed(2);
  };

  const obtenerImpuesto = () => {
    const descuentoTotal = obtenerDescuentoTotal();
    const subtotalConDescuentos = total - descuentoTotal;
    return (subtotalConDescuentos * 0.15).toFixed(2);
  };

  const obtenerDescuento = () => {
    return obtenerDescuentoTotal().toFixed(2);
  };

  const sumaCarrito = () => {
    const subtotal = detalles.reduce(
      (acc, item) => acc + (item.subtotal_detalle || 0),
      0
    );
    setTotal(subtotal);
    return subtotal;
  };

  const SumarBackend = async (id, n) => {
    await SumarItem(id, n);
  };

  const updateQuantity = async (idDetalle, id, n) => {
    if (n < 1) return;

    const stockDisponible = getStockEnSucursal(id);
    if (n > stockDisponible) {
      alert(
        `Solo hay ${stockDisponible} unidades disponibles en esta sucursal`
      );
      return;
    }

    try {
      await SumarBackend(id, n);
      setDetalles((prev) =>
        prev.map((p) =>
          p.id_carrito_detalle === idDetalle
            ? {
                ...p,
                cantidad_unidad_medida: n,
                subtotal_detalle: p.producto.precio_base * n,
              }
            : p
        )
      );
    } catch (err) {
      console.error("Error updating quantity:", err);
      alert("No se pudo actualizar la cantidad");
    }
  };

  // Verifica si el cupon es valido
  const checkCupon = async (e) => {
    e.preventDefault();
    try {
      console.log("Intentando obtener cupones...");
      const res = await GetCupones();
      console.log(res.data);
      const allCoupons = res.data ?? [];

      const cuponValido = allCoupons.find(
        (c) =>
          c.codigo.toLowerCase() === cupon.toLowerCase() && c.activo === true
      );

      if (cuponValido) {
        setVisible(true);
        setDesc(cuponValido.valor);
        alert(
          `Cupón agregado: ${cuponValido.codigo}, ${cuponValido.valor}% de descuento`
        );
        setIDCuponDesactivar(cuponValido.id_cupon);
      } else {
        setVisible(false);
        setDesc(0);
        alert("Cupón inválido o expirado");
      }
    } catch (err) {
      console.error("Error fetching coupons:", err);
      alert("Error al verificar el cupón");
    }
  };

  const realizarCompra = async () => {
    // Verificar stock antes de proceder con la compra
    for (const item of detalles) {
      const stockDisponible = getStockEnSucursal(item.producto.id_producto);
      if (item.cantidad_unidad_medida > stockDisponible) {
        alert(
          `No hay suficiente stock de ${item.producto.nombre}. Disponible: ${stockDisponible}, Solicitado: ${item.cantidad_unidad_medida}`
        );
        return;
      }
    }

    try {
      const total_factura = obtenerTotal();
      const desc = parseFloat(obtenerDescuento());

      console.log("Total factura con promociones:", total_factura);
      console.log("Descuento total aplicado:", desc);
      console.log(user.id_usuario);
      console.log(user.direccions[0].id_direccion);
      const id_direccion = user.direccions[0].id_direccion.toString();

      const sucursalId = Number(idSucursal ?? sucursales[0]?.id_sucursal ?? 2);

      const response = await crearPedido(
        user.id_usuario,
        id_direccion,
        sucursalId,
        promocionAplicada ? promocionAplicada.id_promocion : null,
        desc
      );

      setCount(0);
      if (idCuponDesactivar !== 0) desactivarCupon(idCuponDesactivar);

      // Limpiar promoción aplicada si había una
      setPromocionAplicada(null);

      console.log("Pedido creado:", response.data);
      alert("Pedido creado correctamente!");
      setShowProd(false);
    } catch (err) {
      console.error("Error creating pedido:", err);
      alert("No se pudo crear el pedido");
    }
  };

  const eliminarEnBackend = async (idToDelete) => {
    await eliminarItem({ id_producto: idToDelete });
  };

  const eliminarProducto = async (idToDelete, idProd) => {
    try {
      await eliminarEnBackend(idProd);
      setDetalles((prev) =>
        prev.filter((p) => p.id_carrito_detalle !== idToDelete)
      );
    } catch (err) {
      console.error("Error eliminando item:", err);
    }
  };

  const handleAgregar = async (id_producto) => {
    if (!id_producto) {
      alert("ID de producto no válido");
      return;
    }

    const stockDisponible = getStockEnSucursal(id_producto);

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
          alert(
            `Solo hay ${stockDisponible} unidades disponibles en esta sucursal`
          );
          return;
        }

        console.log(
          "Actualizando de " + cantidadActual + " a " + nuevaCantidad
        );
        alert("Actualizando a " + nuevaCantidad);

        await SumarItem(id_producto, nuevaCantidad);

        setDetalles((prev) => {
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
      } else {
        console.log("Producto nuevo, agregando al carrito");

        await AddNewCarrito(id_producto, 1);

        const carritoActualizado = await ViewCar();
        const nuevosDetalles = carritoActualizado.data.carrito_detalles ?? [];
        setDetalles(nuevosDetalles);

        alert("Producto agregado al carrito");
      }
    } catch (error) {
      console.error("Error:", error);

      if (error?.response?.status === 404) {
        try {
          await AddNewCarrito(id_producto, 1);

          const carritoNuevo = await ViewCar();
          const nuevosDetalles = carritoNuevo.data.carrito_detalles ?? [];
          setDetalles(nuevosDetalles);

          alert("Producto agregado al carrito");
        } catch (err) {
          console.error("Error creando carrito:", err);
          alert("No se pudo agregar el producto al carrito");
        }
      } else {
        const errorMessage =
          error?.response?.data?.msg ||
          error?.response?.data?.message ||
          error?.message ||
          "No se pudo procesar el carrito";

        alert(errorMessage);
      }
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
      alert(
        `Solo hay ${stockDisponible} unidades disponibles en esta sucursal`
      );
      setQtyDraft((prev) => {
        const { [p.id_carrito_detalle]: _, ...rest } = prev;
        return rest;
      });
      return;
    }

    const diff = n - p.cantidad_unidad_medida;
    try {
      await updateQuantity(p.id_carrito_detalle, p.producto.id_producto, n);
      if (diff > 0) incrementCart(diff);
      if (diff < 0) decrementCart(-diff);
    } catch (err) {
      console.error("Error confirmando cantidad:", err);
      alert("No se pudo actualizar la cantidad");
    } finally {
      setQtyDraft((prev) => {
        const { [p.id_carrito_detalle]: _, ...rest } = prev;
        return rest;
      });
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

  const handleIncrement = async (p) => {
    const nuevaCantidad = p.cantidad_unidad_medida + 1;
    const stockDisponible = getStockEnSucursal(p.producto.id_producto);

    if (nuevaCantidad > stockDisponible) {
      alert(
        `Solo hay ${stockDisponible} unidades disponibles en esta sucursal`
      );
      return;
    }

    try {
      await updateQuantity(
        p.id_carrito_detalle,
        p.producto.id_producto,
        nuevaCantidad
      );
      incrementCart(1);
    } catch (err) {
      console.error("Error incrementando producto:", err);
      alert("No se pudo aumentar la cantidad");
    }
  };

  const handleDecrement = async (p) => {
    if (p.cantidad_unidad_medida <= 1) return;
    const nuevaCantidad = p.cantidad_unidad_medida - 1;
    try {
      await updateQuantity(
        p.id_carrito_detalle,
        p.producto.id_producto,
        nuevaCantidad
      );
      decrementCart(1);
    } catch (err) {
      console.error("Error disminuyendo producto:", err);
      alert("No se pudo disminuir la cantidad");
    }
  };

  //Automatico cuando cambie el total
  useEffect(() => {
    if (total > 0 && promociones.length > 0) {
      const mejorPromocion = encontrarMejorPromocion(total, promociones);

      // Solo actualizar si cambió la promoción
      if (mejorPromocion?.id_promocion !== promocionAplicada?.id_promocion) {
        setPromocionAplicada(mejorPromocion);

        if (mejorPromocion) {
          console.log(
            `Promoción automática aplicada: ${mejorPromocion.nombre_promocion}`
          );
        } else {
          console.log("No hay promociones aplicables");
        }
      }
    } else {
      if (promocionAplicada) {
        setPromocionAplicada(null);
      }
    }
  }, [total, promociones]);

  // Effects existentes
  useEffect(() => {
    setTotal(sumaCarrito());
    if (detalles.length === 0) {
      setShowProd(false);
    } else {
      setShowProd(true);
    }
  }, [detalles]);

  useEffect(() => {
    const productos = async () => {
      try {
        const res = await ViewCar();
        const rec = await getProductosRecomendados();
        console.log("productos rec", rec.data);
        console.log("productos carrito", res.data.carrito_detalles);

        const carritoDetalles = res.data.carrito_detalles ?? [];
        setDetalles(carritoDetalles);
        setRec(rec.data);
        if (carritoDetalles.length === 0) {
          setShowProd(false);
        }
      } catch (err) {
        console.error("[REGISTER] error:", err?.response?.data || err);
        alert(err?.response?.data?.message || "Error");
      }
    };
    productos();

    return () => {};
  }, []);

  // Cargar promociones al inicio
  useEffect(() => {
    const cargarPromociones = async () => {
      try {
        const res = await getPromociones();
        const promocionesData = res.data || [];
        setPromociones(promocionesData);
        console.log("Promociones cargadas:", promocionesData);
      } catch (error) {
        console.error("Error cargando promociones:", error);
      }
    };

    cargarPromociones();
  }, []);

  // Cargar sucursales
  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const res = await getAllSucursales();
        const arr = res?.data ?? [];
        setSucursales(arr);
        if (arr.length && !idSucursal) {
          const primeraSucursal = arr[0].id_sucursal ?? arr[0].id;
          setIdSucursal(primeraSucursal);
          cargarStockPorSucursal(primeraSucursal);
        }
      } catch (err) {
        console.error("Error cargando sucursales:", err);
      }
    };
    fetchSucursales();
  }, []);

  useEffect(() => {
    if (idSucursal) {
      cargarStockPorSucursal(idSucursal);
    }
  }, [idSucursal]);

  return (
    <div
      className="bg-gray-100 w-screen min-h-screen py-4 overflow-x-hidden items-center"
      style={{ ...styles.fixedShell, backgroundColor: "#f3f4f6" }}
    >
      <div className="px-32">
        <div>
          <h1 className="font-roboto text-[#f0833e] text-5xl justify-center pb-3 text-left">
            Carrito
          </h1>
          <hr className="bg-[#f0833e] h-[2px] mb-4"></hr>
        </div>
        <div className="grid grid-cols-3 gap-8 h-[350px]">
          <div className="col-span-2 w-full rounded-md border-gray-200 border-2 overflow-y-auto">
            {!showProducts && (
              <div className="flex flex-row justify-center items-center gap-8">
                <img src={carrito} className="object-cover mt-16" />

                <div className="mx-4 flex flex-col gap-y-6 font-medium">
                  <p className="text-[24px] mt-8">Tu carrito esta vacio</p>
                  <button
                    onClick={() => {
                      navigate("/");
                    }}
                    className="bg-[#2B6DAF] text-[28px] text-white rounded-[10px] p-3 px-6"
                  >
                    Explora articulos
                  </button>
                </div>
              </div>
            )}
            {showProducts && (
              <div className="px-6 py-4">
                <ul className="flex flex-col space-y-4">
                  {detalles.map((p, i) => {
                    const stockDisponible = getStockEnSucursal(
                      p.producto.id_producto
                    );
                    const sinStock = stockDisponible === 0;

                    return (
                      <li key={i}>
                        <div className="flex flex-row gap-8 justify-between ">
                          {p.producto.imagenes &&
                          p.producto.imagenes.length > 0 &&
                          p.producto.imagenes[0].url_imagen ? (
                            <img
                              src={toPublicFotoSrc(p.producto.imagenes[0].url_imagen)}
                              alt={p.producto.nombre}
                              style={styles.productImg}
                              onClick={() =>
                                navigate(`/producto/${p.producto.id_producto}`)
                              }
                              className="cursor-pointer"
                              onError={(e) => {
                                e.target.src =
                                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%23999">Imagen no disponible</text></svg>';
                              }}
                            />
                            //
                          ) : (
                            <div
                              style={styles.productImg}
                              onClick={() =>
                                navigate(`/producto/${p.producto.id_producto}`)
                              }
                              className="cursor-pointer flex items-center justify-center text-xs text-gray-500"
                            >
                              Imagen no disponible
                            </div>
                          )}

                          <div className="flex flex-col w-full text-left font-medium">
                            <p
                              className="py-2 text-xl cursor-pointer"
                              onClick={() =>
                                navigate(`/producto/${p.producto.id_producto}`)
                              }
                            >
                              {p.producto.nombre}
                            </p>

                            <div className="flex -mt-1 mb-1">
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <span
                                  key={idx}
                                  className="text-xl"
                                  style={{
                                    color:
                                      idx < getStars(p.producto)
                                        ? "#2b6daf"
                                        : "#ddd",
                                  }}
                                >
                                  ★
                                </span>
                              ))}
                            </div>

                            <div className="mb-2">
                              {sinStock ? (
                                <span className="text-red-600 font-semibold text-sm">
                                  Sin stock en esta sucursal
                                </span>
                              ) : (
                                <span className="text-green-600 text-sm">
                                  {stockDisponible} disponibles
                                </span>
                              )}
                            </div>

                            <div className="flex flex-row gap-1">
                              <button
                                onClick={() => handleDecrement(p)}
                                className=" bg-[#114C87] text-white rounded-md h-9 px-1"
                                disabled={sinStock}
                              >
                                <span className="material-symbols-outlined text-3xl">
                                  check_indeterminate_small
                                </span>
                              </button>

                              <input
                                type="number"
                                min={1}
                                max={stockDisponible}
                                step={1}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className={`border-2 rounded-md text-center ${
                                  sinStock
                                    ? "border-red-400 bg-red-50"
                                    : "border-black"
                                }`}
                                value={
                                  qtyDraft[p.id_carrito_detalle] ??
                                  p.cantidad_unidad_medida
                                }
                                onChange={(e) =>
                                  handleQtyInputChange(
                                    p.id_carrito_detalle,
                                    e.target.value
                                  )
                                }
                                onBlur={(e) =>
                                  commitQtyChange(p, e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") e.currentTarget.blur();
                                }}
                                onFocus={(e) => e.target.select()}
                                disabled={sinStock}
                              />

                              <button
                                onClick={() => handleIncrement(p)}
                                className="bg-[#114C87] text-white rounded-md h-9 px-1"
                                disabled={sinStock}
                              >
                                <span className="material-symbols-outlined text-3xl">
                                  add
                                </span>
                              </button>
                              <div className="flex  w-full h-full justify-center items-center ">
                                <p className="text-2xl pl-16 ">
                                  L. {p.subtotal_detalle}
                                </p>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              eliminarProducto(
                                p.id_carrito_detalle,
                                p.producto.id_producto
                              );
                              decrementCart(p.cantidad_unidad_medida);
                            }}
                            className=" text-black hover:bg-red-500 hover:text-white rounded-md p-8"
                          >
                            <span className="material-symbols-outlined text-5xl ">
                              delete
                            </span>
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
          <div className="flex flex-col col-span-1 w-full rounded-md border-gray-200 border-2 px-6 py-1 pb-2">
            {/* Solo formulario de cupones */}
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
                  <button
                    type="submit"
                    className="bg-[#114C87] rounded-md py-1 text-white px-6 text-sm"
                  >
                    Aplicar Cupón
                  </button>
                </form>

                {/* Mostrar promoción automática aplicada */}
                {promocionAplicada && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-300 rounded-md">
                    <div className="flex justify-between items-center text-left">
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Promoción aplicada:{" "}
                          {promocionAplicada.nombre_promocion}
                        </p>
                        <p className="text-xs text-green-600">
                          Descuento:{" "}
                          {promocionAplicada.id_tipo_promo === 1
                            ? `${promocionAplicada.valor_porcentaje}%`
                            : `L. ${promocionAplicada.valor_fijo}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          En compra mínima de: L. {promocionAplicada.compra_min}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sucursal */}
            <div className="pb-2">
              <label
                htmlFor="select-sucursal"
                className="block text-left font-bold pb-2"
              >
                Sucursal
              </label>
              <select
                id="select-sucursal"
                value={idSucursal ?? ""}
                onChange={(e) => setIdSucursal(e.target.value)}
                className="w-full border border-gray-300 bg-white rounded-md px-2 py-1 text-sm"
              >
                {(sucursales ?? []).map((s) => (
                  <option
                    key={s.id_sucursal ?? s.id}
                    value={s.id_sucursal ?? s.id}
                  >
                    {s.nombre_sucursal ??
                      s.nombre ??
                      `Sucursal ${s.id_sucursal ?? s.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h1 className="font-roboto text-[#80838A] text-2xl font-medium justify-center pb-1 text-left">
                Resumen de pago
              </h1>
              <hr className="bg-[#80838A] h-[2px] w-full mb-1"></hr>
            </div>

            {showProducts && (
              <div>
                <ul className="text-left space-y-3 font-medium text-md">
                  <li className="flex justify-between">
                    <span>Subtotal</span>
                    <span>L. {total.toFixed(2)}</span>
                  </li>

                  {/* Descuento de cupón */}
                  {discount && descCupon > 0 && (
                    <li className="flex justify-between text-blue-600">
                      <span>Descuento cupón ({descCupon}%)</span>
                      <span>-L. {(total * (descCupon / 100)).toFixed(2)}</span>
                    </li>
                  )}

                  {/* Descuento de promoción automática */}
                  {promocionAplicada && (
                    <li className="flex justify-between text-green-600">
                      <span>
                        Promoción (
                        {promocionAplicada.id_tipo_promo === 1
                          ? `${promocionAplicada.valor_porcentaje}%`
                          : `L. ${promocionAplicada.valor_fijo} fijo`}
                        )
                      </span>
                      <span>-L. {calcularDescuentoPromocion().toFixed(2)}</span>
                    </li>
                  )}

                  <li className="flex justify-between">
                    <span>Impuesto (15%)</span>
                    <span>L. {obtenerImpuesto()}</span>
                  </li>

                  <hr className="bg-black h-[3px] w-full" />
                  <li className="text-lg font-bold flex justify-between">
                    <span>Total</span>
                    <span>L. {obtenerTotal()}</span>
                  </li>

                  <button
                    onClick={realizarCompra}
                    className="bg-[#F0833E] rounded-md text-white text-xl w-full p-1"
                  >
                    Efectuar Compra
                  </button>
                </ul>
              </div>
            )}

            {!showProducts && (
              <div className="flex flex-col text-blue-950 justify-end h-full text-left">
                <div className="flex flex-row items-center">
                  <span className="material-symbols-outlined text-4xl pr-2">
                    verified_user
                  </span>
                  <h1 className="font-bold text-lg">
                    Proteccion del comprador
                  </h1>
                </div>
                <p className="text-md">
                  Recibe un reembolso de tu dinero si el articulo
                  <br />
                  no llega o es diferente al de la descripcion.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className=""
        style={{ ...styles.fixedShell2, backgroundColor: "#f3f4f6" }}
      >
        <h1 className="font-roboto text-[#f0833e] text-3xl justify-center text-left px-32">
          Recomendaciones
        </h1>
        <hr className="bg-[#f0833e] h-[2px]"></hr>
        <div className="p-4">
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
                  onClick={() => navigate(`/producto/${p.id_producto}`)}
                >
                  <div style={styles.topRow}>
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
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%23999">Imagen no disponible</text></svg>';
                      }}
                    />
                  ) : (
                    <div style={styles.productImg}>Imagen no disponible</div>
                  )}
                  <p style={styles.productName}>{p.nombre}</p>
                  <p style={styles.productPrice}>L. {p.precio_base}</p>
                  <button
                    style={{
                      ...styles.addButton,
                      backgroundColor:
                        hoveredProductDest === i ? "#2b6daf" : "#F0833E",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      incrementCart(1);
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
}

const styles = {
  divProducts: {
    display: "flex",
    gap: "13px",
    overflowX: "auto",
    scrollBehavior: "smooth",
    width: "100%",
    scrollbarWidth: "none",
    padding: "10px 10px",
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
  productBox: {
    flexShrink: 0,
    width: "200px",
    height: "220px",
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
    padding: "2px 0",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 600,
  },
  productImg: {
    width: "70px",
    height: "70px",
    objectFit: "contain",
    marginTop: "8px",
  },
  fixedShell: {
    position: "absolute",
    top: "145px",
    left: 0,
    right: 0,
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
  fixedShell2: {
    position: "relative",
    top: "200px",
    left: 0,
    right: 0,
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
};

export default Carrito;
