import React from "react";
import { useParams } from "react-router-dom";
import imgProd1 from "../images/imgProd1.png";
import { X } from "lucide-react";

const CompararProducto = () => {
  const { id1, id2 } = useParams();

  const productos = [
    {
      id: 1,
      nombre: "Arroz Blanco Envasado Ambassador 1.7Kg",
      marca: "Ambassador",
      precio: "L. 40.00",
      valoracion: 2,
      oferta: "--",
      img: imgProd1,
    },
    {
      id: 2,
      nombre: "Arroz Blanco Envasado El Progreso 1.7Kg",
      marca: "El Progreso",
      precio: "L. 45.00",
      valoracion: 2,
      oferta: "-10%",
      img: imgProd1,
    },
    {
      id: 3,
      nombre: "Arroz Premium La Rosa 2Kg",
      marca: "La Rosa",
      precio: "L. 50.00",
      valoracion: 3,
      oferta: "-5%",
      img: imgProd1,
    },
  ];

  const seleccionados = productos.filter(
    (p) => p.id === parseInt(id1) || p.id === parseInt(id2)
  );

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Comparar Productos</h2>
          <button style={styles.closeButton} onClick={""}>
            <X />
          </button>
        </div>

        <div style={styles.productsContainer}>
          {seleccionados.map((p) => (
            <div key={p.id} style={styles.productCard}>
              <img src={imgProd1} alt={p.nombre} style={styles.productImage} />
              <h4 style={styles.productName}>{p.nombre}</h4>

              <div style={styles.infoRow}>
                <span style={styles.label}>Marca</span>
                <span style={styles.value}>{p.marca}</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.label}>Precio</span>
                <span style={styles.value}>{p.precio}</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.label}>Valoración</span>
                <span style={styles.stars}>
                  {Array.from({ length: 3 }, (_, i) => (
                    <span
                      key={i}
                      style={{
                        color: i < p.valoracion ? "#2b6daf" : "#ddd",
                        fontSize: "18px",
                      }}
                    >
                      ★
                    </span>
                  ))}
                </span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.label}>Oferta</span>
                <span style={styles.value}>{p.oferta}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    backgroundColor: "rgba(0,0,0,0.5)",
    position: "fixed",
    top: 70,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "10px",
    width: "80%",
    maxWidth: "900px",
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
  },
  productsContainer: {
    display: "flex",
    justifyContent: "space-around",
    gap: "20px",
    padding: "20px",
  },
  productCard: {
    flex: 1,
    textAlign: "center",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "15px",
  },
  productImage: {
    width: "120px",
    height: "150px",
    objectFit: "contain",
    marginBottom: "10px",
    display: "block",
    margin: "0 auto",
  },
  productName: {
    fontSize: "14px",
    fontWeight: "bold",
    margin: "10px 0",
    minHeight: "40px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
    borderBottom: "1px solid #E5E5E5",
    fontSize: "14px",
  },
  label: {
    fontWeight: "500",
    color: "#555",
  },
  value: {
    fontWeight: "400",
    color: "#000",
  },
  stars: {
    display: "flex",
    gap: "2px",
  },
};

export default CompararProducto;
