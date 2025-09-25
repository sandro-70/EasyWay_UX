// pages/VerifyCode.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { validarCodigo } from "./api/Usuario.Route";
import "./verificarcodigo.css";
import { toast } from "react-toastify";
import "./toast.css";

export default function VerificarCodigo() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [correo, setCorreo] = useState(state?.correo || "");
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!state?.correo) {
      // si llegan directo, pide el correo aquí también
    }
  }, [state]);

  async function handleVerify(e) {
    e.preventDefault();
    if (!correo || !codigo) return toast.info("Completa correo y código.", { className: "toast-info" });
    try {
      setLoading(true);
      
      const resp = await validarCodigo(correo, codigo);
      // Si tu backend devuelve un token temporal, guárdalo en state
       if (resp?.data && (resp.data === "Codigo valido!" || resp.data.valid)) {
        toast.info("Código válido, procede a cambiar la contraseña.", { className: "toast-info" });
        navigate("/cambiar_contraseña", { state: { correo } });
      } else {
        toast.error("El código no es válido.", { className: "toast-error" });
        }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Código inválido.", { className: "toast-error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="verify-code">        {/* <- wrapper que aísla estilos */}
      <form className="forgot-form" onSubmit={handleVerify}>
        <img className="logo-titulo" src="/logo-easyway.png" alt="Logo" />
        <p className="encontremos-text">Ingresa el código enviado a tu correo</p>

        <div className="input-wrapper">
          <input
            type="text"
            className="input-field"
            placeholder="Código de verificación"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />
        </div>

        <button className="forgot-button" disabled={loading}>
          {loading ? "Verificando..." : "Verificar código"}
        </button>
      </form>
    </div>
  );
}
