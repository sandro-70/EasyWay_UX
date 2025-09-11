import { useState } from "react";
import "./PersonalizacionReportes.css";

function PersonalizacionReportes() {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div
      className="reportes-container"
      style={{
        position: "absolute",
        top: "145px",
        left: 0,
        right: 0,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
      }}
    >
      <h2 className="inventario-title">Personalización de Reportes</h2>

      <div className="secciones">
        {/* Dashboard General */}
        <div>
          <button
            className="seccion-btn"
            onClick={() => toggleSection("dashboard")}
          >
            Dashboard General
            <span>{openSection === "dashboard" ? "▲" : "▼"}</span>
          </button>
          {openSection === "dashboard" && (
            <div className="opciones">
              <label>
                <input type="checkbox" /> Ventas totales del día, semana, mes y
                año
              </label>
              <label>
                <input type="checkbox" /> Total de pedidos realizados y
                entregados
              </label>
              <label>
                <input type="checkbox" /> Ingresos netos e ingresos brutos
              </label>
              <label>
                <input type="checkbox" /> Productos más vendidos
              </label>
              <label>
                <input type="checkbox" /> Usuarios más activos
              </label>
              <label>
                <input type="checkbox" /> Promociones más efectivas
              </label>
              <label>
                <input type="checkbox" /> Inventario crítico
              </label>
              <label>
                <input type="checkbox" /> Notificaciones recurrentes
              </label>
            </div>
          )}
        </div>

        {/* Reporte de Ventas */}
        <div>
          <button
            className="seccion-btn"
            onClick={() => toggleSection("ventas")}
          >
            Reporte de Ventas
            <span>{openSection === "ventas" ? "▲" : "▼"}</span>
          </button>
          {openSection === "ventas" && (
            <div className="opciones">
              <label>
                <input type="checkbox" /> Ventas por producto
              </label>
              <label>
                <input type="checkbox" /> Ventas por categoría
              </label>
              <label>
                <input type="checkbox" /> Ventas por fecha
              </label>
            </div>
          )}
        </div>

        {/* Reporte de Pedidos */}
        <div>
          <button
            className="seccion-btn"
            onClick={() => toggleSection("pedidos")}
          >
            Reporte de Pedidos
            <span>{openSection === "pedidos" ? "▲" : "▼"}</span>
          </button>
          {openSection === "pedidos" && (
            <div className="opciones">
              <label>
                <input type="checkbox" /> Pedidos pendientes
              </label>
              <label>
                <input type="checkbox" /> Pedidos entregados
              </label>
              <label>
                <input type="checkbox" /> Pedidos cancelados
              </label>
            </div>
          )}
        </div>

        {/* Reporte de Inventario */}
        <div>
          <button
            className="seccion-btn"
            onClick={() => toggleSection("inventario")}
          >
            Reporte de Inventario
            <span>{openSection === "inventario" ? "▲" : "▼"}</span>
          </button>
          {openSection === "inventario" && (
            <div className="opciones">
              <label>
                <input type="checkbox" /> Stock actual por producto
              </label>
              <label>
                <input type="checkbox" /> Productos más y menos vendidos
              </label>
              <label>
                <input type="checkbox" /> Alertas de bajo inventario
              </label>
            </div>
          )}
        </div>

        {/* Reporte de Usuarios */}
        <div>
          <button
            className="seccion-btn"
            onClick={() => toggleSection("usuarios")}
          >
            Reporte de Usuarios
            <span>{openSection === "usuarios" ? "▲" : "▼"}</span>
          </button>
          {openSection === "usuarios" && (
            <div className="opciones">
              <label>
                <input type="checkbox" /> Usuarios activos
              </label>
              <label>
                <input type="checkbox" /> Nuevos registros
              </label>
              <label>
                <input type="checkbox" /> Usuarios inactivos
              </label>
            </div>
          )}
        </div>

        {/* Reporte de Promociones y Descuentos */}
        <div>
          <button
            className="seccion-btn"
            onClick={() => toggleSection("promos")}
          >
            Reporte de Promociones y Descuentos
            <span>{openSection === "promos" ? "▲" : "▼"}</span>
          </button>
          {openSection === "promos" && (
            <div className="opciones">
              <label>
                <input type="checkbox" /> Promociones activas
              </label>
              <label>
                <input type="checkbox" /> Promociones finalizadas
              </label>
              <label>
                <input type="checkbox" /> Descuentos aplicados
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown fechas */}
      <div className="fechas">
        <label className="label">Mostrar por fechas: </label>
        <select className="dropdown">
          <option>Semanal</option>
          <option>Mensual</option>
          <option>Anual</option>
        </select>
      </div>

      {/* Checkbox correo */}
      <div className="correo">
        <input type="checkbox" />
        <p style={{ marginLeft: "8px" }}>
          Agendar reportes automáticamente al correo electrónico
        </p>
      </div>

      <div className="Actions-buttons-Reportes">
        <button className="btn-guardar">Guardar Configuración</button>
        <button className="btn-cancelar">Cancelar Configuración</button>
      </div>
    </div>
  );
}

export default PersonalizacionReportes;
