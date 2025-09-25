import React from "react";
import { X } from "lucide-react";
import axiosInstance from "../api/axiosInstance"; // ⬅️ igual que en AgregarCarrito.jsx

// ====== helpers para construir la URL absoluta desde el backend (mismos de AgregarCarrito.jsx) ======
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

// para nombres de archivo tipo "foto.jpg"
const backendImageUrl = (fileName) =>
  fileName
    ? `${BACKEND_ORIGIN}/api/images/productos/${encodeURIComponent(fileName)}`
    : "";

// adapta la ruta/nombre que venga en DB a una URL pública válida
const toPublicFotoSrc = (nameOrPath) => {
  if (!nameOrPath) return "";
  const s = String(nameOrPath);
  if (/^https?:\/\//i.test(s)) return s; // ya es absoluta
  if (s.startsWith("/api/images/")) return `${BACKEND_ORIGIN}${encodeURI(s)}`;
  if (s.startsWith("/images/")) return `${BACKEND_ORIGIN}/api${encodeURI(s)}`;
  return backendImageUrl(s); // nombre suelto => /api/images/productos/<archivo>
};

// intenta obtener el primer campo de imagen disponible en el producto
const pickImagenNombre = (p) => {
  // casos comunes en tu API
  if (p?.url_imagen) return p.url_imagen;
  if (p?.imagen) return p.imagen;
  if (p?.foto) return p.foto;

  // arreglo de imágenes
  const arr = Array.isArray(p?.imagenes) ? p.imagenes : [];
  for (const it of arr) {
    const candidate =
      it?.url_imagen ||
      it?.ruta ||
      it?.path ||
      it?.nombre_archivo ||
      it?.archivo ||
      it?.nombre ||
      it; // por si viene como string
    if (candidate) return candidate;
  }
  return "";
};

const CompararProducto = ({ productos, onCerrar }) => {
  const handleCerrar = () => {
    if (onCerrar) onCerrar();
  };

  if (!productos || productos.length === 0) {
    return null;
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Comparar Productos</h2>
          <button style={styles.closeButton} onClick={handleCerrar}>
            <X />
          </button>
        </div>

        <div style={styles.productsContainer}>
          {productos.map((p, idx) => {
            const imgName = pickImagenNombre(p);
            const src = toPublicFotoSrc(imgName);
            return (
              <div key={p.id_producto ?? idx} style={styles.productCard}>
                {src ? (
                  <img
                    src={src}
                    alt={p.nombre || "Producto"}
                    style={styles.productImage}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140"><rect width="140" height="140" fill="%23f9f9f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23999">Sin imagen</text></svg>';
                    }}
                  />
                ) : (
                  <div style={{ ...styles.productImage, display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
                    Sin imagen
                  </div>
                )}

                <h4 style={styles.productName}>{p.nombre}</h4>

                <div style={styles.infoRow}>
                  <span style={styles.label}>Marca</span>
                  <span style={styles.value}>
                    {p.marca?.nombre || p.marca || "Sin marca"}
                  </span>
                </div>

                <div style={styles.infoRow}>
                  <span style={styles.label}>Precio</span>
                  <span style={styles.value}>L. {p.precio_base}</span>
                </div>

                <div style={styles.infoRow}>
                  <span style={styles.label}>Valoración</span>
                  <span style={styles.stars}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        style={{
                          color: i < (p.estrellas || 0) ? "#2b6daf" : "#ddd",
                          fontSize: "18px",
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </span>
                </div>

                <div style={styles.infoRow}>
                  <span style={styles.label}>Categoría</span>
                  <span style={styles.value}>
                    {p.subcategoria?.nombre || "Sin categoría"}
                  </span>
                </div>

                <div style={styles.infoRow}>
                  <span style={styles.label}>Stock</span>
                  <span style={styles.value}>
                    {p.stock ? "Disponible" : "Agotado"}
                  </span>
                </div>

                {p.descripcion && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Descripción</span>
                    <span style={styles.value}>
                      {p.descripcion.length > 100
                        ? `${p.descripcion.substring(0, 100)}...`
                        : p.descripcion}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={styles.actionButtons}>
          <button style={styles.cancelButton} onClick={handleCerrar}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    backgroundColor: "rgba(0,0,0,0.5)",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "10px",
    width: "90%",
    maxWidth: "1000px",
    maxHeight: "90vh",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    overflow: "hidden",
  },
  header: {
    background: "#2b6daf",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 20px",
  },
  title: {
    color: "white",
    textAlign: "center",
    flex: 1,
    margin: 0,
    fontSize: "20px",
    fontWeight: "bold",
  },
  closeButton: {
    background: "transparent",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "white",
    padding: "5px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  productsContainer: {
    display: "flex",
    justifyContent: "space-around",
    gap: "20px",
    padding: "20px",
    maxHeight: "60vh",
    overflowY: "auto",
  },
  productCard: {
    flex: 1,
    textAlign: "center",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "15px",
    maxWidth: "400px",
  },
  productImage: {
    width: "140px",
    height: "140px",
    objectFit: "contain",
    marginBottom: "10px",
    display: "block",
    margin: "0 auto 10px auto",
    border: "1px solid #eee",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
  },
  productName: {
    fontSize: "16px",
    fontWeight: "bold",
    margin: "10px 0",
    minHeight: "40px",
    lineHeight: "1.2",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #E5E5E5",
    fontSize: "14px",
  },
  label: {
    fontWeight: "600",
    color: "#555",
  },
  value: {
    fontWeight: "400",
    color: "#000",
    textAlign: "right",
    maxWidth: "60%",
    wordWrap: "break-word",
  },
  stars: {
    display: "flex",
    gap: "2px",
    justifyContent: "flex-end",
  },
  actionButtons: {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    padding: "20px",
    borderTop: "1px solid #eee",
    backgroundColor: "#f9f9f9",
  },
  cancelButton: {
    backgroundColor: "#6b7280",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
};

export default CompararProducto;
