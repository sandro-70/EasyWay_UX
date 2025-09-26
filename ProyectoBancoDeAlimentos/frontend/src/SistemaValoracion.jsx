import React, { useEffect, useMemo, useState, useContext } from "react";
import { Icon } from "@iconify/react";
import {
  getTopProductosUsuario,
  getProductosRecomendados,
  getDiasCompra,
  getTotalAhorrado,
} from "./api/reporteusuarioApi";
import { getProductoById } from "./api/InventarioApi"; 
import axiosInstance from "./api/axiosInstance";       
import "./SistemaValoracion.css";
import { UserContext } from "./components/userContext";

/* ===== Helpers de imágenes (mismos de InicioUsuario) ===== */
const BACKEND_ORIGIN = (() => {
  const base = axiosInstance?.defaults?.baseURL;
  try {
    const u = base
      ? (base.startsWith("http") ? new URL(base) : new URL(base, window.location.origin))
      : new URL(window.location.origin);
    return `${u.protocol}//${u.host}`;
  } catch {
    return window.location.origin;
  }
})();

const toPublicFotoSrc = (nameOrPath, defaultDir = "productos") => {
  if (!nameOrPath) return "";
  const s = String(nameOrPath).trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/api/images/")) return `${BACKEND_ORIGIN}${encodeURI(s)}`;
  if (s.startsWith("/images/"))     return `${BACKEND_ORIGIN}/api${encodeURI(s)}`;
  return `${BACKEND_ORIGIN}/api/images/${encodeURIComponent(defaultDir)}/${encodeURIComponent(s)}`;
};

/* ===== Normalizadores ===== */
const normProd = (row) => {
  const p = row?.producto ?? row ?? {};
  return {
    id_producto: p.id_producto ?? row.id_producto ?? p.id ?? row.id ?? null,
    nombre: p.nombre ?? row.nombre ?? "-",
    // intentos locales (por si ya vienen en la respuesta)
    imagen_inline:
      p?.imagenes?.[0]?.url_imagen ??
      row?.imagenes?.[0]?.url_imagen ??
      p?.imagen_url ??
      row?.imagen_url ??
      "",
    total_comprado: Number(row?.total_comprado ?? row?.dataValues?.total_comprado ?? 0),
    puntuacion: Number(row?.puntuacion ?? 0),
  };
};

const toIsoDow1to7 = (dow) => (Number(dow) === 0 ? 7 : Number(dow)); // 0(dom) -> 7

export default function SistemaValoracion() {
  const { user } = useContext(UserContext);
  const USER_ID = user?.id_usuario;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [recurrentes, setRecurrentes] = useState([]);
  const [recomendados, setRecomendados] = useState([]);
  const [diasCompra, setDiasCompra] = useState([]);
  const [ahorro, setAhorro] = useState(0);

  // cache de imagen por id_producto
  const [imgCache, setImgCache] = useState({});

  const [currentProductIdx, setCurrentProductIdx] = useState(0);
  const currentProduct = recurrentes[currentProductIdx] || null;

  useEffect(() => {
    if (!USER_ID) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const [top, recs, dias, ahorroResp] = await Promise.all([
          getTopProductosUsuario(USER_ID),
          getProductosRecomendados(USER_ID),
          getDiasCompra(USER_ID),
          getTotalAhorrado(USER_ID),
        ]);

        console.log('Ahorro Response:', ahorroResp); // Debug log for savings API response

        if (!mounted) return;

        const topArr = (Array.isArray(top?.data) ? top.data : []).map(normProd);
        const recArr = (Array.isArray(recs?.data) ? recs.data : []).map(normProd);
        const diasArr = Array.isArray(dias?.data) ? dias.data : [];
        const totalAh = Number(ahorroResp?.data?.total_ahorrado ?? 0);

        console.log('Calculated totalAh:', totalAh); // Debug log for calculated savings

        setRecurrentes(topArr);
        setRecomendados(recArr);
        setDiasCompra(
          diasArr.map((d) => ({
            dia_semana: toIsoDow1to7(d?.dia_semana),
            total_pedidos: Number(d?.total_pedidos ?? 0),
          }))
        );
        setAhorro(totalAh);
        setCurrentProductIdx(0);
      } catch (e) {
        console.error(e);
        setErr("No se pudieron cargar los datos.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [USER_ID]);

  // Completar imágenes faltantes consultando getProductoById
  useEffect(() => {
    let mounted = true;
    const pool = [...recurrentes, ...recomendados];
    const idsToFetch = pool
      .filter((p) => !p.imagen_inline && p.id_producto && !imgCache[p.id_producto])
      .map((p) => p.id_producto);

    if (!idsToFetch.length) return;

    (async () => {
      try {
        const results = await Promise.allSettled(idsToFetch.map((id) => getProductoById(id)));
        const next = { ...imgCache };

        results.forEach((r, idx) => {
          if (r.status !== "fulfilled") return;
          const data = r.value?.data ?? {};
          const id = idsToFetch[idx];
          // intenta igual que InicioUsuario
          const url =
            data?.imagenes?.[0]?.url_imagen ??
            data?.imagen_url ??
            "";
          if (url) next[id] = url;
        });

        if (mounted) setImgCache(next);
      } catch (e) {
        console.error("No se pudieron completar imágenes:", e);
      }
    })();

    return () => { mounted = false; };
  }, [recurrentes, recomendados, imgCache]);

  // helpers de render
  const resolveImg = (p) => {
    const inline = p?.imagen_inline;
    const cached = p?.id_producto ? imgCache[p.id_producto] : "";
    const src = inline || cached || "";
    return src ? toPublicFotoSrc(src, "productos") : "/PlaceHolder.png";
  };

  // hábitos
  const diasLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const habitData = useMemo(() => {
    const map = new Map(diasCompra.map((d) => [Number(d.dia_semana), Number(d.total_pedidos)]));
    return Array.from({ length: 7 }, (_, i) => ({ day: diasLabels[i], value: map.get(i + 1) || 0 }));
  }, [diasCompra]);
  const maxValue = useMemo(() => Math.max(1, ...habitData.map((h) => h.value)), [habitData]);

  return (
    <div className="supermarket-dashboard">
      <div className="dashboard-grid">
        {/* SUGERENCIAS */}
        <div className="dashboard-card suggestions-card">
          <div className="card-header"><h2>SUGERENCIAS DE COMPRA</h2></div>
          <div className="card-content">
            <div className="suggestion-visual">
              <div className="visual-icon">
                <img
                  src={resolveImg(recomendados?.[0])}
                  alt="Sugerencia"
                  style={{ width: 60, height: 60, borderRadius: 12, objectFit: "cover" }}
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/PlaceHolder.png"; }}
                />
              </div>
            </div>
            <div className="suggestion-text">
              {loading ? <p>Cargando…</p> :
               err ? <p>{err}</p> :
               recomendados?.length ? (<><h3>Agregar {recomendados[0].nombre}</h3><p>a tu carrito de compras</p></>) :
               (<><h3>Agregar frutas y verduras</h3><p>a tu carrito de compras</p></>)}
            </div>
          </div>
        </div>

        {/* RECURRENTES */}
        <div className="dashboard-card recurrent-card">
          <div className="card-header"><h2>PRODUCTOS RECURRENTES</h2></div>
          <div className="card-content">
            {loading ? (
              <p>Cargando…</p>
            ) : err ? (
              <p>{err}</p>
            ) : !recurrentes.length ? (
              <p>No hay compras registradas todavía.</p>
            ) : (
              <div className="product-navigation">
                <button className="nav-arrow" onClick={() => setCurrentProductIdx((p) => (p === 0 ? recurrentes.length - 1 : p - 1))}>
                  <Icon icon="mdi:chevron-left" />
                </button>

                <div className="product-display">
                  <div className="product-image">
                    <img
                      src={resolveImg(currentProduct)}
                      alt={currentProduct?.nombre || "Producto"}
                      style={{ width: "100%", height: "100%", borderRadius: 16, objectFit: "cover" }}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/PlaceHolder.png"; }}
                    />
                  </div>
                  <div className="product-info">
                    <h3>{currentProduct?.nombre ?? `ID ${currentProduct?.id_producto}`}</h3>
                    <p>
                      Comprado {currentProduct?.total_comprado ?? 0}{" "}
                      {Number(currentProduct?.total_comprado) === 1 ? "vez" : "veces"}
                    </p>
                  </div>
                </div>

                <button className="nav-arrow" onClick={() => setCurrentProductIdx((p) => (p + 1) % recurrentes.length)}>
                  <Icon icon="mdi:chevron-right" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* HÁBITOS */}
        <div className="dashboard-card habits-card">
          <div className="card-header"><h2>PEDIDOS POR SEMANA</h2></div>
          <div className="card-content">
            {loading ? <p>Cargando…</p> : err ? <p>{err}</p> : (
              <div className="habits-visualization">
                <div className="bars-container">
                  {habitData.map((item, idx) => (
                    <div key={idx} className="bar-wrapper">
                      <div className="bar-value">{item.value}</div>
                      <div className="habit-bar" style={{ height: `${(item.value / maxValue) * 80}%` }} />
                      <div className="bar-label">{item.day}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AHORRO */}
        <div className="dashboard-card savings-card">
          <div className="card-header"><h2>RESUMEN DE AHORRO</h2></div>
          <div className="card-content">
            {loading ? <p>Cargando…</p> : err ? <p>{err}</p> : (
              <>
                <div className="savings-visual">
                  <div className="savings-amount">L. {Number(ahorro).toFixed(2)}</div>
                  <div className="savings-icon"><Icon icon="mdi:piggy-bank-outline" /></div>
                </div>
                <div className="savings-description">
                  <p>Has ahorrado durante este mes por ofertas, promociones y descuentos</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
