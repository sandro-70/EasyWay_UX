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

function Categoria() {
  const navigate = useNavigate();

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

  const agregarAComparar = (producto) => {
    setProductosParaComparar((prev) => {
      // Si el producto ya está en la lista, lo removemos
      const exists = prev.find((p) => p.id_producto === producto.id_producto);
      if (exists) {
        return prev.filter((p) => p.id_producto !== producto.id_producto);
      }

      // Si ya hay 2 productos, reemplazamos el primero
      if (prev.length >= 2) {
        return [prev[1], producto];
      }

      // Agregamos el producto
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
  }, [products, selectedSubcategorias, priceRange, selectedMarca]);

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
      } else {
        console.log("Producto nuevo, agregando al carrito");

        // Agregar nuevo producto
        await AddNewCarrito(id_producto, 1);

        // Recargar carrito completo para obtener el nuevo producto
        const carritoActualizado = await ViewCar();
        const nuevosDetalles = carritoActualizado.data.carrito_detalles ?? [];
        setCarrito(nuevosDetalles);

        alert(`Producto agregado al carrito`);
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
        {/* Sidebar Sub-categorias */}
        <div className="flex flex-col h-[578px] fixed w-[265px] gap-1 ">
          {/* Sub-categoria */}
          <div className="border-gray-300 border-2 space-y-1 px-4 py-2 rounded-md">
            <h1 className="header">Sub-categoria</h1>

            <ul className="overflow-y-auto h-20">
              {subcategorias.length > 0 ? (
                subcategorias.map((sub, i) => {
                  const subcategoriaId = sub.id || sub.id_subcategoria;
                  const isChecked =
                    selectedSubcategorias.includes(subcategoriaId);

                  return (
                    <li key={subcategoriaId || i}>
                      <div className="flex flex-row gap-2 items-center">
                        <Checkbox
                          color="secondary"
                          size="medium"
                          checked={isChecked}
                          onChange={(e) =>
                            handleSubcategoriaChange(
                              subcategoriaId,
                              e.target.checked
                            )
                          }
                          sx={{
                            color: "",
                            "&.Mui-checked": { color: "#114C87" },
                          }}
                        />
                        <p>{sub.nombre || `Subcategoría ${i + 1}`}</p>
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="text-gray-500 text-sm">
                  No hay subcategorías disponibles
                </li>
              )}
            </ul>

            <h1 className="header">Marca</h1>
            <select
              className="w-full border-gray-300 border-2 rounded-md py-1 px-2 focus:outline-none focus:border-blue-500"
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
          </div>

          {/* Precio */}
          <div className="border-gray-300 border-2  py-2 space-y-1 rounded-md">
            <h1 className="header px-4">Precio</h1>
            <div className=" flex flex-col px-4">
              <Slider
                value={priceRange}
                onChange={handlePriceChange}
                min={minPrice}
                max={maxPrice}
                step={1}
                valueLabelDisplay="auto"
                className=""
                sx={{
                  color: "green",
                  "& .MuiSlider-thumb": {
                    backgroundColor: "#2b6daf",
                  },
                  "& .MuiSlider-rail": {
                    opacity: 1,
                    backgroundColor: "#D4D3D2",
                  },
                  "& .MuiSlider-track": {
                    backgroundColor: "#2b6daf",
                    border: "#2b6daf",
                  },
                }}
              />
              <div className="flex flex-row w-full">
                <p className="text-left">L.{minPrice}</p>
                <p className="ml-auto">L.{maxPrice}</p>
              </div>
              <div className="flex flex-row w-full justify-between text-sm text-gray-600 mt-1">
                <p>L.{priceRange[0]}</p>
                <p>L.{priceRange[1]}</p>
              </div>
            </div>
            <div className="flex flex-row gap-2 text-[14px] font-medium px-1">
              <button
                className="bg-white border-2 border-gray-300 rounded-md h-[38px] whitespace-nowrap px-1 hover:bg-gray-100 transition-colors"
                onClick={() => handleQuickPriceFilter("menos10")}
              >
                Menos 10L
              </button>
              <button
                className="bg-white border-2 border-gray-300 rounded-md h-[38px] whitespace-nowrap px-1 hover:bg-gray-100 transition-colors"
                onClick={() => handleQuickPriceFilter("menos50")}
              >
                Menos 50L
              </button>
              <button
                className="bg-white border-2 border-gray-300 rounded-md h-[38px] whitespace-nowrap px-1 hover:bg-gray-100 transition-colors"
                onClick={() => handleQuickPriceFilter("mas100")}
              >
                Mas 100L
              </button>
            </div>
          </div>

          {/* Ordenar Por */}
          <div className="border-gray-300 border-2 px-2 py-2 pb-4 space-y-1 rounded-md">
            <h1 className="header">Ordenar por</h1>
            <div className="flex flex-col border-gray-300 bg-gray-200 border-2 rounded-md py-1">
              <button
                className={`${orderby === "Relevancia" ? "bg-[#D8DADC]" : ""}`}
                onClick={(e) => setOrder(e.target.innerText)}
              >
                Relevancia
              </button>
              <button
                className={`${
                  orderby === "Mas Vendidos" ? "bg-[#D8DADC]" : ""
                }`}
                onClick={(e) => setOrder(e.target.innerText)}
              >
                Mas Vendidos
              </button>
              <button
                className={`${orderby === "Novedades" ? "bg-[#D8DADC]" : ""}`}
                onClick={(e) => setOrder(e.target.innerText)}
              >
                Novedades
              </button>
            </div>
          </div>

          {/* Botón de comparar */}
          <div className="relative flex flex-col items-center gap-2">
            <button
              onClick={agregarComparar}
              className={`px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-md transition-colors duration-300
              ${
                stateProducto === "Agregar"
                  ? "bg-[#2B6DAF] hover:bg-[#1f4e7f]"
                  : "bg-[#80838A] "
              }
            `}
            >
              {btnCompare}
            </button>

            {/* Botón para comparar cuando hay productos seleccionados */}
            {stateProducto === "Comparar" &&
              productosParaComparar.length >= 2 && (
                <button
                  onClick={iniciarComparacion}
                  className="px-6 py-2 rounded-xl bg-[#2B6DAF] text-white text-sm font-semibold shadow-md hover:bg-[#1f4e7f] transition-colors duration-300"
                >
                  COMPARAR
                </button>
              )}
          </div>
        </div>

        {/* Display Productos */}
        <div className="w-full ml-[285px] mr-[20px]">
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
};

export default Categoria;
