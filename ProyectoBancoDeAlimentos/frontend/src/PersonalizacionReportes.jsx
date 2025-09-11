import { useState } from "react";
import "./PersonalizacionReportes.css";

function PersonalizacionReportes() {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const sections = [
    {
      key: "dashboard",
      title: "Dashboard General",
      options: [
        "Ventas totales del día, semana, mes y año",
        "Total de pedidos realizados y entregados",
        "Ingresos netos e ingresos brutos",
        "Productos más vendidos",
        "Usuarios más activos",
        "Promociones más efectivas",
        "Inventario crítico",
        "Notificaciones recurrentes",
      ],
    },
    {
      key: "ventas",
      title: "Reporte de Ventas",
      options: ["Ventas por producto", "Ventas por categoría", "Ventas por fecha"],
    },
    {
      key: "pedidos",
      title: "Reporte de Pedidos",
      options: ["Pedidos pendientes", "Pedidos entregados", "Pedidos cancelados"],
    },
    {
      key: "inventario",
      title: "Reporte de Inventario",
      options: ["Stock actual por producto", "Productos más y menos vendidos", "Alertas de bajo inventario"],
    },
    {
      key: "usuarios",
      title: "Reporte de Usuarios",
      options: ["Usuarios activos", "Nuevos registros", "Usuarios inactivos"],
    },
    {
      key: "promos",
      title: "Reporte de Promociones y Descuentos",
      options: ["Promociones activas", "Promociones finalizadas", "Descuentos aplicados"],
    },
  ];

  return (
    <div className="reportes-container">
      <h2 className="titulo-principal">Personalización de Reportes</h2>

      <div className="secciones">
        {sections.map((section) => (
          <div key={section.key} className="seccion">
            <button className="seccion-btn" onClick={() => toggleSection(section.key)}>
              <span>{section.title}</span>
              <span className={`flecha ${openSection === section.key ? "abierta" : ""}`}>
                ▼
              </span>
            </button>
            {openSection === section.key && (
              <div className="opciones">
                {section.options.map((opt, index) => (
                  <label key={index}>
                    <input type="checkbox" /> {opt}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Fechas */}
      <div className="fechas">
        <label className="label">Mostrar por fechas: </label>
        <select className="dropdown">
          <option>Semanal</option>
          <option>Mensual</option>
          <option>Anual</option>
        </select>
      </div>

      {/* Correo */}
      <div className="correo">
        <input type="checkbox" />
        <p>Agendar reportes automáticamente al correo electrónico</p>
      </div>

      {/* Botones de acción */}
      <div className="Actions-buttons-Reportes">
        <button className="btn-guardar">Guardar Configuración</button>
        <button className="btn-cancelar">Cancelar</button>
      </div>
    </div>
  );
}

export default PersonalizacionReportes;