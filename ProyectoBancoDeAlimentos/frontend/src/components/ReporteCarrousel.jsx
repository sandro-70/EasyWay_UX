import TablaVentas from "../tablaReportesVentas.jsx";
import TablaPromociones from "../tablaReportesPromociones.jsx";
import ReportesPedidos from "../pages/ReportesPedidos.jsx";
import ReportesInventario from "../pages/ReportesInventario.jsx";
import PersonalizacionReportes from "../PersonalizacionReportes.jsx";
import ReportesUsuarios from "../tablaReportesUsuarios.jsx";

import React, { useState } from "react";
import "./ReporteCarrousel.override.css";

const ReporteCarrousel = () => {
  const [active, setActive] = useState("ventas");

  const tabs = [
    { id: "ventas", label: "Ventas", node: <TablaVentas /> },
    { id: "promociones", label: "Promociones", node: <TablaPromociones /> },
    { id: "pedidos", label: "Pedidos", node: <ReportesPedidos /> },
    { id: "inventario", label: "Inventario", node: <ReportesInventario /> }/*,
    { id: "usuarios", label: "Usuarios", node: <ReportesUsuarios /> },
    { id: "personalizacion", label: "Personalización", node: <PersonalizacionReportes />, },*/
  ];

  return (
    <div
      className="px-4"
      style={{
        marginBottom: "1000px",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        paddingTop: 12,
      }}
    >
      <div style={{ width: "100%", maxWidth: 1200 }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              aria-pressed={active === t.id}
              style={{
                padding: "8px 14px",
                borderRadius: 20,
                border:
                  active === t.id ? "2px solid #f68b1e" : "1px solid #d1d5db",
                background: active === t.id ? "#fff7ed" : "#ffffff",
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div>
          {tabs.find((t) => t.id === active)?.node}
        </div>
      </div>
    </div>
  );
};

export default ReporteCarrousel;
