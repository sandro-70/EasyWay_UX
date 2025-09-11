// src/components/Headerr.jsx
import React, { useState, useContext } from "react";
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
import { UserContext } from "./userContext"; // <- ruta correcta

const Headerr = ({ isAdminPage }) => {
  const [reportesMenu, setReportesMenu] = useState(false);

  const navigate = useNavigate();
  const [logMenu, setLogOpen] = useState(false);
  const { user, userRole, loading, isAuthenticated, isAdmin, logout } =
    useContext(UserContext);

  if (loading) return null;
  console.log("Header user", user); // 🔹 aquí

  const handleLogout = () => {
    logout();
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    navigate("/login");
  };

  const fotoUrl = user?.foto_perfil_url ? user.foto_perfil_url : UserIcon; // icono por defecto
  return (
    <div style={{ ...styles.fixedShell, boxShadow: "none" }}>
      <div style={styles.topBar}>
        <img
          src={logo}
          alt="Logo"
          style={styles.logo}
          onClick={() => {
            if (isAuthenticated) {
              if (isAdmin) {
                navigate("/dashboard"); // 🔹 ruta del admin
              } else {
                navigate("/"); // 🔹 ruta del cliente
              }
            } else {
              navigate("/"); // 🔹 por si no está logueado
            }
          }}
        />
        <div style={styles.divBar}>
          <div style={styles.searchWrapper}>
            <button style={styles.iconBtn}>
              <img src={FilterIcon} alt="Filter" style={styles.icon} />
            </button>
            <input
              type="text"
              placeholder="Buscar..."
              style={styles.searchInput}
            />
            <button style={styles.iconBtn}>
              <img src={SearchIcon} alt="Search" style={styles.icon} />
            </button>
          </div>

          {/* carrito habilitado sólo para clientes autenticados (ejemplo) */}
          {isAuthenticated && !isAdmin && (
            <button
              style={styles.SmallWrapper}
              onClick={() => navigate("/carrito")}
            >
              <img src={CartIcon} alt="Carrito" style={styles.icon} />
            </button>
          )}
        </div>

        <div style={styles.user}>
          <button
            style={styles.SmallWrapperUser}
            onClick={() => setLogOpen((prev) => !prev)}
          >
            <img src={fotoUrl} alt="User" style={styles.iconUser} />
          </button>
          <span>
            {isAuthenticated ? `Bienvenido, ${userRole}` : "Invitado"}
          </span>

          {logMenu && (
            <div style={styles.dropdown}>
              {/* Si está logueado */}
              {isAuthenticated ? (
                <>
                  {/* Perfil: visible para todos los logueados, o sólo admin si quieres */}
                  <Link
                    to={isAdmin ? "/EditarPerfilAdmin" : "/miPerfil"}
                    style={styles.dropdownLink}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#D8572F")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    Ver mi Perfil
                  </Link>

                  {/* Opciones admin-only */}
                  {isAdmin && (
                    <>
                      <Link
                        to="/gestionProductos"
                        style={styles.dropdownLink}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#D8572F")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "transparent")
                        }
                      >
                        Gestión de Productos
                      </Link>
                    </>
                  )}

                  <button
                    type="button"
                    style={{ ...styles.dropdownLink, textAlign: "left" }}
                    onClick={handleLogout}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#D8572F")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                // Si NO está logueado
                <Link
                  to="/login"
                  style={styles.dropdownLink}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#D8572F")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BottomBar sólo clientes (no admin ni invitado) */}
      {!isAdmin && (
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
                style={{
                  ...styles.navLink,
                  background: "none",
                  border: "none",
                }}
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
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#D8572F")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    Historial de Compras
                  </Link>

                  <Link
                    to="/reportes/ventas"
                    style={styles.dropdownLink}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#D8572F")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    Descuents aplicados
                  </Link>

                  <Link
                    to="/SistemaValoracion"
                    style={styles.dropdownLink}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#D8572F")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
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
  SmallWrapper: {
    backgroundColor: "white",
    border: "1px solid #2b6daf",
    borderRadius: "20px",
    width: "50px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
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
    borderRadius: "50%", // 🔹 hace la imagen redonda
    objectFit: "cover", // 🔹 mantiene proporción y recorta si es necesario
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
    top: "55px", // justo debajo del bottom bar
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
