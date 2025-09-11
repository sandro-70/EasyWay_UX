import "./forgot_password.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { forgetPassword } from "./api/Usuario.Route";

export default function ForgotPassword() {
  const [correo, setCorreo] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!correo) return alert("Ingresa tu correo.");
    try {
      console.log("correo:", correo);
      setLoading(true);
      
      await forgetPassword(correo);
      console.log("correox2:", correo);
      alert("Te enviamos un código a tu correo.");
      navigate("/verificar-codigo", { state: { correo } });
    } catch (err) {
      alert(err?.response?.data?.error || "No se pudo enviar el correo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="forgot-form" onSubmit={handleSubmit}>
      <img className="logo-titulo" src="/logo-easyway.png" alt="Logo" />
      <p className="encontremos-text">Encontremos tu cuenta de Easy Way</p>

      <div className="input-wrapper">
        <input
          type="email"
          className="input-field"
          placeholder="Correo electrónico"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
      </div>

      <button className="forgot-button" disabled={loading}>
        {loading ? "Enviando..." : "Enviar correo para cambio de contraseña"}
      </button>
    </form>
  );
}