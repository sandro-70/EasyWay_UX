import React from "react";
import "./Error404.css";
import Error404imagen from "../images/Error404imagen.png";

function Error404() {
  return (
    <div className="error404-container">
      <img src={Error404imagen} alt="Error 404" className="error404-image" />

      <button
        className="error404-button"
        onClick={() => (window.location.href = "/")}
      >
        VOLVER AL INICIO
      </button>
    </div>
  );
}

//se tiene que corregir la ruta del boton para que lleve al inicio de sesion

export default Error404;
