import React, { useRef, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Autoplay } from "swiper/modules";
import { useNavigate } from "react-router-dom";
import { getAllProducts } from "../api/InventarioApi";
import { ObtenerCategoria, ListarCategoria } from "../api/CategoriaApi";
import { AddNewCarrito, ViewCar, SumarItem } from "../api/CarritoApi";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/autoplay";

import carrot from "../images/carrot.png";
import apple from "../images/apple.png";
import pet from "../images/pet.png";
import ham from "../images/ham.png";
import cake from "../images/cake.png";
import bread from "../images/bread.png";
//import juice from "../images/juice.png";
import clean from "../images/clean.png";
import soccer from "../images/soccer.png";
import phone from "../images/phone.png";
import pharmacy from "../images/pharmacy.png";
//import milk from "../images/milk.png";
import arrowL from "../images/arrowL.png";
import arrowR from "../images/arrowR.png";
import appleImage from "../images/appleImage.png";
//import coffee from "../images/coffee.png";
import banner1 from "../images/banner1.png";
import banner2 from "../images/banner2.png";
import banner3 from "../images/banner3.png";

const banners = [
  {idCategoriaEnDescuento: 1, imagen: banner1},
  {idCategoriaEnDescuento: 2, imagen: banner2},
  {idCategoriaEnDescuento: 3, imagen: banner3}
];

const InicioUsuario = () => {
  const navigate = useNavigate();

  const catRef = useRef(null);
  const prodRefDestacados = useRef(null);
  const prodRefTendencias = useRef(null);
  const swiperRef = useRef(null);

  const [hoveredIndex, setHoveredIndex] = React.useState(null);
  const [hoveredProductDest, setHoveredProductDest] = React.useState(null);
  const [hoveredProductTrend, setHoveredProductTrend] = React.useState(null);
  const [hoveredBanner, setHoveredBanner] = React.useState(null);

  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await getAllProducts();
        console.log(res.data);
        setProducts(res.data);
      } catch (err) {
        console.error("[PRODUCTS] error:", err?.response?.data || err);
        alert(err?.response?.data?.message || "Error al cargar productos");
      }
    };

    fetchProducts();
  }, []);

  const [categoriesData, setCategoriesData] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await ListarCategoria();
        setCategoriesData(res.data);
        console.log(res.data);
      } catch (err) {
        console.error("[CATEGORIES] error:", err?.response?.data || err);
        alert(err?.response?.data?.message || "Error al cargar categorías");
      }
    };
    fetchCategories();
  }, []);

  const [carrito, setCarrito] = useState([]);

  const handleAgregar = async (id_producto) => {
    if (!id_producto) {
      alert("ID de producto no válido");
      return;
    }

    try {
      console.log("Agregando producto:", id_producto);

      let carritoActual = null;
      let carritoVacio = false;

      try {
        carritoActual = await ViewCar();
        console.log("Carrito actual:", carritoActual.data);
      } catch (error) {
        if (error?.response?.status === 404) {
          console.log("Carrito vacío - usuario nuevo");
          carritoVacio = true;
        } else {
          throw error;
        }
      }

      let existe = false;
      if (!carritoVacio && carritoActual?.data) {
        const items = carritoActual.data.carrito_detalles || carritoActual.data;
        existe = Array.isArray(items)
          ? items.find((item) => item.id_producto === id_producto)
          : false;
      }

      let response;

      if (existe) {
        console.log("Producto existe, sumando cantidad...");
        response = await SumarItem(id_producto, 1);
        console.log("Sumado", response.data);
        alert(`Se aumentó la cantidad del producto`);
      } else {
        console.log("Producto nuevo o carrito vacío, agregando...");
        response = await AddNewCarrito(id_producto, 1);
        console.log("Agregado", response.data);
        alert(`Producto agregado al carrito`);
      }

      try {
        const actualizado = await ViewCar();
        setCarrito(actualizado.data);
      } catch (error) {
        console.log(
          "No se pudo recargar el carrito, pero el producto se agregó"
        );
      }
    } catch (error) {
      console.error("Error completo:", error);
      console.error("Respuesta del servidor:", error?.response?.data);

      const errorMessage =
        error?.response?.data?.msg ||
        error?.response?.data?.message ||
        error?.message ||
        "No se pudo procesar el carrito";

      alert(errorMessage);
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/producto/${productId}`);
  };

  const handleCategoryClick = (categoryId) => {
    navigate(`/categoria/${categoryId}`);
  };

  const scroll = (direction, ref, itemWidth) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === "left" ? -itemWidth : itemWidth,
        behavior: "smooth",
      });
    }
  };

  return (
    <div
      className="p-4"
      style={{ ...styles.fixedShell, backgroundColor: "#F5F5F5" }}
    >
      {/* Categories */}
      <div style={styles.scrollWrapper}>
        <button
          style={styles.arrow}
          onClick={() => scroll("left", catRef, 140)}
        >
          <img
            src={arrowL}
            alt="left"
            style={{ width: "100%", height: "100%" }}
          />
        </button>
<div style={styles.divCat} ref={catRef}>
  {(categoriesData ?? []).map((cat, index) => {
    const file = cat?.imagenes?.[0]?.url_imagen; // ✅ nunca truena
    const src = file
      ? `/images/categorias/${file}`
      : "/images/PlaceHolder.png"; // tu placeholder

    return (
      <div key={cat?.id_categoria ?? index} style={styles.catItem}>
        <div
          style={{
            ...styles.CategoriesBox,
            border:
              hoveredIndex === index
                ? "2px solid #2b6daf"
                : "2px solid transparent",
            transform:
              hoveredIndex === index ? "scale(1.05)" : "scale(1)",
            transition: "all 0.2s ease-in-out",
          }}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={() => handleCategoryClick(cat?.id_categoria)}
        >
          <img
          src={
            cat?.icono_categoria
              ? `/images/categorias/${cat.icono_categoria}`
              : "/PlaceHolder.png"
          }
          alt={cat?.nombre ?? "Categoría"}
          style={{ width: 70, height: 70, objectFit: "contain" }}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/PlaceHolder.png";
          }}
        />
                </div>
                <span style={styles.catTitle}>{cat?.nombre ?? "-"}</span>
              </div>
            );
          })}
        </div>
        <button
          style={styles.arrow}
          onClick={() => scroll("right", catRef, 140)}
        >
          <img
            src={arrowR}
            alt="right"
            style={{ width: "100%", height: "100%" }}
          />
        </button>
      </div>

      {/* Banner - Fixed Swiper */}
      <div style={{ position: "relative", margin: "40px 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Left button */}
        <button 
          className="arrow-button" 
          style={{ 
            position: "absolute", 
            left: 0, 
            zIndex: 10,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            width: "40px",
            height: "40px"
          }}
          onClick={() => swiperRef.current?.slidePrev()}
        >
          <img
            src={arrowL}
            alt="left"
            style={{ width: "100%", height: "100%" }}
          />
        </button>
        
        {/* Swiper */}
        <div style={{ width: "90%", margin: "0 auto" }}>
          <Swiper
            modules={[EffectCoverflow, Autoplay]}
            effect={"coverflow"}
            centeredSlides={true}
            slidesPerView={1}
            loop={false}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            coverflowEffect={{
              rotate: 0,
              stretch: 0,
              depth: 100,
              modifier: 2.5,
              slideShadows: true,
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
          >
            {banners.map((banner, index) => (
              <SwiperSlide key={index} style={{width: "33.333%", padding: "10px" }}>
                <div onMouseEnter={() => setHoveredBanner(index)}
                  onMouseLeave={() => setHoveredBanner(null)}
                  style={{transform:
                  hoveredBanner === index ? "scale(1.017)" : "scale(1)", transition: "all 0.5s ease-in-out",
                  cursor: "pointer", display: "flex", justifyContent: "center" }}
                  onClick={() => handleCategoryClick(banner.idCategoriaEnDescuento)}>
                  <img
                    src={banner.imagen}
                    alt={banner.categoriaEnDescuento}
                    className="banner-img"
                    style={{
                      width: "100%",
                      height: "350px",
                      borderRadius: "16px",
                      objectFit: "cover",
                    }}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        
        {/* Right button */}
        <button 
          className="arrow-button" 
          style={{ 
            position: "absolute", 
            right: 0, 
            zIndex: 10,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            width: "40px",
            height: "40px"
          }}
          onClick={() => swiperRef.current?.slideNext()}
        >
          <img
            src={arrowR}
            alt="right"
            style={{ width: "100%", height: "100%" }}
          />
        </button>
      </div>

      {/* Productos Destacados */}
      <h2 style={styles.sectionTitle}>Productos Destacados</h2>

      <div style={styles.scrollWrapper}>
        <button
          style={styles.arrow}
          onClick={() => scroll("left", prodRefDestacados, 140)}
        >
          <img
            src={arrowL}
            alt="left"
            style={{ width: "100%", height: "100%" }}
          />
        </button>

        <div style={styles.divProducts} ref={prodRefDestacados}>
          {products.map((p, i) => (
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
              onClick={() => handleProductClick(p.id_producto)}
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
              <p style={styles.productPrice}>{p.precio_base}</p>
              <button
                style={{
                  ...styles.addButton,
                  backgroundColor:
                    hoveredProductDest === i ? "#2b6daf" : "#F0833E",
                }}
                onClick={(e) => {
                  e.stopPropagation();
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
          onClick={() => scroll("right", prodRefDestacados, 140)}
        >
          <img
            src={arrowR}
            alt="right"
            style={{ width: "100%", height: "100%" }}
          />
        </button>
      </div>

      {/* Tendencias del mes */}
      <h2 style={styles.sectionTitle}>Tendencias del mes</h2>

      <div style={styles.scrollWrapper}>
        <button
          style={styles.arrow}
          onClick={() => scroll("left", prodRefTendencias, 140)}
        >
          <img
            src={arrowL}
            alt="left"
            style={{ width: "100%", height: "100%" }}
          />
        </button>

        <div style={styles.divProducts} ref={prodRefTendencias}>
          {products.map((p, i) => (
            <div
              key={i}
              style={{
                ...styles.productBox,
                border:
                  hoveredProductTrend === i
                    ? "2px solid #2b6daf"
                    : "2px solid transparent",
                transform:
                  hoveredProductTrend === i ? "scale(1.05)" : "scale(1)",
                transition: "all 0.2s ease-in-out",
                cursor: "pointer",
              }}
              onMouseEnter={() => setHoveredProductTrend(i)}
              onMouseLeave={() => setHoveredProductTrend(null)}
              onClick={() => handleProductClick(p.id_producto)}
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
              <p style={styles.productPrice}>{p.precio_base}</p>
              <button
                style={{
                  ...styles.addButton,
                  backgroundColor:
                    hoveredProductTrend === i ? "#2b6daf" : "#F0833E",
                }}
                onClick={(e) => {
                  e.stopPropagation();
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
          onClick={() => scroll("right", prodRefTendencias, 140)}
        >
          <img
            src={arrowR}
            alt="right"
            style={{ width: "100%", height: "100%" }}
          />
        </button>
      </div>
    </div>
  );
};

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
  scrollWrapper: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "0 20px",
  },
  divCat: {
    display: "flex",
    gap: "10px",
    overflowX: "auto",
    scrollBehavior: "smooth",
    width: "100%",
    padding: "10px 20px",
    scrollbarWidth: "none",
  },
  catItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "80px",
    flexShrink: 0,
  },
  CategoriesBox: {
    backgroundColor: "white",
    borderRadius: "25px",
    width: "90px",
    height: "90px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.15)",
  },
  catTitle: {
    marginTop: "8px",
    fontSize: "14px",
    color: "#000000ff",
    fontWeight: "400",
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
    gap: "13px",
    overflow: "hidden", // 👈 cambia esto
    scrollBehavior: "smooth",
    width: "100%",
    padding: "10px 10px",
  },
  productBox: {
    flexShrink: 0,
    width: "254px",
    height: "265px",
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
  productImg: {
    width: "90px",
    height: "90px",
    objectFit: "contain",
    marginTop: "8px",
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
    padding: "6px 0",
    cursor: "pointer",
    fontSize: "18px",
  },
  sectionTitle: {
    textAlign: "left",
    padding: "5px 85px",
    marginBottom: "10px",
    fontWeight: "650",
    fontSize: "22px",
  },
};

export default InicioUsuario;