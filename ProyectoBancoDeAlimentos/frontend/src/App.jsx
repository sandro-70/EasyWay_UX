// src/App.jsx
import "./App.css";
import { Routes, Route } from "react-router-dom";
import { BrowserRouter as Router } from "react-router-dom";

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
import TablaUsuarios from "./reporteUsuarios.jsx";
import SistemaValoracion from "./SistemaValoracion.jsx";
import PersonalizacionReportes from "./PersonalizacionReportes.jsx";
import DescuentosAplicados from "./descuentos_aplicados.jsx";
import Categoria from "./categoria.jsx";
import HistorialCompras from "./HistorialCompras.jsx";
import ProtectedRoute from "./components/ProtectedRoute";

const HEADER_HEIGHT = 60; // px

function App() {
  return (
    <UserProvider>
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

            {/* ---------- CON SIDEBAR + PROTEGIDAS ---------- */}
            <Route
              element={
                <ProtectedRoute rolesPermitidos={["administrador"]}>
                  <LayoutSidebar />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/gestionProductos" element={<GestionProductos />} />
              <Route path="/tablaPromociones" element={<TablaPromociones />} />
              <Route
                path="/personalizacionReportes"
                element={<PersonalizacionReportes />}
              />
              <Route
                path="/EditarPerfilAdmin"
                element={<EditarPerfilAdmin />}
              />
              <Route path="/asignarDescuento" element={<AsignarDescuentos />} />
              <Route
                path="/userManagementViews"
                element={<UserManagementViews />}
              />
              <Route
                path="/campanaPromocional"
                element={<CampanaPromocional />}
              />
              <Route path="/tablaUsuarios" element={<TablaUsuarios />} />
              <Route path="/tablaVentas" element={<TablaVentas />} />
              <Route path="/facturas" element={<Facturas />} />
              <Route path="/factura/:id" element={<DetalleFactura />} />
              <Route
                path="/descuentos_aplicados"
                element={<DescuentosAplicados />}
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

            
              path="/SistemaValoracion"
              element={
                <ProtectedRoute rolesPermitidos={["cliente"]}>
                  <SistemaValoracion />
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
              path="/historialCompras"
              element={
                <ProtectedRoute rolesPermitidos={["cliente"]}>
                  <HistorialCompras />
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
    </UserProvider>
  );
}

export default App;
