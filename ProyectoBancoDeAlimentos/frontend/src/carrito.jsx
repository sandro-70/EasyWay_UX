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
import { GetCupones } from "./api/CuponesApi";
import { getProductosRecomendados } from "./api/InventarioApi";
import { crearPedido } from "./api/PedidoApi";
import { UserContext } from "./components/userContext";
import { useCart } from "../src/utils/CartContext";

//Agregar Parametro que diga cuantos productos en carrito?
function Carrito() {
  //Objeto de producto

  const { incrementCart, decrementCart } = useCart();

  //Productos de pagina de inicio //necesita cantidad, imagen
  const [detalles, setDetalles] = useState([]);
  const [prodRec, setRec] = useState([]);

  //Scroll
  const scroll = (direction, ref, itemWidth) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === "left" ? -itemWidth : itemWidth,
        behavior: "smooth",
      });
    }
  };
  //carrito id
  const { id } = useParams();
  //Referencia de los productos recomendados para scroll
  const prodRefRecomendados = useRef(null);

  const [hoveredProductDest, setHoveredProductDest] = React.useState(null);

  //Saber si el carrito esta vacio o no
  const productosCarrito = useState(0);
  const [discount, setVisible] = useState(false);
  const [cupon, setCupon] = useState("EMPTY");
  const [descCupon, setDesc] = useState(1);
  const [showProducts, setShowProd] = useState(true);
  const [total, setTotal] = useState(0);
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  console.log("Header user carrito", user);
  const obtenerTotal = () => {
    return (total * 1.15 * descCupon).toFixed(2);
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
    if (n < 1) {
      incrementCart();
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
  //Verifica si el cupon es valido
  const checkCupon = async () => {
    try {
      const res = await GetCupones(); // assume this returns an array of coupons
      const allCoupons = res.data ?? []; // adapt if needed

      // Check if any coupon already exists in storedCoupons
      const exists = allCoupons.some(
        (c) => c.id === cupon // or compare by code: c.code === storedCoupon?.code
      );
      //Muestra el apartado del descuento
      if (exists) {
        setVisible(exists);
        //Poner el descuento del cupon
        setDesc(15);
        alert(`Cupon agregado a la compra`);
      } else {
        setVisible(exists);
        //Poner el descuento del cupon
        setDesc(15);
        alert(`Cupon invalido`);
      }
    } catch (err) {
      console.error("Error fetching coupons:", err);
    }
  };
  const realizarCompra = async () => {
    try {
      const total_factura = obtenerTotal();
      let desc = 0;
      if (!(descCupon === 1)) {
        desc = parseFloat(((descCupon / 100) * total).toFixed(2));
      }

      console.log(user.id_usuario);
      console.log(user.direccions[0].id_direccion);
      const id_direccion = user.direccions[0].id_direccion.toString();
      //console.log(id_sucursal)
      console.log(cupon);
      console.log(desc);
      console.log(total_factura);
      const response = await crearPedido(
        user.id_usuario, // int
        id_direccion, // string (o int si cambias el modelo)
        1, // id_sucursal
        null, // id_cupon
        desc // descuento
      );

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
      // 1. Eliminar en backend
      await eliminarEnBackend(idProd);

      // 2. Eliminar en frontend
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

        console.log(
          "Actualizando de " + cantidadActual + " a " + nuevaCantidad
        );
        alert("Actualizando a " + nuevaCantidad);

        // Actualizar en backend
        await SumarItem(id_producto, nuevaCantidad);

        // Actualizar estado local del carrito (si lo tienes)
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
        incrementCart(1);
      } else {
        console.log("Producto nuevo, agregando al carrito");

        // Agregar nuevo producto
        await AddNewCarrito(id_producto, 1);

        // Recargar carrito completo para obtener el nuevo producto
        const carritoActualizado = await ViewCar();
        const nuevosDetalles = carritoActualizado.data.carrito_detalles ?? [];
        setDetalles(nuevosDetalles);

        incrementCart(1);
        alert("Producto agregado al carrito");
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

        // Hacer un único setProducts
      } catch (err) {
        console.error("[REGISTER] error:", err?.response?.data || err);
        alert(err?.response?.data?.message || "Error");
      }
    };
    productos();

    return () => {};
  }, []);
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
            {
              //se renderiza solo si productos es = 0
              !showProducts && (
                <div className="flex flex-row justify-center items-center gap-8">
                  <img src={carrito} className="object-cover mt-16"></img>

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
              )
            }
            {
              //Productos en carrito
              showProducts && (
                <div className="px-6 py-4">
                  <ul className="flex flex-col space-y-4">
                    {detalles.map((p, i) => (
                      <li key={i}>
                        <div className="flex flex-row gap-8 justify-between ">
                          {p.producto.imagenes &&
                          p.producto.imagenes.length > 0 &&
                          p.producto.imagenes[0].url_imagen ? (
                            <img
                              src={`/images/productos/${p.producto.imagenes[0].url_imagen}`}
                              alt={p.producto.nombre}
                              style={styles.productImg}
                              onError={(e) => {
                                e.target.src =
                                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%23999">Imagen no disponible</text></svg>';
                              }}
                            />
                          ) : (
                            <div style={styles.productImg}>
                              Imagen no disponible
                            </div>
                          )}

                          <div className="flex flex-col w-full text-left font-medium">
                            <p className="py-2 text-xl">{p.producto.nombre}</p>
                            <div className="flex flex-row gap-1">
                              <button
                                onClick={() => {
                                  updateQuantity(
                                    p.id_carrito_detalle,
                                    p.producto.id_producto,
                                    p.cantidad_unidad_medida - 1
                                  );
                                  decrementCart();
                                }}
                                className=" bg-[#114C87] text-white rounded-md h-9 px-1"
                              >
                                <span class="material-symbols-outlined text-3xl">
                                  check_indeterminate_small
                                </span>
                              </button>
                              <input
                                className="border-2 border-black rounded-md text-center"
                                value={p.cantidad_unidad_medida}
                              ></input>
                              <button
                                onClick={() => {
                                  updateQuantity(
                                    p.id_carrito_detalle,
                                    p.producto.id_producto,
                                    p.cantidad_unidad_medida + 1
                                  );
                                  incrementCart();
                                }}
                                className="bg-[#114C87] text-white rounded-md h-9 px-1"
                              >
                                <span class="material-symbols-outlined text-3xl">
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
                            <span class="material-symbols-outlined text-5xl ">
                              delete
                            </span>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            }
          </div>
          <div className="flex flex-col col-span-1 w-full rounded-md border-gray-200 border-2 px-6 py-1 pb-2">
            {
              //CODIGO CUPON SOLO SE MUESTRA SI HAY PRODUCTOS EN CARRITO
              showProducts && (
                <div className="pb-2">
                  <p className="text-left pb-2 font-medium">
                    ¿Tienes un cupon?
                  </p>
                  <form className="flex gap-2" onSubmit={checkCupon}>
                    <input
                      type="text"
                      placeholder="Codigo"
                      className="input-field rounded-xl bg-gray-100 border-black border-2 pl-2"
                      onChange={(e) => setCupon(e.target.value)}
                    ></input>
                    <button className="bg-[#114C87] rounded-md py-1 text-white px-12 text-xl">
                      Aplicar
                    </button>
                  </form>
                </div>
              )
            }

            {
              //RESUMEN DE PAGO SIEMPRE SE MUESTRA
            }
            <div>
              <h1 className="font-roboto text-[#80838A] text-2xl font-medium justify-center pb-1 text-left">
                Resumen de pago
              </h1>
              <hr className="bg-[#80838A] h-[2px] w-full mb-1"></hr>

              {
                //BOTON DE COMPRA
              }
            </div>
            {
              //FACTURA SE MUESTRA SI HAY PRODUCTOS EN CARRITO
              showProducts && (
                <div>
                  <ul className="text-left space-y-3 font-medium text-md">
                    <li className="flex justify-between">
                      <span>Subtotal</span>
                      <span>
                        L.
                        {total}
                      </span>
                    </li>

                    <li className="flex justify-between">
                      <span>Impuesto</span>
                      <span>15%</span>
                    </li>
                    {discount && (
                      <li className="flex justify-between">
                        <span>Descuento</span>
                        <span>{descCupon}%</span>
                      </li>
                    )}

                    <hr className="bg-black h-[3px] w-full" />
                    <li className="text-lg font-bold flex justify-between">
                      <span>Total</span>
                      <span>{obtenerTotal()}</span>
                    </li>
                    <button
                      onClick={realizarCompra}
                      className="bg-[#F0833E] rounded-md text-white text-xl w-full p-1"
                    >
                      Efectuar Compra
                    </button>
                  </ul>
                </div>
              )
            }

            {
              //PROTECCION DEL COMPRADOR SE MUESTRA CUANDO NO HAY PRODUCTOS EN CARRITO
              !showProducts && (
                <div className="flex flex-col text-blue-950 justify-end h-full text-left">
                  <div className="flex flex-row items-center">
                    <span class="material-symbols-outlined text-4xl pr-2">
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
              )
            }
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
                  }}
                  onMouseEnter={() => setHoveredProductDest(i)}
                  onMouseLeave={() => setHoveredProductDest(null)}
                >
                  <div style={styles.topRow}>
                    <div style={styles.stars}>
                      <span>★</span>
                      <span>★</span>
                      <span>☆</span>
                    </div>
                  </div>

                  {p.imagenes &&
                  p.imagenes.length > 0 &&
                  p.imagenes[0].url_imagen ? (
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
                  <p style={styles.productName}>{p.nombre}</p>
                  <p style={styles.productPrice}>{p.precio_base}</p>
                  <button
                    style={{
                      ...styles.addButton,
                      backgroundColor:
                        hoveredProductDest === i ? "#2b6daf" : "#F0833E",
                    }}
                    onClick={() => {
                      incrementCart();
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
    top: "24px",
    left: 0,
    right: 0,
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
};

export default Carrito;
