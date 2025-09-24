import "./cambiar_contraseña.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { changePassword } from "./api/Usuario.Route";
import { toast } from "react-toastify";
import "./toast.css";

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

    if (!correo) return toast.error("No se recibió el correo del usuario.", { className: "toast-error" });
    if (!password1 || !password2) return toast.info("Completa ambos campos de contraseña.", { className: "toast-info" });
    if (password1 !== password2) return toast.warn("Las contraseñas no coinciden.", { className: "toast-warn" });
    if (password1.trim().length < 6) return toast.info("La contraseña debe tener al menos 6 caracteres.", { className: "toast-info" });

    try {
      setLoading(true);
      await changePassword(correo, password1); // { correo, new_password }
      toast.success("Contraseña actualizada correctamente.", { className: "toast-success" });
      navigate("/login");
    } catch (err) {
      toast.error(err?.response?.data?.error || "No se pudo cambiar la contraseña.", { className: "toast-error" });
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
