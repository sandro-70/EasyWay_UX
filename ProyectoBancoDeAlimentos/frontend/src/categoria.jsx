import React, { useState, useRef, useEffect } from "react";
import "./categoria.css";
import Slider from "@mui/material/Slider";
import Checkbox from "@mui/material/Checkbox";
import { getAllProducts } from "./api/InventarioApi";
import { useParams } from "react-router-dom";
import { listarSubcategoria, listarPorCategoria } from "./api/SubcategoriaApi";
import { AddNewCarrito, ViewCar, SumarItem } from "./api/CarritoApi";
import { useNavigate } from "react-router-dom";
import CompararProducto from "./components/compararProducto";
import {useCart} from "./utils/CartContext";

function Categoria() {
  const navigate = useNavigate();

  const {incrementCart} = useCart();

  const prodRefRecomendados = useRef(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderby, setOrder] = useState("");
  const [stateProducto, setState] = useState("Agregar");
  const [btnCompare, setCompare] = useState("COMPARAR");
  const [carrito, setCarrito] = useState(null);
  const [selectedSubcategorias, setSelectedSubcategorias] = useState([]);

  const [productosParaComparar, setProductosParaComparar] = useState([]);
  const [mostrandoComparacion, setMostrandoComparacion] = useState(false);

  const [priceRange, setPriceRange] = useState([10, 100]);
  const [minPrice, setMinPrice] = useState(10);
  const [maxPrice, setMaxPrice] = useState(100);

  const [selectedMarca, setSelectedMarca] = useState("");
  const [marcasDisponibles, setMarcasDisponibles] = useState([]);

  const { id } = useParams();

  const [hoveredProductDest, setHoveredProductDest] = React.useState(null);
  const [hoveredProductTrend, setHoveredProductTrend] = React.useState(null);

  // ----- Comparar productos -----
  const agregarAComparar = (producto) => {
    setProductosParaComparar((prev) => {
      const exists = prev.find((p) => p.id_producto === producto.id_producto);
      if (exists) {
        return prev.filter((p) => p.id_producto !== producto.id_producto);
      }
      if (prev.length >= 2) {
        return [prev[1], producto];
      }
      return [...prev, producto];
    });
  };

  const iniciarComparacion = () => {
    if (productosParaComparar.length >= 2) {
      setMostrandoComparacion(true);
    } else {
      alert("Selecciona al menos 2 productos para comparar");
    }
  };

  const cerrarComparacion = () => {
    setMostrandoComparacion(false);
  };

  const cancelarComparacion = () => {
    setProductosParaComparar([]);
    setState("Agregar");
    setCompare("COMPARAR");
  };

  // ----- Fetch subcategorias por categoria -----
  const fetchPorCategoria = async (idCategoria) => {
    try {
      setLoading(true);
      const res = await listarPorCategoria(idCategoria);

      const extractArray = (data) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (data.subcategorias && Array.isArray(data.subcategorias))
          return data.subcategorias;
        if (data.data && Array.isArray(data.data)) return data.data;
        return [];
      };

      const arr = extractArray(res?.data);
      setSubcategorias(arr);
    } catch (err) {
      console.error(
        err?.response?.data?.message ||
          "Error al obtener subcategorías por categoría"
      );
    } finally {
      setLoading(false);
    }
  };

  // ----- Handlers filtro -----
  const handleSubcategoriaChange = (subcategoriaId, checked) => {
    if (checked) {
      setSelectedSubcategorias((prev) => [...prev, subcategoriaId]);
    } else {
      setSelectedSubcategorias((prev) =>
        prev.filter((id) => id !== subcategoriaId)
      );
    }
  };

  const applyFilters = (productList) => {
    let filtered = [...productList];

    // Filtro subcategorías
    if (selectedSubcategorias.length > 0) {
      filtered = filtered.filter((product) => {
        const productSubcategoriaId =
          product.subcategoria?.id_subcategoria || product.subcategoria?.id;
        return selectedSubcategorias.includes(productSubcategoriaId);
      });
    }

    // Filtro precio
    filtered = filtered.filter((product) => {
      const precio = parseFloat(product.precio_base) || 0;
      return precio >= priceRange[0] && precio <= priceRange[1];
    });

    // Filtro marca
    if (selectedMarca && selectedMarca !== "") {
      filtered = filtered.filter((product) => {
        const productMarca = product.marca?.nombre || product.marca || "";
        return productMarca.toLowerCase() === selectedMarca.toLowerCase();
      });
    }

    // Ordenar si aplica
    if (orderby === "Mas Vendidos") {
      // Si tu API trae un campo de ventas, úsalo. Aquí ordeno por estrellas como ejemplo
      filtered.sort((a, b) => (b.estrellas || 0) - (a.estrellas || 0));
    } else if (orderby === "Novedades") {
      // Si tienes fecha de creación, ordena por fecha. Aquí asumo campo fecha_creacion
      filtered.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
    }

    return filtered;
  };

  const handlePriceChange = (event, newValue) => {
    setPriceRange(newValue);
  };

  const handleQuickPriceFilter = (type) => {
    switch (type) {
      case "menos10":
        setPriceRange([minPrice, 10]);
        break;
      case "menos50":
        setPriceRange([minPrice, 50]);
        break;
      case "mas100":
        setPriceRange([100, maxPrice]);
        break;
      default:
        break;
    }
  };

  const handleMarcaChange = (event) => {
    setSelectedMarca(event.target.value);
  };

  function agregarComparar() {
    if (stateProducto === "Agregar") {
      setState("Comparar");
      setCompare("CANCELAR");
      return;
    }

    if (productosParaComparar.length >= 2) {
      iniciarComparacion();
    } else cancelarComparacion();
  }

  useEffect(() => {
    if (products.length > 0) {
      const precios = products.map((p) => parseFloat(p.precio_base) || 0);
      const min = Math.floor(Math.min(...precios));
      const max = Math.ceil(Math.max(...precios));

      setMinPrice(min);
      setMaxPrice(max);

      if (priceRange[0] === 10 && priceRange[1] === 100) {
        setPriceRange([min, max]);
      }

      const marcasSet = new Set();
      products.forEach((product) => {
        const marca = product.marca?.nombre || product.marca || "";
        if (marca && marca.trim() !== "") {
          marcasSet.add(marca.trim());
        }
      });

      const marcasArray = Array.from(marcasSet).sort();
      setMarcasDisponibles(marcasArray);
    }
  }, [products]);

  useEffect(() => {
    const filtered = applyFilters(products);
    setFilteredProducts(filtered);
  }, [products, selectedSubcategorias, priceRange, selectedMarca, orderby]);

  useEffect(() => {
    const productos = async () => {
      try {
        setLoading(true);
        setError(null);
        setProducts([]);

        const res = await getAllProducts();

        let categoryProducts = [];

        res.data.forEach((p) => {
          if (p.subcategoria?.categoria) {
            const categorias = Array.isArray(p.subcategoria.categoria)
              ? p.subcategoria.categoria
              : [p.subcategoria.categoria];

            const belongsToCategory = categorias.some(
              (cat) => cat.id_categoria === parseInt(id)
            );

            if (belongsToCategory) {
              categoryProducts.push(p);
            }
          }
        });

        setProducts(categoryProducts);
      } catch (err) {
        setError(err?.response?.data?.message || "Error al cargar productos");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPorCategoria(id);
      productos();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="bg-gray-100 w-screen min-h-screen py-2 px-2 flex items-center justify-center">
        <p>Cargando productos...</p>
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

        console.log(`Actualizando de ${cantidadActual} a ${nuevaCantidad}`);
        alert(`Actualizando a ${nuevaCantidad}`);

        // Actualizar en backend
        await SumarItem(id_producto, nuevaCantidad);

        // Actualizar estado local del carrito (si lo tienes)
        setCarrito((prev) => {
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
        incrementCart();
      } else {
        console.log("Producto nuevo, agregando al carrito");

        // Agregar nuevo producto
        await AddNewCarrito(id_producto, 1);

        // Recargar carrito completo para obtener el nuevo producto
        const carritoActualizado = await ViewCar();
        const nuevosDetalles = carritoActualizado.data.carrito_detalles ?? [];
        setCarrito(nuevosDetalles);

        alert(`Producto agregado al carrito`);
        incrementCart();
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
          setCarrito(nuevosDetalles);

          alert(`Producto agregado al carrito`);
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

  const handleProductClick = (productId) => {
    if (stateProducto === "Comparar") {
      return; // En modo comparar, no navegar al detalle
    }
    navigate(`/producto/${productId}`);
  };

  const isProductSelected = (productId) => {
    return productosParaComparar.some((p) => p.id_producto === productId);
  };

  return (
    <div className="" style={styles.fixedShell}>
      {/* Modal de comparación */}
      {mostrandoComparacion && (
        <CompararProducto
          productos={productosParaComparar}
          onCerrar={cerrarComparacion}
        />
      )}

      <div className="flex flex-row">
        {/* Sidebar / Panel de filtros unificado (NO tocar otras partes del layout) */}
        <div className="flex flex-col h-[720px] fixed w-[320px] gap-4 p-4" style={{left: 10}}>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-4 w-[300px] max-h-[680px] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-3">Filtrar productos</h2>

            {/* Sub-categoría */}
<section className="mb-4">
  <h3 className="text-md font-medium mb-2">Sub-categoría</h3>

  {/* Scroll propio con altura limitada y barra personalizada */}
  <ul className="space-y-1 overflow-y-auto max-h-[100px] pr-2 custom-scroll">
    {subcategorias.length > 0 ? (
      subcategorias.map((sub, i) => {
        const subcategoriaId = sub.id || sub.id_subcategoria;
        const isChecked = selectedSubcategorias.includes(subcategoriaId);

        return (
          <li key={subcategoriaId || i}>
            <div className="flex items-center gap-2">
              <Checkbox
                color="secondary"
                size="small"
                checked={isChecked}
                onChange={(e) =>
                  handleSubcategoriaChange(subcategoriaId, e.target.checked)
                }
                sx={{
                  color: "",
                  "&.Mui-checked": { color: "#114C87" },
                }}
              />
              <span className="text-sm">{sub.nombre || `Subcategoría ${i + 1}`}</span>
            </div>
          </li>
        );
      })
    ) : (
      <li className="text-gray-500 text-sm">No hay subcategorías disponibles</li>
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
                {marcasDisponibles.map((marca, index) => (
                  <option key={index} value={marca}>
                    {marca}
                  </option>
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
                  sx={{
                    color: "#2b6daf",
                    "& .MuiSlider-thumb": { backgroundColor: "#2b6daf" },
                  }}
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

            {/* Ordenar Por */}
            <section className="mb-4">
              <h3 className="text-md font-medium mb-2">Ordenar por</h3>
              <div className="grid grid-cols-1 gap-2">
                <button
                  className={`text-left px-3 py-2 rounded-md ${orderby === "Relevancia" ? "bg-[#ffac77] font-semibold" : "hover:bg-[#ffac77]"}`}
                  onClick={(e) => setOrder("Relevancia")}
                >
                  Relevancia
                </button>
                <button
                  className={`text-left px-3 py-2 rounded-md ${orderby === "Mas Vendidos" ? "bg-[#ffac77] font-semibold" : "hover:bg-[#ffac77]"}`}
                  onClick={(e) => setOrder("Mas Vendidos")}
                >
                  Mas Vendidos
                </button>
                <button
                  className={`text-left px-3 py-2 rounded-md ${orderby === "Novedades" ? "bg-[#ffac77] font-semibold" : "hover:bg-[#ffac77]"}`}
                  onClick={(e) => setOrder("Novedades")}
                >
                  Novedades
                </button>
              </div>
            </section>

            <hr className="my-3" />

            {/* Botón de comparar */}
            <section className="flex flex-col items-center gap-2">
              <button
                onClick={agregarComparar}
                className={`px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-md transition-colors duration-300 w-full
                ${stateProducto === "Agregar" ? "bg-[#2B6DAF] hover:bg-[#1f4e7f]" : "bg-[#80838A]"}`}
              >
                {btnCompare}
              </button>

              {stateProducto === "Comparar" && productosParaComparar.length >= 2 && (
                <button
                  onClick={iniciarComparacion}
                  className="px-6 py-2 rounded-xl bg-[#2B6DAF] text-white text-sm font-semibold shadow-md hover:bg-[#1f4e7f] transition-colors duration-300 w-full"
                >
                  COMPARAR
                </button>
              )}

              {/* Mostrar badges para filtros activos */}
              <div className="mt-3 w-full">
                {(selectedSubcategorias.length > 0 ||
                  priceRange[0] !== minPrice ||
                  priceRange[1] !== maxPrice ||
                  selectedMarca !== "") && (
                  <div className="text-sm text-gray-500">
                    <p className="mb-2">Filtros activos:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedMarca && (
                        <button
                          onClick={() => setSelectedMarca("")}
                          className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs hover:bg-red-200"
                        >
                          ✕ Marca: {selectedMarca}
                        </button>
                      )}
                      {(priceRange[0] !== minPrice || priceRange[1] !== maxPrice) && (
                        <button
                          onClick={() => setPriceRange([minPrice, maxPrice])}
                          className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs hover:bg-red-200"
                        >
                          ✕ Precio: L.{priceRange[0]} - L.{priceRange[1]}
                        </button>
                      )}
                      {selectedSubcategorias.length > 0 && (
                        <button
                          onClick={() => setSelectedSubcategorias([])}
                          className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs hover:bg-red-200"
                        >
                          ✕ Subcategorías ({selectedSubcategorias.length})
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Display Productos */}
        <div className="w-full ml-[350px] mr-[20px]">
          <div style={styles.divProducts} ref={prodRefRecomendados}>
            {filteredProducts.length === 0 ? (
              <div className="col-span-5 text-center py-10">
                <p>No se encontraron productos con los filtros aplicados</p>
                {(selectedSubcategorias.length > 0 ||
                  priceRange[0] !== minPrice ||
                  priceRange[1] !== maxPrice ||
                  selectedMarca !== "") && (
                  <div className="text-sm text-gray-500 mt-2">
                    <p>Intenta ajustar los filtros:</p>
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                      {selectedMarca && (
                        <button
                          onClick={() => setSelectedMarca("")}
                          className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs hover:bg-red-200"
                        >
                          ✕ Marca: {selectedMarca}
                        </button>
                      )}
                      {(priceRange[0] !== minPrice ||
                        priceRange[1] !== maxPrice) && (
                        <button
                          onClick={() => setPriceRange([minPrice, maxPrice])}
                          className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs hover:bg-red-200"
                        >
                          ✕ Precio: L.{priceRange[0]} - L.{priceRange[1]}
                        </button>
                      )}
                      {selectedSubcategorias.length > 0 && (
                        <button
                          onClick={() => setSelectedSubcategorias([])}
                          className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs hover:bg-red-200"
                        >
                          ✕ Subcategorías ({selectedSubcategorias.length})
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              filteredProducts.map((p, i) => {
                const isSelected = isProductSelected(p.id_producto);
                return (
                  <div
                    key={i}
                    style={{
                      ...styles.productBox,
                      border:
                        hoveredProductDest === i
                          ? "2px solid #2b6daf"
                          : isSelected
                          ? "2px solid #ff6b35"
                          : "2px solid transparent",
                      transform:
                        hoveredProductDest === i ? "scale(1.05)" : "scale(1)",
                      transition: "all 0.2s ease-in-out",
                      cursor: "pointer",
                      backgroundColor: isSelected ? "#fff5f0" : "#fff",
                    }}
                    onMouseEnter={() => setHoveredProductDest(i)}
                    onMouseLeave={() => setHoveredProductDest(null)}
                    onClick={() => {
                      if (stateProducto === "Comparar") {
                        agregarAComparar(p);
                      } else {
                        handleProductClick(p.id_producto);
                      }
                    }}
                  >
                    <div style={styles.topRow}>
                      <span style={styles.badge}>Oferta</span>
                      <span style={styles.stars}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <span
                            key={i}
                            style={{
                              color: i < p.estrellas ? "#2b6daf" : "#ddd",
                              fontSize: "25px",
                            }}
                          >
                            ★
                          </span>
                        ))}
                      </span>
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
                    <p style={styles.productPrice}>L.{p.precio_base}</p>

                    <button
                      style={{
                        ...styles.addButton,
                        backgroundColor:
                          stateProducto === "Comparar"
                            ? isSelected
                              ? "#ff6b35"
                              : "#ccc"
                            : hoveredProductDest === i
                            ? "#2b6daf"
                            : "#F0833E",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (stateProducto === "Comparar") {
                          agregarAComparar(p);
                        } else {
                          handleAgregar(p.id_producto, 1);
                        }
                      }}
                    >
                      {stateProducto === "Comparar"
                        ? isSelected
                          ? "Quitar"
                          : "Comparar"
                        : "Agregar"}
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
  scrollWrapper: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "0 20px",
  },
  customScroll: {
    maxHeight: "100px",
    overflowY: "auto",
    paddingRight: "6px",
    scrollbarWidth: "thin",              // Firefox
    scrollbarColor: "#999 transparent",  // Firefox
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
  badge: {
    backgroundColor: "#2b6daf",
    color: "white",
    fontSize: "14px",
    padding: "4px 10px",
    borderRadius: "18px",
  },
  stars: {
    color: "#2b6daf",
    fontSize: "18px",
  },
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
};



export default Categoria;