import React, { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import {
  getTopProductosUsuario,
  getProductosRecomendados,
  getDiasCompra,
  getTotalAhorrado,
} from "./api/reporteusuarioApi"; // ajusta ruta si tu archivo está en otra carpeta
import "./SistemaValoracion.css";

const USER_ID = 1; // 👈 reemplázalo con el id_usuario real de tu login

export default function SistemaValoracion() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [recurrentes, setRecurrentes] = useState([]);
  const [recomendados, setRecomendados] = useState([]);
  const [diasCompra, setDiasCompra] = useState([]);
  const [ahorro, setAhorro] = useState(0);

  const [currentProductIdx, setCurrentProductIdx] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [top, recs, dias, ahorroResp] = await Promise.all([
          getTopProductosUsuario(USER_ID),
          getProductosRecomendados(USER_ID),
          getDiasCompra(USER_ID),
          getTotalAhorrado(USER_ID),
        ]);

        if (!mounted) return;
        setRecurrentes(top?.data ?? []);
        setRecomendados(recs?.data ?? []);
        setDiasCompra(dias?.data ?? []);
        setAhorro(Number(ahorroResp?.data?.total_ahorrado ?? 0));
      } catch (e) {
        console.error(e);
        if (mounted) setErr("No se pudieron cargar los datos.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Mapear hábitos de compra a días de la semana
  const diasLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const habitData = useMemo(() => {
    const map = new Map(
      diasCompra.map((d) => [Number(d.dia_semana), Number(d.total_pedidos)])
    );
    return Array.from({ length: 7 }, (_, i) => ({
      day: diasLabels[i],
      value: map.get(i) || 0,
    }));
  }, [diasCompra]);
  const maxValue = useMemo(
    () => Math.max(1, ...habitData.map((h) => h.value)),
    [habitData]
  );

  const currentProduct = recurrentes[currentProductIdx] || null;

  return (
    <div className="supermarket-dashboard">
      <div className="dashboard-grid">
        {/* Tarjeta de Sugerencias */}
        <div className="dashboard-card suggestions-card">
          <div className="card-header">
            <h2>SUGERENCIAS DE COMPRA</h2>
          </div>
          <div className="card-content">
            <div className="suggestion-visual">
              <div className="visual-icon">
                <Icon icon="mdi:bell-notification-outline" />
              </div>
            </div>
            <div className="suggestion-text">
              {loading ? (
                <p>Cargando…</p>
              ) : err ? (
                <p>{err}</p>
              ) : recomendados?.length ? (
                <>
                  <h3>Agregar {recomendados[0].producto?.nombre}</h3>
                  <p>a tu carrito de compras</p>
                </>
              ) : (
                <>
                  <h3>Agregar frutas y verduras</h3>
                  <p>a tu carrito de compras</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tarjeta de Productos Recurrentes */}
        <div className="dashboard-card recurrent-card">
          <div className="card-header">
            <h2>PRODUCTOS RECURRENTES</h2>
          </div>
          <div className="card-content">
            {loading ? (
              <p>Cargando…</p>
            ) : err ? (
              <p>{err}</p>
            ) : recurrentes.length === 0 ? (
              <p>No hay compras registradas todavía.</p>
            ) : (
              <div className="product-navigation">
                <button
                  className="nav-arrow"
                  onClick={() =>
                    setCurrentProductIdx((p) =>
                      p === 0 ? recurrentes.length - 1 : p - 1
                    )
                  }
                >
                  <Icon icon="mdi:chevron-left" />
                </button>

                <div className="product-display">
                  <div className="product-image">
                    <span className="product-emoji">🛒</span>
                  </div>
                  <div className="product-info">
                    <h3>
                      {currentProduct?.producto?.nombre ??
                        `ID ${currentProduct?.id_producto}`}
                    </h3>
                    <p>
                      Comprado{" "}
                      {currentProduct?.dataValues?.total_comprado ??
                        currentProduct?.total_comprado}{" "}
                      veces
                    </p>
                  </div>
                </div>

                <button
                  className="nav-arrow"
                  onClick={() =>
                    setCurrentProductIdx((p) => (p + 1) % recurrentes.length)
                  }
                >
                  <Icon icon="mdi:chevron-right" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tarjeta de Hábitos de Compra */}
        <div className="dashboard-card habits-card">
          <div className="card-header">
            <h2>HÁBITOS DE COMPRA</h2>
          </div>
          <div className="card-content">
            {loading ? (
              <p>Cargando…</p>
            ) : err ? (
              <p>{err}</p>
            ) : (
              <div className="habits-visualization">
                <div className="bars-container">
                  {habitData.map((item, index) => (
                    <div key={index} className="bar-wrapper">
                      <div className="bar-value">{item.value}</div>
                      <div
                        className="habit-bar"
                        style={{
                          height: `${(item.value / maxValue) * 80}%`,
                        }}
                      />
                      <div className="bar-label">{item.day}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tarjeta de Resumen de Ahorro */}
        <div className="dashboard-card savings-card">
          <div className="card-header">
            <h2>RESUMEN DE AHORRO</h2>
          </div>
          <div className="card-content">
            {loading ? (
              <p>Cargando…</p>
            ) : err ? (
              <p>{err}</p>
            ) : (
              <>
                <div className="savings-visual">
                  <div className="savings-amount">
                    L. {Number(ahorro).toFixed(2)}
                  </div>
                  <div className="savings-icon">
                    <Icon icon="mdi:piggy-bank-outline" />
                  </div>
                </div>
                <div className="savings-description">
                  <p>
                    Has ahorrado durante este mes por ofertas, promociones y
                    descuentos
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
