// src/components/Headerr.jsx
import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
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
import axiosInstance from "../api/axiosInstance";

/* =================== Helpers de URL para foto (alineados con MiPerfil) =================== */
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
    ? `${BACKEND_ORIGIN}/api/images/fotoDePerfil/${encodeURIComponent(fileName)}`
    : "";

const toPublicFotoSrc = (nameOrPath) => {
  if (!nameOrPath) return "";
  const s = String(nameOrPath);
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/api/images/")) return `${BACKEND_ORIGIN}${encodeURI(s)}`;
  if (s.startsWith("/images/")) return `${BACKEND_ORIGIN}/api${encodeURI(s)}`;
  if (s.startsWith("/")) return `${BACKEND_ORIGIN}${encodeURI(s)}`;
  return backendImageUrl(s);
};

const withBuster = (url, rev) =>
  !url || !rev ? url || "" : url.includes("?") ? `${url}&t=${rev}` : `${url}?t=${rev}`;

const fileNameFromPath = (p) => (!p ? "" : String(p).split("/").pop());
const getUserId = (u) => u?.id_usuario ?? u?.id ?? u?.usuario_id ?? u?.userId ?? null;

function AvatarImg({ user, size = 40 }) {
  const [idx, setIdx] = useState(0);
  const candidates = useMemo(() => {
    const list = [];
    const raw = user?.foto_perfil_url || user?.foto_perfil || user?.foto || "";
    if (raw) list.push(toPublicFotoSrc(fileNameFromPath(raw)));
    const id = getUserId(user);
    if (id) {
      ["png", "jpg", "jpeg", "webp"].forEach((ext) =>
        list.push(backendImageUrl(`user_${id}.${ext}`))
      );
    }
    return [...new Set(list.filter(Boolean))];
  }, [user]);

  const src = useMemo(() => {
    const rev = user?.avatar_rev || user?.updated_at || user?.updatedAt || 0;
    return withBuster(candidates[idx] || "", rev);
  }, [candidates, idx, user?.avatar_rev, user?.updated_at, user?.updatedAt]);

  useEffect(() => {
    setIdx(0);
  }, [user?.foto_perfil_url, user?.avatar_rev, user?.updated_at, user?.updatedAt]);

  if (!candidates.length) {
    return (
      <img
        src={UserIcon}
        alt="User"
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }}
      />
    );
  }

  return (
    <img
      src={src || UserIcon}
      alt="User"
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }}
      onError={() => {
        setIdx((i) => (i + 1 < candidates.length ? i + 1 : i));
      }}
    />
  );
}

/* ========================================================================================== */

const Headerr = () => {
  const [reportesMenu, setReportesMenu] = useState(false);
  const [logMenu, setLogOpen] = useState(false);
  const navigate = useNavigate();

  const { cartCount, setCount } = useCart();
  const { user, userRole, loading, isAuthenticated, isAdmin, logout } =
    useContext(UserContext);

  const isCliente = isAuthenticated && !isAdmin;

  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (logMenu && userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setLogOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [logMenu]);

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

  if (loading) return null;

  return (
    <div style={{ ...styles.fixedShell, boxShadow: "none" }}>
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
          {/* La barra de búsqueda solo se muestra si NO es un administrador */}
          {!isAdmin && (
            <div style={styles.searchWrapper}>
              <button style={styles.iconBtn}>
                <img src={FilterIcon} alt="Filter" style={styles.icon} />
              </button>
              <input type="text" placeholder="Buscar..." style={styles.searchInput} />
              <button style={styles.iconBtn}>
                <img src={SearchIcon} alt="Search" style={styles.icon} />
              </button>
            </div>
          )}

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

        <div style={styles.user} ref={userMenuRef}>
          <button style={styles.SmallWrapperUser} onClick={() => setLogOpen((prev) => !prev)}>
            <AvatarImg user={user} size={40} />
          </button>
          <span>
            {isAuthenticated ? `${user?.nombre || "Usuario"}` : "Invitado"}
          </span>
          {logMenu && (
            <div style={styles.dropdown}>
              <div style={styles.dropdownCaret} />
              {isAuthenticated ? (
                <>
                  <div style={styles.userHeader}>
                    <span style={styles.hello}>Hola,</span>
                    <span style={styles.fullName}>
                      {(user?.nombre || "")} {(user?.apellido || "")}
                    </span>
                  </div>
                  <div style={styles.headerDivider} />
                  <Link
                    to={isAdmin ? "/EditarPerfilAdmin" : "/miPerfil"}
                    style={styles.actionItem}
                    onClick={() => setLogOpen(false)} // Nuevo: Cierra el menú al hacer clic en este enlace
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    Ver mi Perfil
                  </Link>
                  <button
                    type="button"
                    style={{ ...styles.actionItem, textAlign: "left" }}
                    onClick={() => {
                      handleLogout();
                      setLogOpen(false); // Asegura que el menú se cierra
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  style={styles.actionItem}
                  onClick={() => setLogOpen(false)} // Nuevo: Cierra el menú al hacer clic en este enlace
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

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
                  <Link to="/HistorialCompras" style={styles.dropdownLink}>
                    Historial de Compras
                  </Link>
                  <Link to="/descuentos_aplicados" style={styles.dropdownLink}>
                    Descuentos aplicados
                  </Link>
                  <Link to="/SistemaValoracion" style={styles.dropdownLink}>
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
  SmallWrapperUser: {
    backgroundColor: "transparent",
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    borderRadius: "50%",
  },
  user: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "white",
    cursor: "pointer",
    height: "20px",
    width: "300px",
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 15px)",
    right: 78,
    width: 220,
    backgroundColor: "#fff",
    color: "#0f172a",
    borderRadius: 12,
    boxShadow: "0 14px 28px rgba(15, 23, 42, .18)",
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    zIndex: 1000,
    border: "1px solid #e5e7eb",
  },
  dropdownCaret: {
    position: "absolute",
    top: -6,
    left: 14,
    width: 12,
    height: 12,
    background: "#fff",
    borderLeft: "1px solid #e5e7eb",
    borderTop: "1px solid #e5e7eb",
    transform: "rotate(45deg)",
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
  userHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: "6px 8px",
    gap: 6,
  },
  hello: {
    color: "#64748b",
    fontWeight: 600,
  },
  fullName: {
    fontSize: 16,
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  headerDivider: {
    height: 1,
    background: "linear-gradient(to right, transparent, #e5e7eb 15%, #e5e7eb 85%, transparent)",
    margin: "4px 0 6px",
  },
  actionItem: {
    width: "100%",
    textAlign: "left",
    padding: "9px 10px",
    borderRadius: 8,
    textDecoration: "none",
    color: "#0f172a",
    fontSize: 16,
    cursor: "pointer",
    background: "transparent",
    border: "none",
    display: "block",
    transition: "background .15s ease",
  },
  dropdownLinkHover: { background: "#f8fafc" },
};

export default Headerr;