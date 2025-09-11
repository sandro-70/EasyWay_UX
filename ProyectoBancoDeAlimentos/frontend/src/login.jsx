import "./login.css";
import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoginUser from "./api/Usuario.Route";
import { InformacionUser, forgetPassword } from "./api/Usuario.Route";
import { UserContext } from "./components/userContext";

const Login = () => {
  const [correo, setCorreo] = useState("");
  const [contraseña, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(UserContext);

  // --- Enviar código para 2FA ---
  async function enviarCodigo(correo, navigate, setLoading) {
    try {
      setLoading(true);
      await forgetPassword(correo);
      alert("Te enviamos un código a tu correo.");

      sessionStorage.setItem(
        "prelogin",
        JSON.stringify({ correo, contraseña })
      );

      navigate("/verificar-codigoAuth", { state: { correo, contraseña } });
    } catch (err) {
      alert(err?.response?.data?.error || "No se pudo enviar el correo.");
    } finally {
      setLoading(false);
    }
  }

  // --- Manejo de login ---
  const onSubmit = async (e) => {
    e.preventDefault();

    if (!correo || !contraseña) {
      alert("Ingresa correo y contraseña.");
      return;
    }

    setLoading(true);
    try {
      // 1) Intentar login
      const { data } = await LoginUser({ correo, contraseña });
      const token = data?.token;
      if (!token) throw new Error("No se recibió token de autenticación");

      // 2) Guardar token
      localStorage.setItem("token", token);
      await login(token);

      // 3) Obtener info del usuario autenticado (/me)
      let me;
      try {
        const meRes = await InformacionUser();
        me = meRes?.data?.user ?? meRes?.data ?? null;
      } catch {
        me = null;
      }

      // 4) Two-factor
      if (me?.autenticacion_dos_pasos === true) {
        await enviarCodigo(correo, navigate, setLoading);
        return;
      }

      // 5) Resolver rol
      const roleName =
        me?.rol?.nombre_rol ||
        me?.rol ||
        (typeof me?.id_rol === "number"
          ? me.id_rol === 1
            ? "administrador"
            : "cliente"
          : "cliente");

      localStorage.setItem("rol", roleName);

      // 6) Redirección por rol
      if (roleName?.toLowerCase() === "administrador") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Error en login:", err?.response?.data || err);

      const backendMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (err?.response?.status === 401
          ? "Correo o contraseña inválidos"
          : null);

      alert(backendMsg || "Error de login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form">
      <img className="logo-titulo" src="/logo-easyway.png" alt="Logo" />
      <p className="inicio-sesion-text">Inicio de Sesión</p>
      <p className="facil-text">
        Inicia sesion para comprar facil, rápido y seguro
      </p>

      <hr className="linea"></hr>

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

        <Link
          to="/forgot_password"
          className="forgot-pass-link"
          rel="noopener noreferrer"
        >
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