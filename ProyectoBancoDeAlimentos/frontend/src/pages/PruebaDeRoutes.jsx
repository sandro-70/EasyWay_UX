// src/TestAuth.jsx
import React, { useEffect, useState } from "react";
import { getAllProducts } from "../api/InventarioApi";


export default function TestAuth() {
  const [products, setProducts] = useState([]);
  const [rawResponse, setRawResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  // Helper para tomar el array correcto aun si tu backend envía {data} | {rows} | {products}
  const extractArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.rows)) return payload.rows;
    if (Array.isArray(payload?.products)) return payload.products;
    if (Array.isArray(payload?.items)) return payload.items;
    // Si no vino un array, devolvemos vacío y guardamos el crudo para inspección
    return [];
  };

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const res = await getAllProducts(); // axios response
      setRawResponse(res?.data ?? null);
      const arr = extractArray(res?.data);
      setProducts(arr);
      console.log("[PRODUCTOS] status:", res?.status);
      console.log("[PRODUCTOS] data:", res?.data);
    } catch (err) {
      console.error("[PRODUCTOS] error:", err?.response?.data || err);
      alert(err?.response?.data?.message || "Error al obtener productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
    // NO: console.log(productos.data) -> 'productos' es la función, no la respuesta
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Test Auth</h2>
      <p>Abre la consola del navegador para ver los logs.</p>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button onClick={fetchProductos} disabled={loading}>
          {loading ? "Cargando..." : "Recargar productos"}
        </button>
      </div>

      <h3>Productos:</h3>

      {/* Si la API no devolvió un array, mostramos el crudo completo para que veas todo */}
      {!Array.isArray(products) || products.length === 0 ? (
        <>
          <p>
            {Array.isArray(products) && products.length === 0
              ? "No hay productos cargados (o el array viene vacío)."
              : "La respuesta no es una lista; inspecciona el JSON completo:"}
          </p>
          {rawResponse && (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                background: "#111",
                color: "#eee",
                padding: 12,
                borderRadius: 8,
                maxHeight: 480,
                overflow: "auto",
                fontSize: 13,
              }}
            >
              {JSON.stringify(rawResponse, null, 2)}
            </pre>
          )}
        </>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {products.map((prod, idx) => {
            const title =
              prod?.nombre ||
              prod?.name ||
              `Producto ${prod?.id_producto ?? prod?.id ?? idx + 1}`;
            const key =
              prod?.id_producto ??
              prod?.id ??
              `${title}-${idx}-${Math.random().toString(36).slice(2)}`;

            return (
              <details key={key} open>
                <summary
                  style={{
                    cursor: "pointer",
                    fontWeight: 600,
                    padding: "6px 0",
                  }}
                  title="Click para colapsar/expandir"
                >
                  {title}
                </summary>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    background: "#0f172a",
                    color: "#e2e8f0",
                    padding: 12,
                    borderRadius: 8,
                    maxHeight: 480,
                    overflow: "auto",
                    fontSize: 13,
                    marginTop: 8,
                  }}
                >
                  {JSON.stringify(prod, null, 2)}
                </pre>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
