import "./cambiar_contraseña.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { changePassword } from "./api/Usuario.Route";

const Cambiar_contraseña = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  // correo viene del state, no editable
  const correo = state?.correo || "";
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleChange(e) {
    e.preventDefault();

    if (!correo) return alert("No se recibió el correo del usuario.");
    if (!password1 || !password2) return alert("Completa ambos campos de contraseña.");
    if (password1 !== password2) return alert("Las contraseñas no coinciden.");
    if (password1.trim().length < 6) return alert("La contraseña debe tener al menos 6 caracteres.");

    try {
      setLoading(true);
      await changePassword(correo, password1); // { correo, new_password }
      alert("Contraseña actualizada correctamente.");
      navigate("/login");
    } catch (err) {
      alert(err?.response?.data?.error || "No se pudo cambiar la contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="cambiar-form" onSubmit={handleChange}>
      <img className="logo-titulo" src="/logo-easyway.png" alt="Logo" />
      <p className="elige-text">Elige una nueva contraseña</p>

      <div className="input-wrapper">
        <input
          type="password"
          className="input-field"
          placeholder="Nueva contraseña"
          value={password1}
          onChange={(e) => setPassword1(e.target.value)}
        />
      </div>

      <div className="input-wrapper">
        <input
          type="password"
          className="input-field"
          placeholder="Confirmar contraseña"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
        />
      </div>

      <button className="cambiar-button" type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
};

export default Cambiar_contraseña;
