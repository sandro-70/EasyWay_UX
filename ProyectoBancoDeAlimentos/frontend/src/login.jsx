import "./login.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoginUser from "./api/Usuario.Route";
import { InformacionUser, forgetPassword } from "./api/Usuario.Route";
import { useContext } from "react";
import { UserContext } from "./components/userContext";
const Login = () => {
  const [correo, setCorreo] = useState("");
  const [contraseña, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(UserContext);

  // Asegúrate de importar estas funciones correctamente
  // import { LoginUser, InformacionUser, forgetPassword } from "./api/Usuario.Route";

  async function enviarCodigo(correo, navigate, setLoading) {
    try {
      setLoading(true);
      // En la mayoría de APIs el body es un objeto:
      await forgetPassword(correo); // 👈 importante: objeto, no string
      alert("Te enviamos un código a tu correo.");

      sessionStorage.setItem(
        "prelogin",
        JSON.stringify({ correo, contraseña })
      );

      // 3) Vamos a verificar el código; ahí recién haremos el login real
      navigate("/verificar-codigoAuth", { state: { correo, contraseña } });
    } catch (err) {
      alert(err?.response?.data?.error || "No se pudo enviar el correo.");
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    const { data } = await LoginUser({ correo, contraseña });
    if (!data?.token) throw new Error("No se recibió token");

    await login(data.token);
    if (!correo || !contraseña) {
      alert("Ingresa correo y contraseña.");
      return;
    }

    setLoading(true);
    try {
      // 1) Login
      const { data } = await LoginUser({ correo, contraseña });
      const token = data?.token;
      if (!token) throw new Error("No se recibió token de autenticación");

      // 2) Guardar token
      localStorage.setItem("token", token);

      // 3) Obtener info del usuario autenticado (/me)
      let me;
      try {
        const meRes = await InformacionUser(); // 👈 sin parámetros
        // Si tu backend responde { userId, role, user: {...} }
        me = meRes?.data?.user ?? meRes?.data ?? null;
      } catch {
        me = null; // si falla, tratamos como cliente
      }

      // 4) Two-factor (si está activo, salimos luego de navegar)
      if (me?.autenticacion_dos_pasos === true) {
        await enviarCodigo(correo, navigate, setLoading); // 👈 hace navigate y finaliza loading
        return; // 👈 muy importante para NO continuar con más navegación
      }

      // 5) Resolver rol
      const roleName =
        me?.rol?.nombre_rol || // { rol: { nombre_rol: 'administrador' } }
        me?.rol || // 'administrador'
        (typeof me?.id_rol === "number" // numérico (1 admin, otro cliente)
          ? me.id_rol === 1
            ? "administrador"
            : "cliente"
          : "cliente");

      localStorage.setItem("rol", roleName);

      // 6) Redirección por rol (una sola navegación)
      if (roleName?.toLowerCase() === "administrador") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error(err?.response?.data || err);
      alert(err?.response?.data?.message || "Error de login");
    } finally {
      // OJO: si hubo 2FA, ya hicimos setLoading(false) dentro de enviarCodigo
      // pero este finally igual lo pondrá false de nuevo (no pasa nada)
      setLoading(false);
    }
  };

  return (
    <div className="login-form">
      <img className="logo-titulo" src="/logo-easyway.png" alt="Logo" />
      <p className="inicio-sesion-text">Inicio de Sesión</p>
      <p className="facil-text">
        Inicia sesion para comprar facil, rapido y seguro
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
          Olvidaste tu contraseña?
        </Link>

        <button className="login-button" disabled={loading}>
          {loading ? "Cargando..." : "Inicia Sesión"}
        </button>
      </form>
      <Link to="/crear_cuenta" className="new-link" rel="noopener noreferrer">
        Nuevo aquí?
      </Link>
    </div>
  );
};

export default Login;
