// src/login.jsx
import "./login.css";
import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoginUser from "./api/Usuario.Route";
import { InformacionUser, forgetPassword } from "./api/Usuario.Route";
import { UserContext } from "./components/userContext";
import { toast } from "react-toastify";
import "./toast.css";

/* Helpers (foto desde token) */
function parseJwt(token) {
  try {
    if (!token) return null;
    const b = token.split(".")[1];
    if (!b) return null;
    const j = atob(b.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(
      decodeURIComponent(
        [...j].map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
      )
    );
  } catch {
    return null;
  }
}
const fileNameFromPath = (p) => (!p ? "" : String(p).split("/").pop());

const Login = () => {
  const [correo, setCorreo] = useState("");
  const [contraseña, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { login, setUser } = useContext(UserContext);

  async function enviarCodigo(correo, navigate, setLoading) {
    try {
      setLoading(true);
      await forgetPassword(correo);
      toast.info("Te enviamos un código a tu correo.", { className: "toast-info" });

      sessionStorage.setItem("prelogin", JSON.stringify({ correo, contraseña }));
      navigate("/verificar-codigoAuth", { state: { correo, contraseña } });
    } catch (err) {
      toast.error(err?.response?.data?.error || "No se pudo enviar el correo.", { className: "toast-error" });
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!correo) {
      toast.warn("Ingresa correo electrónico.", { className: "toast-warn" });
      return;
    }else if(!contraseña){
      toast.warn("Ingresa la contraseña.", { className: "toast-warn" });
      return;
    }

    setLoading(true);
    try {
      // 1) login
      const { data } = await LoginUser({ correo, contraseña });
      const token = data?.token;
      if (!token) throw new Error("No se recibió token de autenticación");
      localStorage.setItem("token", token);
      toast.success("Inicio de sesión exitoso", { className: "toast-success" });

      // 2) Empujar foto desde token inmediatamente (si existe)
      const claims = parseJwt(token);
      const claimFotoRaw =
        (claims?.user &&
          (claims.user.foto_perfil_url || claims.user.foto_perfil || claims.user.foto)) ||
        claims?.foto_perfil_url ||
        claims?.foto ||
        "";
      const claimFotoName = fileNameFromPath(claimFotoRaw);
      if (claimFotoName) {
        setUser((prev) => ({
          ...(prev || {}),
          foto_perfil_url: claimFotoName,
          avatar_rev: Date.now(),
        }));
      }

      // 3) refrescar contexto (rol/demás)
      await login(token);

      // 4) fetch de usuario
      let me = null;
      try {
        const meRes = await InformacionUser();
        me = meRes?.data?.user ?? meRes?.data ?? null;
      } catch {
        me = null;
      }

      // 5) 2FA
      if (me?.autenticacion_dos_pasos === true) {
        await enviarCodigo(correo, navigate, setLoading);
        return;
      }
// 6) rol y privilegios
const mapRoleNameById = (id) => {
  switch (Number(id)) {
    case 1: return "administrador";
    case 2: return "cliente";
    case 3: return "consultor";
    default: return "";
  }
};

const roleId = Number(me?.rol?.id_rol ?? me?.id_rol);
let roleName = (me?.rol?.nombre_rol || me?.rol || mapRoleNameById(roleId) || "").toLowerCase();

localStorage.setItem("rol", roleName);

// si quieres guardar privilegios del consultor (opcional, tu ProtectedRoute ya consulta al backend)
if (roleName === "consultor" && Array.isArray(me?.privilegios)) {
  localStorage.setItem("privilegios", JSON.stringify(me.privilegios));
}

// 8) navegación
if (roleName === "administrador" || roleName === "consultor") {
  navigate("/dashboard");
} else {
  navigate("/");
}

    } catch (err) {
      console.error("Error en login:", err?.response?.data || err);
      const backendMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (err?.response?.status === 401 ? "Correo o contraseña inválidos" : null);
      toast.error(backendMsg || "Error de login", { className: "toast-error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form">
      <img className="logo-titulo" src="/logo-easyway.png" alt="Logo" />
      <p className="inicio-sesion-text">Inicio de Sesión</p>
      <p className="facil-text">Inicia sesion para comprar facil, rápido y seguro</p>

      <hr className="linea" />

      <form onSubmit={onSubmit}>
        <div className="input-wrapper" style={{ marginLeft: 0 }}>
          <input
            type="email"
            className="input-field"
            placeholder="Correo electrónico"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            type="password"
            className="input-field"
            placeholder="Contraseña"
            value={contraseña}
            onChange={(e) => setContrasena(e.target.value)}
            autoComplete="current-password"
            required
            minLength={4}
          />
        </div>

        <Link to="/forgot_password" className="forgot-pass-link" rel="noopener noreferrer">
          ¿Olvidaste tu contraseña?
        </Link>

        <button className="login-button" disabled={loading}>
          {loading ? "Cargando..." : "Inicia Sesión"}
        </button>
      </form>
      <Link to="/crear_cuenta" className="new-link" rel="noopener noreferrer">
        ¿Nuevo aquí?
      </Link>
    </div>
  );
};

export default Login;
