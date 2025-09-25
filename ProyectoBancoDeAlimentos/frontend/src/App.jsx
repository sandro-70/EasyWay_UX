// src/App.jsx
import "./App.css";
import { Routes, Route } from "react-router-dom";

import Dashboard from "./dashboard.jsx";
import Login from "./login.jsx";
import Crear_cuenta from "./crear_cuenta.jsx";
import ForgotPassword from "./forgot_password.jsx";
import Cambiar_contraseña from "./cambiar_contraseña.jsx";
import InicioUsuario from "./components/inicioUsuario.jsx";
import InicioAdmin from "./components/inicioAdmin.jsx";
import GestionProductos from "./gestionProductos.jsx";
import Headerr from "./components/Headerr";
import Inventario from "./pages/Inventario.jsx";
import EditarPerfilAdmin from "./pages/EditMiPerfil.jsx";
import MiPerfil from "./miPerfil.jsx";
import MisPedidos from "./misPedidos.jsx";
import PedidoEmergente from "./components/pedidoEmergente.jsx";
import MetodoPago from "./metodoPago.jsx";
import TestAuth from "./pages/PruebaDeRoutes.jsx";
import HistorialPedido from "./pages/HistorialPedido.jsx";
import MisDirecciones from "./misDirecciones.jsx";
import AgregarCarrito from "./components/agregarCarrito.jsx";
import CompararProducto from "./components/compararProducto.jsx";
import GestionCupones from "./components/gestionCupones.jsx";
import UserManagementViews from "./UserManagementViews.jsx";
import MisCupones from "./misCupones.jsx";
import Verificacion from "./components/verificacion.jsx";
import CampanaPromocional from "./components/campanaPromocional.jsx";
import Carrito from "./carrito.jsx";
import VerificarCodigoAuth from "./verificarCofigoAthenticador.jsx";
import VerificarCodigo from "./verificarcodigo.jsx";
import { UserProvider } from "./components/userContext";
import DetalleFactura from "./pages/DetalleFactura.js";
import Facturas from "./pages/Facturas.js";
import NotFoundpage from "./notFoundPage.jsx";
import TablaVentas from "./tablaReportesVentas.jsx";
import LayoutSidebar from "./layoutSidebar.jsx";
import AsignarDescuentos from "./asignarDescuentos.jsx";
import TablaPromociones from "./tablaReportesPromociones.jsx";
import SistemaValoracion from "./SistemaValoracion.jsx";
import Historial from "./Historial.jsx";
import PersonalizacionReportes from "./PersonalizacionReportes.jsx";
import DescuentosAplicados from "./descuentos_aplicados.jsx";
import Categoria from "./categoria.jsx";
import Promocion from "./promocion.jsx";
import HistorialCompras from "./HistorialCompras.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import ReportesPedidos from "./pages/ReportesPedidos.jsx";
import DetallePedido from "./components/DetallePedido.js";
import ReportesInventario from "./pages/ReportesInventario.jsx";
import MenuPromociones from "./MenuPromociones.jsx";
import ReporteUsuarioAdmin from "./reporteUsuariosAdmin.jsx";
import "./i18n.js";
import Vista from "./components/VistaTranslate.jsx";
import Reportes from "./components/ReporteCarrousel.jsx";
import DetallePedidos from "./pages/DetallesPedido.jsx";
import GestionDePedido from "./components/GestionPedidos.jsx";
import ConfigBanner from "./configBanner.jsx";
import { SearchProvider } from "./searchContext.jsx";
// Mejora compatible (tu compañerx): mantenida bajo tu esquema
import ListaDeDeseos from "./pages/ListaDeDeseos.jsx";
import CampanasView from "./components/CampanasView.jsx";
import CampanaDetalleModal from "./components/CampanaDetalleModal.jsx";
import ProcesoCompra from "./procesoCompra.jsx";
const HEADER_HEIGHT = 60; // px

function App() {
  return (
    <UserProvider>
      <SearchProvider>
        <div className="App">
          <Headerr />

          <div style={{ marginTop: `${HEADER_HEIGHT}px` }}>
            <Routes>
              {/* ---------- PÚBLICAS ---------- */}
              <Route path="/" element={<InicioUsuario />} />
              <Route path="/crear_cuenta" element={<Crear_cuenta />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot_password" element={<ForgotPassword />} />
              <Route
                path="/cambiar_contraseña"
                element={<Cambiar_contraseña />}
              />
              <Route path="/facturas" element={<Facturas />} />
              <Route path="/factura/:id" element={<DetalleFactura />} />
              <Route path="/verificar-codigo" element={<VerificarCodigo />} />
              <Route
                path="/verificar-codigoAuth"
                element={<VerificarCodigoAuth />}
              />
              <Route path="/verificacion" element={<Verificacion />} />
              <Route path="/producto/:id" element={<AgregarCarrito />} />
              <Route
                path="/compararProductos/:id1/:id2"
                element={<CompararProducto />}
              />
              <Route path="/categoria/:id" element={<Categoria />} />
              <Route path="/promocion/:id" element={<Promocion />} />

              {/*
              =========================================================
              ADMIN + CONSULTOR (con sidebar)
              - Admin entra a todo (bypass de privilegios).
              - Consultor pasa solo si tiene el privilegio indicado.
              =========================================================
            */}
              <Route
                element={
                  <ProtectedRoute
                    rolesPermitidos={["administrador", "consultor"]}
                  >
                    <LayoutSidebar />
                  </ProtectedRoute>
                }
              >
                {/* --- Accesibles a ambos según privilegios del consultor --- */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute
                      rolesPermitidos={["administrador", "consultor"]}
                      privilegiosNecesarios={["ver_dashboard"]}
                    >
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventario"
                  element={
                    <ProtectedRoute
                      rolesPermitidos={["administrador", "consultor"]}
                      privilegiosNecesarios={["gestionar_inventario"]}
                    >
                      <Inventario />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tablaVentas"
                  element={
                    <ProtectedRoute
                      rolesPermitidos={["administrador", "consultor"]}
                      privilegiosNecesarios={["ver_reportes"]}
                    >
                      <TablaVentas />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/personalizacionReportes"
                  element={
                    <ProtectedRoute
                      rolesPermitidos={["administrador", "consultor"]}
                      privilegiosNecesarios={["personalizacion_reportes"]}
                    >
                      <PersonalizacionReportes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reportesPedidos"
                  element={
                    <ProtectedRoute
                      rolesPermitidos={["administrador", "consultor"]}
                      privilegiosNecesarios={["ver_reportes_pedidos"]}
                    >
                      <ReportesPedidos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reportesInventario"
                  element={
                    <ProtectedRoute
                      rolesPermitidos={["administrador", "consultor"]}
                      privilegiosNecesarios={["ver_reportes"]}
                    >
                      <ReportesInventario />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reportes"
                  element={
                    <ProtectedRoute
                      rolesPermitidos={["administrador", "consultor"]}
                      privilegiosNecesarios={["ver_reportes"]}
                    >
                      <Reportes />
                    </ProtectedRoute>
                  }
                />

                {/* --- Solo ADMIN (según tu lógica) --- */}
                <Route
                  path="/gestionProductos"
                  element={
                    <ProtectedRoute
                      rolesPermitidos={["administrador", "consultor"]}
                      privilegiosNecesarios={["gestionar_productos"]}
                    >
                      <GestionProductos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/userManagementViews"
                  element={
                    <ProtectedRoute rolesPermitidos={["administrador"]}>
                      <UserManagementViews />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/campanaPromocional"
                  element={
                    <ProtectedRoute rolesPermitidos={["administrador"]}>
                      <CampanaPromocional />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/campanaviews"
                  element={
                    <ProtectedRoute rolesPermitidos={["administrador"]}>
                      <CampanasView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/gestionCupones"
                  element={
                    <ProtectedRoute rolesPermitidos={["administrador"]}>
                      <GestionCupones />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/campana-detalle"
                  element={
                    <ProtectedRoute rolesPermitidos={["administrador"]}>
                      <CampanaDetalleModal />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tablaPromociones"
                  element={
                    <ProtectedRoute rolesPermitidos={["administrador"]}>
                      <TablaPromociones />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/asignarDescuento"
                  element={
                    <ProtectedRoute rolesPermitidos={["administrador"]}>
                      <AsignarDescuentos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reporteUsuariosAdmin"
                  element={
                    <ProtectedRoute rolesPermitidos={["administrador"]}>
                      <ReporteUsuarioAdmin />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/detallePedidos"
                  element={
                    <ProtectedRoute
                      rolesPermitidos={["administrador", "consultor"]}
                      privilegiosNecesarios={["ver_reportes_pedidos"]}
                    >
                      <DetallePedido />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/detallePedido/:id"
                  element={
                    <ProtectedRoute
                      rolesPermitidos={["administrador", "consultor"]}
                      privilegiosNecesarios={["ver_reportes_pedidos"]}
                    >
                      <DetallePedidos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/gestionPedidos"
                  element={
                    <ProtectedRoute
                      rolesPermitidos={["administrador", "consultor"]}
                      privilegiosNecesarios={["ver_reportes_pedidos"]}
                    >
                      <GestionDePedido />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ConfigBanner"
                  element={
                    <ProtectedRoute rolesPermitidos={["administrador"]}>
                      <ConfigBanner />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/EditarPerfilAdmin"
                  element={
                    <ProtectedRoute
                      rolesPermitidos={["administrador", "consultor"]}
                    >
                      <EditarPerfilAdmin />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/MenuPromociones"
                  element={
                    <ProtectedRoute rolesPermitidos={["administrador"]}>
                      <MenuPromociones />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* ---------- CLIENTE LOGUEADO ---------- */}
              <Route
                path="/miPerfil"
                element={
                  <ProtectedRoute rolesPermitidos={["cliente"]}>
                    <MiPerfil />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/idioma"
                element={
                  <ProtectedRoute rolesPermitidos={["cliente"]}>
                    <Vista />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/SistemaValoracion"
                element={
                  <ProtectedRoute rolesPermitidos={["cliente"]}>
                    <SistemaValoracion />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/Historial"
                element={
                  <ProtectedRoute rolesPermitidos={["cliente"]}>
                    <Historial />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pedidoEmergente"
                element={
                  <ProtectedRoute rolesPermitidos={["cliente"]}>
                    <PedidoEmergente />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/descuentos_aplicados"
                element={
                  <ProtectedRoute rolesPermitidos={["cliente"]}>
                    <DescuentosAplicados />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/misDirecciones"
                element={
                  <ProtectedRoute rolesPermitidos={["cliente"]}>
                    <MisDirecciones />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/metodoPago"
                element={
                  <ProtectedRoute rolesPermitidos={["cliente"]}>
                    <MetodoPago />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/historialPedidos"
                element={
                  <ProtectedRoute rolesPermitidos={["cliente"]}>
                    <HistorialPedido />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/misCupones"
                element={
                  <ProtectedRoute rolesPermitidos={["cliente"]}>
                    <MisCupones />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/carrito"
                element={
                  <ProtectedRoute rolesPermitidos={["cliente"]}>
                    <Carrito />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/procesoCompra"
                element={
                  <ProtectedRoute rolesPermitidos={["cliente"]}>
                    <ProcesoCompra />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/historialCompras"
                element={
                  <ProtectedRoute rolesPermitidos={["cliente"]}>
                    <HistorialCompras />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/misPedidos"
                element={
                  <ProtectedRoute rolesPermitidos={["cliente"]}>
                    <MisPedidos />
                  </ProtectedRoute>
                }
              />
              {/* NUEVO compatible */}
              <Route
                path="/listadedeseos"
                element={
                  <ProtectedRoute rolesPermitidos={["cliente"]}>
                    <ListaDeDeseos />
                  </ProtectedRoute>
                }
              />

              {/* ---------- OTROS ---------- */}
              <Route path="/inicio" element={<InicioAdmin />} />
              <Route path="/Prueba" element={<TestAuth />} />

              {/* ---------- NOT FOUND ---------- */}
              <Route path="*" element={<NotFoundpage />} />
            </Routes>
          </div>
        </div>
      </SearchProvider>
    </UserProvider>
  );
}

export default App;
