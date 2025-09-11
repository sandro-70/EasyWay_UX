import React from "react";
import { useNavigate } from "react-router-dom";
import "./notFoundPage.css";
import cartIcon from "./images/logo.png"; // Usa.png aquí el ícono que subiste

export default function Error404() {
  const navigate = useNavigate();

  return (
    <div
      className="ntF-error-container"
      style={{
        position: "absolute",
        top: "90px",
        left: 0,
        right: 0,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "90vh",
        background: "linear-gradient(135deg, #007bff 40%, #00aaff 100%)",
      }}
    >
      <div className="ntF-error-content">
        <img src={cartIcon} alt="Carrito" className="ntF-error-icon" />
        <h1 className="ntF-error-title">404</h1>
        <p className="ntF-error-message">
          ¡Ups! La página que buscas no existe o fue movida.
        </p>
        <button className="ntF-error-button" onClick={() => navigate("/")}>
          ⬅ Regresar al inicio
        </button>
      </div>
    </div>
  );
}
