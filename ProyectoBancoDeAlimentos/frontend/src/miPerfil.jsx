import { useState, useEffect } from "react";
import "./miPerfil.css";
import { Link } from "react-router-dom";
import PerfilSidebar from "./components/perfilSidebar";
import { useContext } from "react";
import { UserContext } from "./components/userContext";
import { createLog, getLogsUsuario } from "./api/Usuario.Route"; // usa tu ruta real

import {
  InformacionUser,
  EditProfile,
  changePassword,
  uploadProfilePhoto,
  enviarCorreoDosPasos,
  validarCodigoDosPasos,
} from "./api/Usuario.Route";
import axiosInstance from "./api/axiosInstance";

function Icon({ name, className = "icon" }) {
  switch (name) {
    case "user":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className={className}
        >
          <circle cx="12" cy="8" r="4" strokeWidth="1.8" />
          <path d="M4 20c2-4 14-4 16 0" strokeWidth="1.8" />
        </svg>
      );
    case "mail":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className={className}
        >
          <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="1.8" />
          <path d="M3 7l9 6 9-6" strokeWidth="1.8" />
        </svg>
      );
    case "camera":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className={className}
        >
          <path d="M4 8h4l2-2h4l2 2h4v12H4z" strokeWidth="1.8" />
          <circle cx="12" cy="14" r="3.5" strokeWidth="1.8" />
        </svg>
      );
    default:
      return null;
  }
}

function Field({ label, icon, children }) {
  return (
    <div className="field-container">
      <span className="field-label">{label}</span>
      <div className="field-input">
        {icon && <span className="field-icon">{icon}</span>}
        {children}
      </div>
    </div>
  );
}

export default function MiPerfil() {
  const [telefono, setTelefono] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [correo, setCorreo] = useState("");
  const [genero, setGenero] = useState("Masculino");
  const [rol, setRol] = useState("Administrador");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [cargando, setCargando] = useState(true);
  const [datosValidos, setDatosValidos] = useState(true);
  const [editMode, setEditMode] = useState(true);
  const [fotoBase64, setFotoBase64] = useState(null);
  const { user, setUser } = useContext(UserContext);

  // NUEVOS STATES PARA MODALES 2FA
  const [showHistorial, setShowHistorial] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showTwoFactorCodeModal, setShowTwoFactorCodeModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState("");
  // tu estado historial puede quedarse (si quieres ver placeholders) — lo dejé tal cual:
  const [historial, setHistorial] = useState([
    { fecha: "14 de enero", hora: "10:45" },
    { fecha: "12 de enero", hora: "14:08" },
    { fecha: "05 de enero", hora: "16:31" },
    { fecha: "03 de enero", hora: "09:45" },
  ]);

  //funcion para manejar la subida de la foto
  const handleFotoChange = async (e) => {
    if (!editMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview local
    setFotoUrl(URL.createObjectURL(file));

    try {
      await uploadProfilePhoto(file);
      const res = await InformacionUser(); // obtiene info actualizada
      setFotoUrl(res.data.foto_perfil || "");
      setUser(res.data); // 🔹 actualiza contexto global
    } catch (err) {
      console.error("Error subiendo foto:", err);
    }
  };

  // Helper: intenta parsear muchos formatos comunes y devuelve un Date o null
  const tryParseDate = (value) => {
    if (!value && value !== 0) return null;

    // Si ya es Date
    if (value instanceof Date && !isNaN(value)) return value;

    // Números => epoch (segundos o ms)
    if (typeof value === "number") {
      const s = String(value);
      // 10 dígitos -> segundos
      if (s.length === 10) return new Date(value * 1000);
      // 13 dígitos -> ms
      if (s.length === 13) return new Date(value);
      // fallback
      const byNum = new Date(value);
      return isNaN(byNum) ? null : byNum;
    }

    // Cadenas
    if (typeof value === "string") {
      let s = value.trim();

      // /Date(1600000000000)/  -> extraer número
      const m = s.match(/\/Date\((\d+)\)\//);
      if (m) {
        const ms = Number(m[1]);
        if (!isNaN(ms)) return new Date(ms);
      }

      // Si parece un número en string
      if (/^\d{10,13}$/.test(s)) {
        const n = Number(s);
        return tryParseDate(n);
      }

      // Reemplazar espacio ' ' entre fecha y hora por 'T' (u otras transformaciones)
      const withT = s.replace(" ", "T");

      // Intento 1: Date con posible T (ISO)
      const d1 = new Date(withT);
      if (!isNaN(d1)) return d1;

      // Intento 2: añadir Z (UTC)
      const d2 = new Date(withT + "Z");
      if (!isNaN(d2)) return d2;

      // Intento 3: Date.parse directo
      const p = Date.parse(s);
      if (!isNaN(p)) return new Date(p);

      // Intento 4: regex formato "YYYY-MM-DD HH:mm:ss" u "YYYY/MM/DD HH:mm"
      const reg = s.match(
        /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/
      );
      if (reg) {
        const [_, Y, M, D, hh, mm, ss] = reg;
        // Usamos Date UTC para evitar problemas con interpretación local; si quieres local quita Date.UTC
        return new Date(
          Number(Y),
          Number(M) - 1,
          Number(D),
          Number(hh || 0),
          Number(mm || 0),
          Number(ss || 0)
        );
      }

      // Si llega hasta aquí no se pudo parsear
      return null;
    }

    // no soportado
    return null;
  };

  // Formatea la fecha a "14 de enero" y hora "10:45"
  const formatToFechaHora = (dateObj) => {
    if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj)) return null;
    const months = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = months[dateObj.getMonth()];
    const hh = String(dateObj.getHours()).padStart(2, "0");
    const mm = String(dateObj.getMinutes()).padStart(2, "0");
    return {
      fecha: `${day} de ${month}`,
      hora: `${hh}:${mm}`,
    };
  };

  // fetchHistorial robusto
  const fetchHistorial = async () => {
    const userId =
      user?.id_usuario ?? user?.id ?? user?.usuario_id ?? user?.userId ?? null;
    if (!userId) {
      setErrorHistorial("Usuario no disponible para cargar historial");
      return;
    }

    setLoadingHistorial(true);
    setErrorHistorial("");
    try {
      const res = await getLogsUsuario(userId);
      // Ver qué devuelve el backend (muy importante la primera vez)
      console.log("getLogsUsuario raw:", res?.data);

      const rawList = Array.isArray(res.data)
        ? res.data
        : res.data?.rows ?? res.data?.data ?? [];
      // Si rawList sigue vacío y res.data no es array, intenta forzar un array con res.data
      const items = Array.isArray(rawList)
        ? rawList
        : res.data
        ? [res.data]
        : [];

      const logs = items.map((item) => {
        // intenta varios campos habituales
        const candidates = [
          item.fecha_conexion,
          item.created_at,
          item.fecha_hora,
          item.timestamp,
          item.date,
          item.datetime,
          item.createdAt,
          item.fecha,
          item.log_date,
          item.time,
          item.hora,
          item.created_at_iso,
        ];

        // buscar primer candidato que no sea null/undefined
        let parsedDate = null;
        for (const cand of candidates) {
          if (
            cand !== undefined &&
            cand !== null &&
            String(cand).trim() !== ""
          ) {
            parsedDate = tryParseDate(cand);
            if (parsedDate) break;
          }
        }

        // Si no se pudo parsear con candidatos, intenta parsear todo el objeto (por si el backend devolvió solo un string)
        if (!parsedDate) {
          // hay casos donde la API devuelve solo un string (res.data = "2025-09-10T03:45:12")
          if (typeof item === "string") parsedDate = tryParseDate(item);
        }

        if (!parsedDate) {
          console.warn("No se pudo parsear fecha del log:", item);
          return { fecha: "Fecha desconocida", hora: "", raw: item };
        }

        const fh = formatToFechaHora(parsedDate);
        return { ...fh, raw: item };
      });

      setHistorial(logs);
    } catch (err) {
      console.error("Error cargando historial:", err);
      setErrorHistorial("No se pudo cargar el historial de accesos.");
    } finally {
      setLoadingHistorial(false);
    }
  };

  // carga la información del usuario autenticado
  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
        const res = await InformacionUser(1);
        const data = res.data || {};
        console.log("Datos usuario:", data);
        if (!mounted) return;

        if (!data || Object.keys(data).length === 0) {
          setDatosValidos(false);
          setCargando(false);
          return;
        }

        try {
          const userId =
            data.id_usuario ??
            data.id ??
            data.usuario_id ??
            data.userId ??
            null;
          if (userId) {
            // no bloqueamos el flujo principal si falla; sólo intentamos registrar
            createLog(userId).catch((e) =>
              console.warn("No se pudo crear log de acceso:", e)
            );
          }
        } catch (e) {
          console.warn("Error intentando crear log:", e);
        }

        setTelefono(
          data.telefono || data.numero_telefono || data.telefono_usuario || ""
        );
        setNombre(data.nombre || data.nombre_usuario || data.nombres || "");
        setApellidos(
          data.apellido || data.apellidos || data.apellido_usuario || ""
        );
        setCorreo(data.correo || data.email || "");
        if (data.genero) setGenero(data.genero);
        if (data.rol?.nombre_rol) setRol(data.rol.nombre_rol);

        if (
          data.foto_perfil_url &&
          typeof data.foto_perfil_url === "string" &&
          data.foto_perfil_url.trim() !== ""
        ) {
          setFotoUrl(data.foto_perfil_url);
        } else {
          setFotoUrl(""); // Usar imagen por defecto
        }
        setCargando(false);
      } catch (err) {
        console.error(
          "Error cargando usuario:",
          err?.response?.data || err.message || err
        );
      }
    };

    fetchUser();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!passwordError) return;

    const timer = setTimeout(() => setPasswordError(""), 2000);
    return () => clearTimeout(timer);
  }, [passwordError]);

  // FUNCIONES MODALES 2FA
  const handleSendCode = async () => {
    if (!correo) return;
    try {
      await enviarCorreoDosPasos(correo);
      alert("Se ha enviado el código a tu correo");
      setShowTwoFactorModal(false);
      setShowTwoFactorCodeModal(true);
    } catch (err) {
      console.error("Error enviando código:", err);
      alert("No se pudo enviar el código. Intenta nuevamente.");
    }
  };

  const handleVerifyCode = async () => {
    if (!twoFactorCode) return alert("Ingresa el código recibido");
    try {
      const res = await validarCodigoDosPasos(correo, twoFactorCode);
      console.log("Código verificado:", res.data);
      alert("Autenticación de dos pasos activada correctamente");
      setShowTwoFactorCodeModal(false);
      setTwoFactorCode(""); // limpiar input
    } catch (err) {
      console.error("Error verificando código:", err);
      alert("Código inválido o expirado. Intenta de nuevo.");
    }
  };

  const handleResendCode = async () => {
    try {
      await enviarCorreoDosPasos(correo);
      alert("Se ha reenviado el código a tu correo");
    } catch (err) {
      console.error("Error reenviando código:", err);
      alert("No se pudo reenviar el código. Intenta más tarde.");
    }
  };

  return (
    <div className="perfil-container">
      <section className="sidebar">
        <PerfilSidebar />
      </section>
      <h1 className="perfil-title">Editar Perfil</h1>
      <hr className="perfil-separator" />
      <p className="Datos-text">Datos Generales</p>

      <div className="perfil-content">
        <aside className="perfil-sidebar">
          <div className="perfil-avatar">
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt="Foto de perfil"
                className="perfil-avatar-image"
              />
            ) : (
              <div className="perfil-avatar-placeholder">
                <Icon name="user" className="icon-large" />
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            id="foto-input"
            onChange={handleFotoChange}
          />
          <button
            className="editar-boton"
            onClick={() => {
              if (editMode) document.getElementById("foto-input").click();
            }}
            disabled={!editMode}
          >
            <Icon name="camera" className="icon-small" />
            <span>Editar foto</span>
          </button>
        </aside>

        <section className="perfil-card">
          <div className="fields-grid">
            <Field label="Telefono" icon={<Icon name="number" />}>
              <input
                placeholder="Telefono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                disabled={!editMode}
              />
            </Field>

            <Field label="Nombre" icon={<Icon name="user" />}>
              <input
                placeholder="Juan Javier"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={!editMode}
              />
            </Field>
            <Field label="Correo" icon={<Icon name="mail" />}>
              <input
                placeholder="ejemplo@gmail.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                disabled={!editMode}
              />
            </Field>
            <Field label="Apellidos" icon={<Icon name="user" />}>
              <input
                placeholder="Perez Maldonado"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                disabled={!editMode}
              />
            </Field>
            <Field label="Género">
              <select
                value={genero}
                onChange={(e) => setGenero(e.target.value)}
                disabled={!editMode}
              >
                <option>Masculino</option>
                <option>Femenino</option>
                <option>Otro</option>
              </select>
            </Field>
          </div>

          {!editMode ? (
            <button className="boton-editar" onClick={() => setEditMode(true)}>
              Editar
            </button>
          ) : (
            <div className="botones-accion">
              <button
                className="boton-guardar"
                onClick={async () => {
                  try {
                    const payload = {
                      telefono,
                      nombre,
                      apellido: apellidos,
                      correo,
                      genero,
                      foto_perfil_url: fotoUrl,
                    };
                    await axiosInstance.put("/api/MiPerfil/perfil", payload);
                    const fullRes = await InformacionUser();
                    setUser(fullRes.data);
                    setEditMode(false);
                  } catch (err) {
                    console.error(
                      "Error guardando perfil:",
                      err?.response?.data || err.message || err
                    );
                  }
                }}
              >
                Guardar
              </button>
              <button
                className="boton-cancelar"
                onClick={() => {
                  setEditMode(false);
                  window.location.reload();
                }}
              >
                Cancelar
              </button>
            </div>
          )}

          {showPasswordModal && (
            <div className="modal-overlay">
              <div className="mPerfil-modal">
                <div className="modal-headerr">
                  <h3 className="label-modal-confirm">Cambio de contraseña</h3>
                  <button
                    className="mPerfil-cancel-button"
                    onClick={() => setShowPasswordModal(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="modal-body">
                  <label>Contraseña anterior</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                  <label>Nueva contraseña</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <label>Confirmación de nueva contraseña</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {passwordError && (
                    <p
                      className="password-error"
                      role="alert"
                      aria-live="assertive"
                    >
                      {passwordError}
                    </p>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="btn-danger"
                  >
                    Cancelar
                  </button>
                  <button
                    className="MPbtn-secondary"
                    onClick={async () => {
                      setPasswordError("");
                      if (!oldPassword || !newPassword || !confirmPassword) {
                        setPasswordError("Completa todos los campos");
                        return;
                      }
                      if (newPassword !== confirmPassword) {
                        setPasswordError(
                          "La nueva contraseña y la confirmación no coinciden"
                        );
                        return;
                      }
                      if (newPassword.length < 6) {
                        setPasswordError(
                          "La contraseña debe tener al menos 6 caracteres"
                        );
                        return;
                      }

                      try {
                        setPasswordLoading(true);
                        await axiosInstance.post("/api/auth/login", {
                          correo,
                          ["contraseña"]: oldPassword,
                        });
                        await changePassword(correo, newPassword);
                        setOldPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setShowPasswordModal(false);
                      } catch (err) {
                        const msg =
                          err?.response?.data?.message ||
                          err?.response?.data ||
                          err.message ||
                          String(err);
                        setPasswordError(
                          msg.includes("Contraseña incorrecta")
                            ? "Contraseña anterior incorrecta"
                            : msg
                        );
                        console.error("Error cambiando contraseña:", err);
                      } finally {
                        setPasswordLoading(false);
                      }
                    }}
                  >
                    {passwordLoading ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- MODALES 2FA INTEGRADOS ---------------- */}
          {showTwoFactorModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-0 relative">
                <div className="bg-[#2b6daf] text-white text-center py-2">
                  <h2 className="font-semibold text-lg">
                    Activar autenticación en dos pasos
                  </h2>
                </div>
                <button
                  className="absolute top-3 right-3 text-white hover:text-gray-200"
                  onClick={() => setShowTwoFactorModal(false)}
                >
                  ✖
                </button>
                <div className="p-6">
                  <div className="flex justify-center mb-4">
                    <img src="two-factor.png" alt="2FA" className="w-24 h-24" />
                  </div>
                  <div className="flex flex-col gap-3 mb-4">
                    <label className="flex items-center gap-2 border border-[#2b6daf] p-2 rounded">
                      <input
                        type="radio"
                        name="twofactor"
                        className="accent-[#2b6daf] align-middle m-0"
                      />
                      <span className="align-middle">
                        Enviar correo al ***@gmail.com
                      </span>
                    </label>
                  </div>
                  <button
                    className="w-full bg-[#2b6daf] hover:bg-blue-700 text-white py-2 rounded-md"
                    onClick={handleSendCode}
                  >
                    Enviar código
                  </button>
                </div>
              </div>
            </div>
          )}

          {showTwoFactorCodeModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-0 relative">
                <div className="bg-[#2b6daf] text-white text-center py-2">
                  <h2 className="font-semibold text-lg">
                    Activar autenticación en dos pasos
                  </h2>
                </div>
                <button
                  className="absolute top-3 right-3 text-white hover:text-gray-200"
                  onClick={() => setShowTwoFactorCodeModal(false)}
                >
                  ✖
                </button>
                <div className="p-6">
                  <div className="flex flex-col items-center mb-4">
                    <img
                      src="two-factor.png"
                      alt="2FA"
                      className="w-24 h-24 mb-2"
                    />
                    <p className="text-center text-gray-700 text-sm">
                      Por tu seguridad, ingresa el código que te hemos enviado
                    </p>
                  </div>
                  <div className="mb-4">
                    <input
                      type="text"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      placeholder="Ingresa el código"
                      className="w-full border border-[#2b6daf] rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#2b6daf]"
                    />
                  </div>
                  <button
                    className="w-full bg-[#2b6daf] hover:bg-blue-700 text-white py-2 rounded-md mb-2"
                    onClick={handleVerifyCode}
                  >
                    Verificar
                  </button>
                  <div className="text-center">
                    <button
                      className="text-[#2b6daf] text-sm hover:underline"
                      onClick={handleResendCode}
                    >
                      Reenviar código
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- MODAL HISTORIAL DE ACCESOS ---------------- */}
          {showHistorial && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div
                className="bg-white rounded-lg shadow-lg w-full max-w-xl p-0 relative "
                style={{ marginTop: "80px" }}
              >
                <div className="bg-[#2b6daf] text-white text-center py-3 rounded-t-lg">
                  <h2 className="font-semibold text-lg">
                    Historial de accesos
                  </h2>
                </div>
                <button
                  className="absolute top-3 right-3 text-white hover:text-gray-200"
                  onClick={() => setShowHistorial(false)}
                >
                  ✖
                </button>

                <div className="p-6">
                  {/* Card estilo similar a la imagen */}
                  <div
                    className="historial-card mx-auto"
                    style={{
                      maxWidth: "520px",
                      borderRadius: 8,
                      border: "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    {/* header ya mostrado arriba — mantenemos espacio si quieres */}
                    <div style={{ padding: "8px 16px" }}>
                      {loadingHistorial ? (
                        <p className="text-center text-gray-500">
                          Cargando historial...
                        </p>
                      ) : errorHistorial ? (
                        <p className="text-center text-red-500">
                          {errorHistorial}
                        </p>
                      ) : (
                        <div
                          className="historial-list"
                          style={{
                            maxHeight: 260,
                            overflowY: "auto",
                            paddingRight: 8,
                          }}
                        >
                          <ul
                            style={{ listStyle: "none", margin: 0, padding: 0 }}
                          >
                            {historial.length > 0 ? (
                              historial.map((item, idx) => (
                                <li
                                  key={idx}
                                  className="flex justify-between items-center py-2"
                                >
                                  <span className="text-gray-700">
                                    {item.fecha}
                                    {item.hora ? `, ${item.hora}` : ""}
                                  </span>
                                </li>
                              ))
                            ) : (
                              <li className="flex justify-center text-gray-500 py-2">
                                No hay registros de acceso.
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div style={{ padding: "16px", textAlign: "center" }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="configuracion-container">
        <h1 className="Config">Configuracion</h1>
        <div className="candado-link">
          <img src="/Vector.png" alt="imagen" className="candado" />
          <Link
            to="#"
            className="new-link"
            onClick={() => setShowPasswordModal(true)}
          >
            Cambiar contraseña
          </Link>
        </div>
        <div className="f2-autenticacion">
          <img src="/f2.png" alt="imagen" className="f2" />
          <Link
            to="#"
            className="new-link"
            onClick={(e) => {
              e.preventDefault();
              setShowTwoFactorModal(true);
            }}
          >
            Autenticación en dos pasos
          </Link>
        </div>
        <div className="historial">
          <img
            src="/historial-perfil.png"
            alt="imagen"
            className="historial-icono"
          />
          <Link
            to="#"
            className="new-link"
            onClick={(e) => {
              e.preventDefault();
              fetchHistorial();
              setShowHistorial(true);
            }}
          >
            Historial de Acceso
          </Link>
        </div>
      </section>
    </div>
  );
}
