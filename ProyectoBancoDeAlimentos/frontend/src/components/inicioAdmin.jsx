import React, { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Autoplay } from "swiper/modules";
import { useState } from "react";
import Sidebar from "../sidebar";
import Headerr from "../components/Headerr"; // o donde esté tu componente Headerr

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

const categories = [
  //{ name: "Lácteos", icon: milk },
  { name: "Farmacia", icon: pharmacy },
  { name: "Electrónico", icon: phone },
  { name: "Deportes", icon: soccer },
  { name: "Limpieza", icon: clean },
  //{ name: "Bebidas", icon: juice },
  { name: "Panadería", icon: bread },
  { name: "Repostería", icon: cake },
  { name: "Embutidos", icon: ham },
  { name: "Mascotas", icon: pet },
  { name: "Frutas", icon: apple },
  { name: "Verduras", icon: carrot },
  //{ name: "Granos", icon: coffee },
];

const products = [
  { name: "Manzana", price: "L. 10.00", img: appleImage },
  { name: "Manzana", price: "L. 10.00", img: appleImage },
  { name: "Manzana", price: "L. 10.00", img: appleImage },
  { name: "Manzana", price: "L. 10.00", img: appleImage },
  { name: "Manzana", price: "L. 10.00", img: appleImage },
  { name: "Manzana", price: "L. 10.00", img: appleImage },
  { name: "Manzana", price: "L. 10.00", img: appleImage },
  { name: "Manzana", price: "L. 10.00", img: appleImage },
  { name: "Manzana", price: "L. 10.00", img: appleImage },
];

const banners = [banner1, banner3, banner2];

const InicioAdmin = () => {
  const catRef = useRef(null);
  const prodRefDestacados = useRef(null);
  const prodRefTendencias = useRef(null);
  const [moveButton, setLeft] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const [hoveredIndex, setHoveredIndex] = React.useState(null);
  const [hoveredProductDest, setHoveredProductDest] = React.useState(null);
  const [hoveredProductTrend, setHoveredProductTrend] = React.useState(null);
  const handleClick = () => {
    setLeft(!moveButton);
    setShowSidebar(!showSidebar);
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
      className=""
      style={{ ...styles.fixedShell, backgroundColor: "#F5F5F5" }}
    >
      <div className="">
        {showSidebar && <Sidebar />}
        <button
          onClick={handleClick}
          className={`btn_sidebar ${moveButton ? "left-[186px]" : "left-2"}`}
        >
          <span className="material-symbols-outlined text-[42px] text-white">
            menu
          </span>
        </button>
        <Headerr isAdminPage={true} />
      </div>
      {/* Categories */}
      <div className="mt-4" style={styles.scrollWrapper}>
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
          {categories.map((cat, index) => (
            <div key={index} style={styles.catItem}>
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
              >
                <img src={cat.icon} alt={cat.name} />
              </div>
              <span style={styles.catTitle}>{cat.name}</span>
            </div>
          ))}
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

      {/* Banner */}
      <div style={{ margin: "40px 0" }}>
        <Swiper
          modules={[EffectCoverflow, Autoplay]}
          effect="coverflow"
          centeredSlides={false}
          slidesPerView={3}
          loop={true}
          autoplay={{ delay: 3000 }}
          coverflowEffect={{
            rotate: 0,
            stretch: 0,
            depth: 100,
            modifier: 2.5,
            slideShadows: true,
          }}
          style={{ padding: "20px 0" }}
        >
          {banners.map((banner, index) => (
            <SwiperSlide key={index}>
              <img
                src={banner}
                alt={`banner-${index}`}
                style={{
                  width: "100%",
                  height: "300px",
                  borderRadius: "16px",
                  objectFit: "cover",
                }}
              />
            </SwiperSlide>
          ))}
        </Swiper>
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
              }}
              onMouseEnter={() => setHoveredProductDest(i)}
              onMouseLeave={() => setHoveredProductDest(null)}
            >
              <div style={styles.topRow}>
                <span style={styles.badge}>Oferta</span>
                <div style={styles.stars}>
                  <span style={styles.stars}>
                    {Array.from({ length: 3 }, (_, i) => (
                      <span
                        key={i}
                        style={{
                          color: i < p.valoracion ? "#2b6daf" : "#ddd",
                          fontSize: "25px",
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </span>
                </div>
              </div>

              <img src={p.img} alt={p.name} style={styles.productImg} />
              <p style={styles.productName}>{p.name}</p>
              <p style={styles.productPrice}>{p.price}</p>
              <button
                style={{
                  ...styles.addButton,
                  backgroundColor:
                    hoveredProductDest === i ? "#2b6daf" : "#F0833E",
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
              }}
              onMouseEnter={() => setHoveredProductTrend(i)}
              onMouseLeave={() => setHoveredProductTrend(null)}
            >
              <div style={styles.topRow}>
                <span style={styles.badge}>Oferta</span>
                <div style={styles.stars}>
                  <span style={styles.stars}>
                    {Array.from({ length: 3 }, (_, i) => (
                      <span
                        key={i}
                        style={{
                          color: i < p.valoracion ? "#2b6daf" : "#ddd",
                          fontSize: "25px",
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </span>
                </div>
              </div>

              <img src={p.img} alt={p.name} style={styles.productImg} />
              <p style={styles.productName}>{p.name}</p>
              <p style={styles.productPrice}>{p.price}</p>
              <button
                style={{
                  ...styles.addButton,
                  backgroundColor:
                    hoveredProductTrend === i ? "#2b6daf" : "#F0833E",
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
      <img
        src="/images/pinguino-pendejo-bailando-a-lo-focker.gif"
        alt="Cargando"
      />
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
    overflowX: "auto",
    scrollBehavior: "smooth",
    width: "100%",
    scrollbarWidth: "none",
    padding: "10px 10px",
  },
  productBox: {
    flexShrink: 0,
    width: "260px",
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

export default InicioAdmin;
