// src/components/Headerr.jsx
import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import CartIcon from "../images/CartIcon.png";
import FilterIcon from "../images/FilterIcon.png";
import logo from "../images/logo.png";
import SearchIcon from "../images/SearchIcon.png";
import UserIcon from "../images/UserIcon.png";
import historialAct from "../images/historialAct.png";
import sistemaVal from "../images/sistemaVal.png";
import reportesPer from "../images/reportesPer.png";
import checkout from "../images/checkout.png";
import soporte from "../images/soporte.png";
import idioma from "../images/idioma.png";
import { ViewCar } from "../api/CarritoApi";
import { UserContext } from "./userContext";
import { useCart } from "../utils/CartContext";

/* ====================== UTILIDAD: nombre/ruta → URL pública ====================== */
// Si sirve desde el mismo host:
const toPublicFotoSrc = (nameOrPath) => {
  if (!nameOrPath) return "";
  const s = String(nameOrPath);
  if (/^https?:\/\//i.test(s) || s.startsWith("/")) return s;
  return `/images/fotoDePerfil/${s}`;
};

// // Si las imágenes viven en un backend distinto, usa esto:
// // const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
// // const toPublicFotoSrc = (nameOrPath) => {
// //   if (!nameOrPath) return "";
// //   const s = String(nameOrPath);
// //   if (/^https?:\/\//i.test(s) || s.startsWith("/")) return s;
// //   return `${API_BASE}/images/fotoDePerfil/${s}`;
// // };

const Headerr = () => {
  const [reportesMenu, setReportesMenu] = useState(false);
  const [logMenu, setLogOpen] = useState(false);
  const navigate = useNavigate();

  const { cartCount, setCount } = useCart();
  const { user, userRole, loading, isAuthenticated, isAdmin, logout } =
    useContext(UserContext);

  const isCliente = isAuthenticated && !isAdmin;

  // Badge del carrito
  useEffect(() => {
    const fetchCartCount = async () => {
      if (!isAuthenticated || isAdmin) return setCount(0);
      try {
        const response = await ViewCar();
        const cart = response.data;
        if (!cart || !cart.carrito_detalles) return setCount(0);
        const total = cart.carrito_detalles.reduce(
          (acc, item) => acc + item.cantidad_unidad_medida,
          0
        );
        setCount(total);
      } catch (err) {
        console.error("Error obteniendo carrito:", err);
        setCount(0);
      }
    };
    if (!loading) fetchCartCount();
  }, [isAuthenticated, isAdmin, loading, setCount]);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    navigate("/login");
  };

  // Normaliza la foto (si solo viene "KennyFotoPerfil.png" → /images/fotoDePerfil/KennyFotoPerfil.png)
  const computedFoto = toPublicFotoSrc(user?.foto_perfil_url);
  const fotoUrl = computedFoto || UserIcon;

  if (loading) return null;

  return (
    <div style={{ ...styles.fixedShell, boxShadow: "none" }}>
      {/* Barra superior */}
      <div style={styles.topBar}>
        <img
          src={logo}
          alt="Logo"
          style={styles.logo}
          onClick={() => {
            if (isAuthenticated) {
              if (isAdmin) navigate("/dashboard");
              else navigate("/");
            } else {
              navigate("/");
            }
          }}
        />

        <div style={styles.divBar}>
          <div style={styles.searchWrapper}>
            <button style={styles.iconBtn}>
              <img src={FilterIcon} alt="Filter" style={styles.icon} />
            </button>
            <input type="text" placeholder="Buscar..." style={styles.searchInput} />
            <button style={styles.iconBtn}>
              <img src={SearchIcon} alt="Search" style={styles.icon} />
            </button>
          </div>

          {/* 🛒 Carrito: solo clientes autenticados */}
          {isCliente && (
            <button
              style={{
                position: "relative",
                border: "none",
                background: "white",
                borderRadius: "50%",
                width: 50,
                height: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                cursor: "pointer",
              }}
              onClick={() => navigate("/carrito")}
            >
              <img src={CartIcon} alt="Carrito" style={{ width: 28, height: 28, objectFit: "contain" }} />
              {cartCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -1,
                    right: -6,
                    minWidth: 24,
                    height: 24,
                    backgroundColor: "red",
                    color: "white",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: "bold",
                    padding: "0 5px",
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Usuario */}
        <div style={styles.user}>
          <button style={styles.SmallWrapperUser} onClick={() => setLogOpen((prev) => !prev)}>
            <img
              src={fotoUrl}
              alt="User"
              style={styles.iconUser}
              onError={(e) => {
                e.currentTarget.src = UserIcon; // Fallback si la URL no carga
              }}
            />
          </button>
          <span>
            {isAuthenticated
              ? isAdmin
                ? "Bienvenido, Administrador"
                : `Bienvenido, ${userRole}`
              : "Invitado"}
          </span>

          {logMenu && (
            <div style={styles.dropdown}>
              {isAuthenticated ? (
                <>
                  <Link
                    to={isAdmin ? "/EditarPerfilAdmin" : "/miPerfil"}
                    style={styles.dropdownLink}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#D8572F")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    Ver mi Perfil
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/gestionProductos"
                      style={styles.dropdownLink}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#D8572F")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      Gestión de Productos
                    </Link>
                  )}

                  <button
                    type="button"
                    style={{ ...styles.dropdownLink, textAlign: "left" }}
                    onClick={handleLogout}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#D8572F")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  style={styles.dropdownLink}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#D8572F")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 📌 BottomBar: solo clientes */}
      {isCliente && (
        <div style={styles.bottomBar}>
          <nav style={styles.nav} aria-label="Categorías">
            <a href="#" style={styles.navLink}>
              <img src={historialAct} alt="" style={styles.navIcon} />
              Historial
            </a>
            <a href="#" style={styles.navLink}>
              <img src={sistemaVal} alt="" style={styles.navIcon} />
              Sistema de Valoración
            </a>
            <div style={{ position: "relative" }}>
              <button
                style={{ ...styles.navLink, background: "none", border: "none" }}
                onClick={() => setReportesMenu((prev) => !prev)}
              >
                <img src={reportesPer} alt="" style={styles.navIcon} />
                Reportes Personales
              </button>

              {reportesMenu && (
                <div style={styles.dropdownReportes}>
                  <Link
                    to="/reportes/compras"
                    style={styles.dropdownLink}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#D8572F")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    Historial de Compras
                  </Link>
                  <Link
                    to="/reportes/ventas"
                    style={styles.dropdownLink}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#D8572F")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    Descuentos aplicados
                  </Link>
                  <Link
                    to="/SistemaValoracion"
                    style={styles.dropdownLink}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#D8572F")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    Resumen de Actividad
                  </Link>
                </div>
              )}
            </div>

            <a href="#" style={styles.navLink}>
              <img src={checkout} alt="" style={styles.navIcon} />
              Checkout
            </a>
            <a href="#" style={styles.navLink}>
              <img src={soporte} alt="" style={styles.navIcon} />
              Soporte
            </a>
            <a href="#" style={styles.navLink}>
              <img src={idioma} alt="" style={styles.navIcon} />
              Idioma
            </a>
          </nav>
        </div>
      )}
    </div>
  );
};

const styles = {
  fixedShell: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    zIndex: 1000,
    backgroundColor: "#5baed6",
    display: "flex",
    flexDirection: "column",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    height: "90px",
    background: "linear-gradient(to right, #2B6DAF, #2AA6E0)",
    width: "100%",
  },
  divBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "90px",
    width: "600px",
  },
  logo: {
    height: "60px",
    margin: "0 50px",
    objectFit: "contain",
    cursor: "pointer",
  },
  searchWrapper: {
    display: "flex",
    alignItems: "center",
    flex: 1,
    width: "500px",
    margin: "0 20px",
    backgroundColor: "white",
    borderRadius: "25px",
    border: "1px solid #2b6daf",
    padding: "5px 10px",
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    padding: "5px 10px",
    fontSize: "14px",
  },
  iconBtn: {
    background: "none",
    border: "none",
    padding: "0 5px",
    cursor: "pointer",
  },
  icon: {
    height: "20px",
    width: "20px",
  },
  iconUser: {
    height: "40px",
    width: "40px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  SmallWrapperUser: {
    backgroundColor: "transparent",
    width: "50px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  user: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    color: "white",
    cursor: "pointer",
    height: "20px",
    width: "250px",
  },
  dropdown: {
    position: "absolute",
    top: "75px",
    right: "135px",
    width: "170px",
    backgroundColor: "white",
    color: "black",
    borderRadius: "25px",
    boxShadow: "10px 10px 10px rgba(0,0,0,0.15)",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    zIndex: 1000,
    border: "2px solid #2b6daf",
  },
  dropdownLink: {
    padding: "8px 12px",
    borderRadius: "8px",
    textDecoration: "none",
    color: "black",
    transition: "background 0.3s, color 0.3s",
  },
  dropdownReportes: {
    position: "absolute",
    top: "55px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "200px",
    backgroundColor: "white",
    color: "black",
    borderRadius: "15px",
    boxShadow: "5px 5px 10px rgba(0,0,0,0.15)",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    zIndex: 1000,
    border: "2px solid #2b6daf",
  },
  bottomBar: {
    backgroundColor: "#004985",
    height: "55px",
    display: "flex",
    alignItems: "center",
    padding: "0",
    margin: "0",
    width: "100%",
  },
  nav: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    width: "100%",
    height: "100%",
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    textDecoration: "none",
    color: "white",
    height: "100%",
    width: "100%",
    transition: "background 0.3s, color 0.3s",
  },
  navIcon: {
    width: "40px",
    height: "40px",
    objectFit: "contain",
  },
};

export default Headerr;
