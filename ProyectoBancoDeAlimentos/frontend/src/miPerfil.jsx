// src/miPerfil.jsx
import { useState, useEffect, useContext, useRef } from "react";
import "./miPerfil.css";
import { Link } from "react-router-dom";
import PerfilSidebar from "./components/perfilSidebar";
import { UserContext } from "./components/userContext";
import { createLog, getLogsUsuario } from "./api/Usuario.Route";
import {
  InformacionUser,
  changePassword,
  uploadProfilePhoto1,
  enviarCorreoDosPasos,
  validarCodigoDosPasos,
} from "./api/Usuario.Route";
import axiosInstance from "./api/axiosInstance";

/* ===================== ORIGIN backend + helpers ===================== */
const BACKEND_ORIGIN = (() => {
  const base = axiosInstance?.defaults?.baseURL;
  try {
    const u = base
      ? (base.startsWith("http") ? new URL(base) : new URL(base, window.location.origin))
      : new URL(window.location.origin);
    return `${u.protocol}//${u.host}`;
  } catch {
    return window.location.origin;
  }
})();

const backendImageUrl = (fileName) =>
  fileName ? `${BACKEND_ORIGIN}/api/images/fotoDePerfil/${encodeURIComponent(fileName)}` : "";

const toPublicFotoSrc = (nameOrPath) => {
  if (!nameOrPath) return "";
  if (/^https?:\/\//i.test(nameOrPath)) return nameOrPath;
  if (nameOrPath.startsWith("/api/images/")) return `${BACKEND_ORIGIN}${encodeURI(nameOrPath)}`;
  if (nameOrPath.startsWith("/images/")) return `${BACKEND_ORIGIN}/api${encodeURI(nameOrPath)}`;
  return backendImageUrl(nameOrPath);
};

const fileNameFromPath = (p) => (!p ? "" : String(p).split("/").pop() || "");

const getExt = (file) => {
  const byName = file?.name?.match(/\.(\w{1,8})$/i)?.[1];
  if (byName) return `.${byName}`;
  const map = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/bmp": ".bmp",
    "image/svg+xml": ".svg",
  };
  return map[file?.type] || ".png";
};

const getUserId = (u) => u?.id_usuario ?? u?.id ?? u?.usuario_id ?? u?.userId ?? 1;
const buildIdProfileFileName = (userObj, file) => `user_${getUserId(userObj)}${getExt(file)}`;

/* ===================== UI helpers ===================== */
function Icon({ name, className = "icon" }) {
  switch (name) {
    case "user":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
          <circle cx="12" cy="8" r="4" strokeWidth="1.8" />
          <path d="M4 20c2-4 14-4 16 0" strokeWidth="1.8" />
        </svg>
      );
    case "mail":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
          <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="1.8" />
          <path d="M3 7l9 6 9-6" strokeWidth="1.8" />
        </svg>
      );
    case "camera":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
          <path d="M4 8h4l2-2h4l2 2h4v12H4z" strokeWidth="1.8" />
          <circle cx="12" cy="14" r="3.5" strokeWidth="1.8" />
        </svg>
      );
    case "number":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
          <path d="M6 2h12v20H6z" strokeWidth="1.8" />
          <circle cx="12" cy="18" r="1.5" strokeWidth="1.8" />
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

/* =============================== COMPONENTE =============================== */
export default function MiPerfil() {
  // form
  const [telefono, setTelefono] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [correo, setCorreo] = useState("");
  const [genero, setGenero] = useState("masculino");
  const [rol, setRol] = useState("");

  // UI
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // foto
  const [fotoUrl, setFotoUrl] = useState("");
  const [fotoFileName, setFotoFileName] = useState("");
  const [fotoCandidates, setFotoCandidates] = useState([]);
  const [fotoIdx, setFotoIdx] = useState(0);

  // estados auxiliares
  const [cargando, setCargando] = useState(true);

  // solo lectura por defecto
  const [editMode, setEditMode] = useState(false);

  const { user, setUser } = useContext(UserContext);

  // 2FA + historial
  const [showHistorial, setShowHistorial] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showTwoFactorCodeModal, setShowTwoFactorCodeModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState("");
  const [historial, setHistorial] = useState([]);

  // file input ref
  const fileInputRef = useRef(null);

  // snapshot para cancelar
  const [snapshot, setSnapshot] = useState(null);

  // Context helper
  const pushUserToContext = (payload) => {
    const cleanName = fileNameFromPath(
      payload?.foto_perfil_url || payload?.foto_perfil || payload?.foto || ""
    );
    setUser((prev) => ({
      ...(prev || {}),
      ...(payload || {}),
      foto_perfil_url: cleanName,
    }));
  };

  /* ---------- helpers foto ---------- */
  const buildFotoCandidates = (dataObj, ctx) => {
    const uid = getUserId(dataObj || ctx || {});
    const list = [];
    const push = (v) => {
      const n = fileNameFromPath(v);
      if (n && !list.includes(n)) list.push(n);
    };

    // 1) Preferir lo que venga de la API
    push(dataObj?.foto_perfil_url);
    push(dataObj?.foto_perfil);
    push(dataObj?.foto);

    // 2) Luego lo que haya en el contexto (el header suele tenerlo)
    push(ctx?.foto_perfil_url);
    push(ctx?.foto);

    // 3) Por si no viene nada, probar convenciones por id
    if (uid) {
      ["jpg", "png", "webp"].forEach((ext) => list.push(`user_${uid}.${ext}`));
    }
    return list;
  };

  const advanceCandidate = () => {
    setFotoIdx((i) => (i + 1 < fotoCandidates.length ? i + 1 : i));
  };

  /* =================== SUBIR FOTO (solo en modo edición) =================== */
  const handleFotoChange = async (e) => {
    if (!editMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // preview inmediata
    setFotoUrl(URL.createObjectURL(file));

    const fileNameById = buildIdProfileFileName(user, file);
    try {
      const { data } = await uploadProfilePhoto1(file, fileNameById);
      const filename = data?.filename || fileNameById;

      // releer usuario
      const res = await InformacionUser();
      const data1 = res?.data?.user ?? res?.data ?? {};
      const justName = fileNameFromPath(
        data1.foto_perfil_url || data1.foto_perfil || data1.foto || filename
      );

      // actualiza candidatos y selección
      const cands = buildFotoCandidates(data1, user);
      setFotoCandidates(cands);
      setFotoIdx(0);

      setFotoFileName(justName);
      setFotoUrl(`${toPublicFotoSrc(justName)}?t=${Date.now()}`);

      pushUserToContext({ ...data1, foto_perfil_url: justName });
      setUser((prev) => ({ ...(prev || {}), foto_perfil_url: justName, avatar_rev: Date.now() }));
    } catch (err) {
      console.error("Error subiendo foto:", err);
      alert("No se pudo subir la foto.");
      setFotoUrl(""); // vuelve al placeholder
    }
  };

  /* =================== HISTORIAL =================== */
  const tryParseDate = (value) => {
    if (!value && value !== 0) return null;
    if (value instanceof Date && !isNaN(value)) return value;
    if (typeof value === "number") {
      const s = String(value);
      if (s.length === 10) return new Date(value * 1000);
      if (s.length === 13) return new Date(value);
      const byNum = new Date(value);
      return isNaN(byNum) ? null : byNum;
    }
    if (typeof value === "string") {
      let s = value.trim();
      const m = s.match(/\/Date\((\d+)\)\//);
      if (m) {
        const ms = Number(m[1]);
        if (!isNaN(ms)) return new Date(ms);
      }
      if (/^\d{10,13}$/.test(s)) return tryParseDate(Number(s));
      const withT = s.replace(" ", "T");
      const d1 = new Date(withT);
      if (!isNaN(d1)) return d1;
      const d2 = new Date(withT + "Z");
      if (!isNaN(d2)) return d2;
      const p = Date.parse(s);
      if (!isNaN(p)) return new Date(p);
      const reg = s.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
      if (reg) {
        const [_, Y, M, D, hh, mm, ss] = reg;
        return new Date(Number(Y), Number(M) - 1, Number(D), Number(hh || 0), Number(mm || 0), Number(ss || 0));
      }
      return null;
    }
    return null;
  };

  const formatToFechaHora = (dateObj) => {
    if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj)) return null;
    const months = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const month = months[dateObj.getMonth()];
    const hh = String(dateObj.getHours()).padStart(2, "0");
    const mm = String(dateObj.getMinutes()).padStart(2, "0");
    return { fecha: `${dd} de ${month}`, hora: `${hh}:${mm}` };
  };

  const fetchHistorial = async () => {
    const uid = getUserId(user);
    if (!uid) {
      setErrorHistorial("Usuario no disponible para cargar historial");
      return;
    }
    setLoadingHistorial(true);
    setErrorHistorial("");
    try {
      const res = await getLogsUsuario(uid);
      const rawList = Array.isArray(res.data) ? res.data : res.data?.rows ?? res.data?.data ?? [];
      const items = Array.isArray(rawList) ? rawList : res.data ? [res.data] : [];
      const logs = items.map((item) => {
        const candidates = [
          item.fecha_conexion, item.created_at, item.fecha_hora, item.timestamp,
          item.date, item.datetime, item.createdAt, item.fecha, item.log_date,
          item.time, item.hora, item.created_at_iso,
        ];
        let parsedDate = null;
        for (const cand of candidates) {
          if (cand !== undefined && cand !== null && String(cand).trim() !== "") {
            parsedDate = tryParseDate(cand);
            if (parsedDate) break;
          }
        }
        if (!parsedDate && typeof item === "string") parsedDate = tryParseDate(item);
        if (!parsedDate) return { fecha: "Fecha desconocida", hora: "", raw: item };
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

  /* ==================== CARGA INICIAL ==================== */
  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        const res = await InformacionUser(); // igual que Admin
        const data = res?.data?.user ?? res?.data ?? {};
        if (!mounted) return;

        // log acceso (best effort)
        const uid = getUserId(data);
        if (uid) createLog(uid).catch(() => {});

        // form
        setTelefono(data.telefono || data.numero_telefono || data.telefono_usuario || "");
        setNombre(data.nombre || data.nombre_usuario || data.nombres || "");
        setApellidos(data.apellido || data.apellidos || data.apellido_usuario || "");
        setCorreo(data.correo || data.email || "");
        if (data.genero) setGenero(String(data.genero).toLowerCase());
        if (data.rol?.nombre_rol) setRol(data.rol.nombre_rol);

        // candidatos de foto (API → Context → convenciones)
        const cands = buildFotoCandidates(data, user);
        setFotoCandidates(cands);
        setFotoIdx(0);

        const first = cands[0] || "";
        if (first) {
          setFotoFileName(first);
          setFotoUrl(`${toPublicFotoSrc(first)}?t=${Date.now()}`);
        } else {
          setFotoFileName("");
          setFotoUrl("");
        }

        // snapshot
        setSnapshot({
          telefono: data.telefono || data.numero_telefono || data.telefono_usuario || "",
          nombre: data.nombre || data.nombre_usuario || data.nombres || "",
          apellidos: data.apellido || data.apellidos || data.apellido_usuario || "",
          correo: data.correo || data.email || "",
          genero: String(data.genero || "masculino").toLowerCase(),
          fotoFileName: first || "",
          fotoUrl: first ? `${toPublicFotoSrc(first)}?t=${Date.now()}` : "",
        });

        // empuja al contexto lo que tengamos (útil para el Header)
        if (first) pushUserToContext({ ...data, foto_perfil_url: first });

        setCargando(false);
      } catch (err) {
        console.error("Error cargando usuario:", err?.response?.data || err.message || err);
        setCargando(false);
      }
    };

    fetchUser();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // si una imagen falla, probar la siguiente extensión/candidato
  useEffect(() => {
    const next = fotoCandidates[fotoIdx];
    if (!next) return;
    setFotoUrl(`${toPublicFotoSrc(next)}?t=${Date.now()}`);
    setFotoFileName(next);
  }, [fotoIdx, fotoCandidates]);

  useEffect(() => {
    if (!passwordError) return;
    const timer = setTimeout(() => setPasswordError(""), 2000);
    return () => clearTimeout(timer);
  }, [passwordError]);

  /* ==================== EDITAR / GUARDAR / CANCELAR ==================== */
  const enterEdit = () => {
    setSnapshot({ telefono, nombre, apellidos, correo, genero, fotoFileName, fotoUrl });
    setEditMode(true);
  };

  const handleSave = async () => {
    try {
      const nombreParaBD = fotoFileName || fileNameFromPath(fotoUrl) || "";
      const payload = {
        telefono,
        nombre,
        apellido: apellidos,
        correo,
        genero,
        foto_perfil_url: nombreParaBD,
      };

      await axiosInstance.put("/api/MiPerfil/perfil", payload);

      // releer usuario
      const fullRes = await InformacionUser();
      const data = fullRes?.data?.user ?? fullRes?.data ?? {};
      const fromApi = data.foto_perfil_url || data.foto_perfil || data.foto || nombreParaBD || "";
      const freshName = fileNameFromPath(fromApi) || "";

      const freshUrl = freshName ? `${toPublicFotoSrc(freshName)}?t=${Date.now()}` : "";
      setFotoFileName(freshName);
      setFotoUrl(freshUrl);
      setUser({ ...data, foto_perfil_url: freshName, avatar_rev: Date.now() });

      setSnapshot({ telefono, nombre, apellidos, correo, genero, fotoFileName: freshName, fotoUrl: freshUrl });
      setEditMode(false);
    } catch (err) {
      console.error("Error guardando perfil:", err?.response?.data || err.message || err);
      alert("No se pudo guardar el perfil.");
    }
  };

  const handleCancel = () => {
    if (snapshot) {
      setTelefono(snapshot.telefono || "");
      setNombre(snapshot.nombre || "");
      setApellidos(snapshot.apellidos || "");
      setCorreo(snapshot.correo || "");
      setGenero(snapshot.genero || "masculino");
      setFotoFileName(snapshot.fotoFileName || "");
      setFotoUrl(snapshot.fotoUrl || "");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setEditMode(false);
  };

  /* ==================== 2FA ==================== */
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
      await validarCodigoDosPasos(correo, twoFactorCode);
      alert("Autenticación de dos pasos activada correctamente");
      setShowTwoFactorCodeModal(false);
      setTwoFactorCode("");
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

  /* ==================== RENDER ==================== */
  if (cargando) return null;

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
                onError={advanceCandidate} // si falla, probar el siguiente candidato
              />
            ) : (
              <div className="perfil-avatar-placeholder">
                <Icon name="user" className="icon-large" />
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            id="foto-input"
            onChange={handleFotoChange}
          />

          <button
            className="editar-boton"
            onClick={() => editMode && document.getElementById("foto-input").click()}
            disabled={!editMode}
            title={editMode ? "Cambiar foto" : "Pulsa Editar para cambiar la foto"}
          >
            <Icon name="camera" className="icon-small" />
            <span>Editar foto</span>
          </button>
        </aside>

        <section className="perfil-card">
          <div className="fields-grid">
            <Field label="Nombre" icon={<Icon name="user" />}>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan Javier" disabled={!editMode} />
            </Field>

            <Field label="Correo" icon={<Icon name="mail" />}>
              <input value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="ejemplo@gmail.com" disabled={!editMode} />
            </Field>

            <Field label="Telefono" icon={<Icon name="number" />}>
              <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Telefono" disabled={!editMode} />
            </Field>

            <Field label="Apellidos" icon={<Icon name="user" />}>
              <input value={apellidos} onChange={(e) => setApellidos(e.target.value)} placeholder="Perez Maldonado" disabled={!editMode} />
            </Field>

            <Field label="Género">
              <select value={genero} onChange={(e) => setGenero(e.target.value)} disabled={!editMode}>
                <option>masculino</option>
                <option>femenino</option>
                <option>otro</option>
              </select>
            </Field>
          </div>

          {!editMode ? (
            <button className="boton-editar" onClick={enterEdit}>Editar</button>
          ) : (
            <div className="botones-accion">
              <button className="boton-guardar" onClick={handleSave}>Guardar</button>
              <button className="boton-cancelar" onClick={handleCancel}>Cancelar</button>
            </div>
          )}

          {/* --------- MODAL CAMBIO DE PASSWORD --------- */}
          {showPasswordModal && (
            <div className="modal-overlay">
              <div className="mPerfil-modal">
                <div className="modal-headerr">
                  <h3 className="label-modal-confirm">Cambio de contraseña</h3>
                  <button className="mPerfil-cancel-button" onClick={() => setShowPasswordModal(false)}>✕</button>
                </div>
                <div className="modal-body">
                  <label>Contraseña anterior</label>
                  <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                  <label>Nueva contraseña</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <label>Confirmación de nueva contraseña</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  {passwordError && <p className="password-error" role="alert" aria-live="assertive">{passwordError}</p>}
                </div>
                <div className="modal-footer">
                  <button onClick={() => setShowPasswordModal(false)} className="btn-danger">Cancelar</button>
                  <button
                    className="MPbtn-secondary"
                    onClick={async () => {
                      setPasswordError("");
                      if (!oldPassword || !newPassword || !confirmPassword) return setPasswordError("Completa todos los campos");
                      if (newPassword !== confirmPassword) return setPasswordError("La nueva contraseña y la confirmación no coinciden");
                      if (newPassword.length < 6) return setPasswordError("La contraseña debe tener al menos 6 caracteres");
                      try {
                        setPasswordLoading(true);
                        await axiosInstance.post("/api/auth/login", { correo, ["contraseña"]: oldPassword });
                        await changePassword(correo, newPassword);
                        setOldPassword(""); setNewPassword(""); setConfirmPassword("");
                        setShowPasswordModal(false);
                      } catch (err) {
                        const msg = err?.response?.data?.message || err?.response?.data || err.message || String(err);
                        setPasswordError(msg.includes("Contraseña incorrecta") ? "Contraseña anterior incorrecta" : msg);
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

          {/* --------- MODALES 2FA --------- */}
          {showTwoFactorModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-0 relative">
                <div className="bg-[#2b6daf] text-white text-center py-2"><h2 className="font-semibold text-lg">Activar autenticación en dos pasos</h2></div>
                <button className="absolute top-3 right-3 text-white hover:text-gray-200" onClick={() => setShowTwoFactorModal(false)}>✕</button>
                <div className="p-6">
                  <div className="flex justify-center mb-4"><img src="two-factor.png" alt="2FA" className="w-24 h-24" /></div>
                  <div className="flex flex-col gap-3 mb-4">
                    <label className="flex items-center gap-2 border border-[#2b6daf] p-2 rounded">
                      <input type="radio" name="twofactor" className="accent-[#2b6daf] align-middle m-0" />
                      <span className="align-middle">Enviar correo al ***@gmail.com</span>
                    </label>
                  </div>
                  <button className="w-full bg-[#2b6daf] hover:bg-blue-700 text-white py-2 rounded-md" onClick={handleSendCode}>Enviar código</button>
                </div>
              </div>
            </div>
          )}

          {showTwoFactorCodeModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-0 relative">
                <div className="bg-[#2b6daf] text-white text-center py-2"><h2 className="font-semibold text-lg">Activar autenticación en dos pasos</h2></div>
                <button className="absolute top-3 right-3 text-white hover:text-gray-200" onClick={() => setShowTwoFactorCodeModal(false)}>✕</button>
                <div className="p-6">
                  <div className="flex flex-col items-center mb-4">
                    <img src="two-factor.png" alt="2FA" className="w-24 h-24 mb-2" />
                    <p className="text-center text-gray-700 text-sm">Por tu seguridad, ingresa el código que te hemos enviado</p>
                  </div>
                  <div className="mb-4">
                    <input type="text" value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} placeholder="Ingresa el código" className="w-full border border-[#2b6daf] rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#2b6daf]" />
                  </div>
                  <button className="w-full bg-[#2b6daf] hover:bg-blue-700 text-white py-2 rounded-md mb-2" onClick={handleVerifyCode}>Verificar</button>
                  <div className="text-center">
                    <button className="text-[#2b6daf] text-sm hover:underline" onClick={handleResendCode}>Reenviar código</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --------- MODAL HISTORIAL --------- */}
          {showHistorial && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-0 relative " style={{ marginTop: "80px" }}>
                <div className="bg-[#2b6daf] text-white text-center py-3 rounded-t-lg">
                  <h2 className="font-semibold text-lg">Historial de accesos</h2>
                </div>
                <button className="absolute top-3 right-3 text-white hover:text-gray-200" onClick={() => setShowHistorial(false)}>✕</button>

                <div className="p-6">
                  <div className="historial-card mx-auto" style={{ maxWidth: "520px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.06)" }}>
                    <div style={{ padding: "8px 16px" }}>
                      {loadingHistorial ? (
                        <p className="text-center text-gray-500">Cargando historial...</p>
                      ) : errorHistorial ? (
                        <p className="text-center text-red-500">{errorHistorial}</p>
                      ) : (
                        <div className="historial-list" style={{ maxHeight: 260, overflowY: "auto", paddingRight: 8 }}>
                          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                            {historial.length > 0 ? (
                              historial.map((item, idx) => (
                                <li key={idx} className="flex justify-between items-center py-2">
                                  <span className="text-gray-700">
                                    {item.fecha}{item.hora ? `, ${item.hora}` : ""}
                                  </span>
                                </li>
                              ))
                            ) : (
                              <li className="flex justify-center text-gray-500 py-2">No hay registros de acceso.</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "16px", textAlign: "center" }} />
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
          <Link to="#" className="new-link" onClick={() => setShowPasswordModal(true)}>Cambiar contraseña</Link>
        </div>
        <div className="f2-autenticacion">
          <img src="/f2.png" alt="imagen" className="f2" />
        <Link to="#" className="new-link" onClick={(e) => { e.preventDefault(); setShowTwoFactorModal(true); }}>
            Autenticación en dos pasos
          </Link>
        </div>
        <div className="historial">
          <img src="/historial-perfil.png" alt="imagen" className="historial-icono" />
          <Link to="#" className="new-link" onClick={(e) => { e.preventDefault(); fetchHistorial(); setShowHistorial(true); }}>
            Historial de Acceso
          </Link>
        </div>
      </section>
    </div>
  );
}
