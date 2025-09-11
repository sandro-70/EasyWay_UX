// src/verificarCofigoAthenticador.jsx (o donde corresponda)
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, useContext } from "react";
import LoginUser, { validarCodigo, InformacionUser } from "./api/Usuario.Route";
import axiosInstance from "./api/axiosInstance";
import "./verificarcodigo.css";
import { UserContext } from "./components/userContext";

export default function VerificarCodigoAuth() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // Si tu UserContext expone login/logout/usario/rol:
  const { login, logout, setUserRole } = useContext(UserContext) || {};

  // Recuperado desde la pantalla de login
  const prelogin = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("prelogin") || "{}");
    } catch {
      return {};
    }
  }, []);

  const initialCorreo =
    state?.correo || prelogin?.correo || "";

  const initialPass =
    state?.contraseña ??
    state?.contrasena ??
    prelogin?.contraseña ??
    prelogin?.contrasena ??
    "";

  const [correo, setCorreo] = useState(initialCorreo);
  const [codigo, setCodigo] = useState("");
  const [pass, setPass] = useState(initialPass);
  const [loading, setLoading] = useState(false);

  // Al montar: destruye cualquier sesión previa
  useEffect(() => {
    try {
      // Context
      if (typeof logout === "function") logout();

      // LocalStorage
      localStorage.removeItem("token");
      localStorage.removeItem("rol");

      // Header global de axios
      if (axiosInstance?.defaults?.headers?.common) {
        delete axiosInstance.defaults.headers.common["Authorization"];
      }
    } catch {}
    // Si llegaron sin correo ni prelogin, mándalos a login
    if (!initialCorreo || !initialPass) {
      // Puedes permitir que escriban el correo aquí si prefieres
      // navigate("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si el usuario escribe correo manualmente
  useEffect(() => {
    if (!correo && state?.correo) setCorreo(state.correo);
  }, [state, correo]);

  const resolveRoleName = (me) => {
    if (!me) return "cliente";
    return (
      me?.rol?.nombre_rol ||
      me?.rol ||
      (typeof me?.id_rol === "number"
        ? (me.id_rol === 1 ? "administrador" : "cliente")
        : "cliente")
    );
  };

  async function handleVerify(e) {
    e.preventDefault();
    if (!correo || !codigo) return alert("Completa correo y código.");

    try {
      setLoading(true);

      // 1) Verificación del código
      const { data } = await validarCodigo(correo, codigo); // tu helper arma {correo,codigo}
      const ok = data?.ok === true || data === "Codigo valido!" || data?.valid === true;
      if (!ok) {
        alert("El código no es válido.");
        return;
      }

      // 2) Tomar la contraseña guardada por Login
      if (!pass) {
        alert("Sesión temporal expirada. Vuelve a iniciar sesión.");
        return navigate("/login");
      }

      // 3) Login REAL → crea token nuevo
      const { data: loginData } = await LoginUser({
        correo,
        contraseña: pass,
        contrasena: pass, // compatibilidad campo
      });

      const token = loginData?.token;
      if (!token) throw new Error("No se recibió token de autenticación");

      // Guardar token y restaurar header global
      localStorage.setItem("token", token);
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Actualizar Context si existe
      if (typeof login === "function") {
        try { await login(token); } catch {}
      }

      // 4) /me para resolver rol
      let me = null;
      try {
        const meRes = await InformacionUser();
        me = meRes?.data?.user ?? meRes?.data ?? null;
      } catch {
        me = null;
      }

      const roleName = resolveRoleName(me);
      localStorage.setItem("rol", roleName);
      if (typeof setUserRole === "function") setUserRole(roleName);

      // 5) Limpiar credenciales temporales y redirigir
      sessionStorage.removeItem("prelogin");

      if (roleName.toLowerCase() === "administrador") {
        navigate("/dashboard"); // tu ruta admin
      } else {
        navigate("/"); // home cliente
      }
    } catch (err) {
      console.error(err?.response?.data || err);
      alert(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Error al verificar"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="verify-code">
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
