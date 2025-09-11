import React from "react";
import verifImg from "../images/verifImg.png";

const Verificacion = () => {
  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Activar autenticación en dos pasos</h2>
        </div>

        <div style={styles.body}>
          <div style={styles.iconContainer}>
            <img src={verifImg} alt="auth-icon" style={styles.icon} />
          </div>

          <p style={styles.text}>
            Por tu seguridad, ingresa el código que enviamos a tu correo o
            teléfono
          </p>

          <input
            type="text"
            placeholder="Ingresa el código"
            style={styles.input}
          />

          <button style={styles.verifyButton}>Verificar</button>

          <a href="#" style={styles.link}>
            Reenviar código
          </a>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    backgroundColor: "rgba(0,0,0,0.1)",
    position: "fixed",
    top: 0,
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
    width: "400px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    overflow: "hidden",
    textAlign: "center",
  },
  header: {
    background: "#2b6daf",
    padding: "15px",
  },
  title: {
    color: "white",
    margin: 0,
    fontSize: "18px",
    fontWeight: "bold",
  },
  body: {
    padding: "20px",
    flexDirection: "column",
    display: "flex",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: "15px",
  },
  icon: {
    width: "70px",
    height: "70px",
    display: "block",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: "14px",
    color: "#333",
    marginBottom: "20px",
  },
  input: {
    width: "200px",
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "15px",
  },
  verifyButton: {
    backgroundColor: "#2e9fd4",
    color: "white",
    border: "none",
    borderRadius: "5px",
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer",
    width: "150px",
    marginBottom: "15px",
  },
  link: {
    fontSize: "14px",
    color: "black",
    textDecoration: "none",
    fontWeight: "bold",
    cursor: "pointer",
    width: "100px",
    textDecoration: "underline",
  },
};

export default Verificacion;
