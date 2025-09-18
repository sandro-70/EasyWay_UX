// src/miPerfil.jsx
import { useState, useEffect, useContext, useRef } from "react";
import "./miPerfil.css";
import { Link } from "react-router-dom";
import PerfilSidebar from "./components/perfilSidebar";
import { UserContext } from "./components/userContext";
import { createLog, getLogsUsuario } from "./api/Usuario.Route";
import { useTranslation } from "react-i18next";
import {
  InformacionUser,
  changePassword,
  uploadProfilePhoto1,
  enviarCorreoDosPasos,
  validarCodigoDosPasos,
} from "./api/Usuario.Route";
import axiosInstance from "./api/axiosInstance";
import { toast } from "react-toastify";
import "./toast.css";

/* ===================== ORIGIN backend + helpers ===================== */
const BACKEND_ORIGIN = (() => {
  const base = axiosInstance?.defaults?.baseURL;
  try {
    const u = base
      ? base.startsWith("http")
        ? new URL(base)
        : new URL(base, window.location.origin)
      : new URL(window.location.origin);
    return `${u.protocol}//${u.host}`;
  } catch {
    return window.location.origin;
  }
})();

const backendImageUrl = (fileName) =>
  fileName
    ? `${BACKEND_ORIGIN}/images/fotoDePerfil/${encodeURIComponent(fileName)}`
    : "";

// adapta la ruta que venga en DB a una URL válida del backend
const toPublicFotoSrc = (nameOrPath) => {
  if (!nameOrPath) return "";
  const s = String(nameOrPath).trim();
  if (/^https?:\/\//i.test(s)) return s; // ya es absoluta
  if (s.startsWith("/api/images/")) return `${BACKEND_ORIGIN}${encodeURI(s)}`;
  if (s.startsWith("/images/")) return `${BACKEND_ORIGIN}${encodeURI(s)}`;
  // nombre suelto => /images/fotoDePerfil/<archivo>
  return backendImageUrl(s);
};

const fileNameFromPath = (p) => (!p ? "" : String(p).split("/").pop() || "");

const getExt = (file) => {
  const byName = file?.name?.match(/\.(\w{1,8})$/i)?.[1];
  if (byName) return `.${byName.toLowerCase()}`;
  const map = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/bmp": ".bmp",
    "image/svg+xml": ".svg",
  };
  return (map[file?.type] || ".png").toLowerCase();
};

const getUserId = (u) =>
  u?.id_usuario ?? u?.id ?? u?.usuario_id ?? u?.userId ?? null;
const safeBaseName = (file) =>
  (file?.name && file.name.replace(/\s+/g, "_").replace(/[^\w.\-]/g, "")) ||
  `user_${Date.now()}`;
const buildIdProfileFileName = (userObj, file) => {
  const id = getUserId(userObj);
  const ext = getExt(file);
  return id
    ? `user_${id}${ext}`
    : `${safeBaseName(file).replace(/\.(\w{1,8})$/i, "")}${ext}`;
};

/* ===================== UI helpers ===================== */
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
    case "number":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className={className}
        >
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
  const { t } = useTranslation();

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

    // preferir lo que venga de la API
    push(dataObj?.foto_perfil_url);
    push(dataObj?.foto_perfil);
    push(dataObj?.foto);

    // luego lo que haya en el contexto
    push(ctx?.foto_perfil_url);
    push(ctx?.foto);

    // probar convenciones por id
    if (uid)
      ["jpg", "png", "webp"].forEach((ext) => push(`user_${uid}.${ext}`));
    return list;
  };

  const advanceCandidate = () => {
    setFotoIdx((i) => (i + 1 < fotoCandidates.length ? i + 1 : i));
  };

  // dentro de miPerfil.jsx
  const handleFotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a seleccionar el mismo archivo
    if (!file) return;

    // si no estabas en edición, activamos edición para todos
    if (!editMode) setEditMode(true);

    // preview inmediata
    const preview = URL.createObjectURL(file);
    setFotoUrl(preview);

    const fileNameById = buildIdProfileFileName(user, file);

    try {
      // 1) Subir archivo
      const { data } = await uploadProfilePhoto1(file, fileNameById);
      const filename = data?.filename || fileNameById;

      // 2) Persistir en BD el nombre del archivo (¡clave!)
      await axiosInstance.put("/api/MiPerfil/perfil/", {
        foto_perfil_url: filename,
      });

      // 3) Releer usuario para sincronizar y refrescar cache
      const res = await InformacionUser();
      const data1 = res?.data?.user ?? res?.data ?? {};
      const stored =
        data1.foto_perfil_url || data1.foto_perfil || data1.foto || filename;
      const justName = String(stored).split("/").pop();

      // 4) Actualiza candidatos y UI
      const cands = buildFotoCandidates(
        { ...data1, foto_perfil_url: justName },
        user
      );
      setFotoCandidates(cands);
      setFotoIdx(0);

      setFotoFileName(justName);
      setFotoUrl(`${toPublicFotoSrc(justName)}?t=${Date.now()}`);

      // 5) Context (header)
      setUser((prev) => ({
        ...(prev || {}),
        ...data1,
        foto_perfil_url: justName,
        avatar_rev: Date.now(),
      }));

      URL.revokeObjectURL(preview);
      toast.success("Foto actualizada", { className: "toast-success" });
    } catch (err) {
      console.error(
        "Error subiendo/guardando foto:",
        err?.response?.data || err
      );
      toast.error("No se pudo actualizar la foto.", {
        className: "toast-error",
      });
      URL.revokeObjectURL(preview);
      // si falla, intenta el siguiente candidato (jpg/png/webp)
      advanceCandidate();
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
      const reg = s.match(
        /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/
      );
      if (reg) {
        const [_, Y, M, D, hh, mm, ss] = reg;
        return new Date(
          Number(Y),
          Number(M) - 1,
          Number(D),
          Number(hh || 0),
          Number(mm || 0),
          Number(ss || 0)
        );
      }
      return null;
    }
    return null;
  };

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
      const rawList = Array.isArray(res.data)
        ? res.data
        : res.data?.rows ?? res.data?.data ?? [];
      const items = Array.isArray(rawList)
        ? rawList
        : res.data
        ? [res.data]
        : [];
      const logs = items.map((item) => {
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
        if (!parsedDate && typeof item === "string")
          parsedDate = tryParseDate(item);
        if (!parsedDate)
          return { fecha: "Fecha desconocida", hora: "", raw: item };
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
        const res = await InformacionUser();
        const data = res?.data?.user ?? res?.data ?? {};
        if (!mounted) return;

        // log acceso (best effort)
        const uid = getUserId(data);
        if (uid) createLog(uid).catch(() => {});

        // form
        setTelefono(
          data.telefono || data.numero_telefono || data.telefono_usuario || ""
        );
        setNombre(data.nombre || data.nombre_usuario || data.nombres || "");
        setApellidos(
          data.apellido || data.apellidos || data.apellido_usuario || ""
        );
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
          telefono:
            data.telefono ||
            data.numero_telefono ||
            data.telefono_usuario ||
            "",
          nombre: data.nombre || data.nombre_usuario || data.nombres || "",
          apellidos:
            data.apellido || data.apellidos || data.apellido_usuario || "",
          correo: data.correo || data.email || "",
          genero: String(data.genero || "masculino").toLowerCase(),
          fotoFileName: first || "",
          fotoUrl: first ? `${toPublicFotoSrc(first)}?t=${Date.now()}` : "",
        });

        // empuja al contexto (útil para el Header)
        if (first) pushUserToContext({ ...data, foto_perfil_url: first });

        setCargando(false);
      } catch (err) {
        console.error(
          "Error cargando usuario:",
          err?.response?.data || err.message || err
        );
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
    setSnapshot({
      telefono,
      nombre,
      apellidos,
      correo,
      genero,
      fotoFileName,
      fotoUrl,
    });
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
      const fromApi =
        data.foto_perfil_url ||
        data.foto_perfil ||
        data.foto ||
        nombreParaBD ||
        "";
      const freshName = fileNameFromPath(fromApi) || "";

      const freshUrl = freshName
        ? `${toPublicFotoSrc(freshName)}?t=${Date.now()}`
        : "";
      setFotoFileName(freshName);
      setFotoUrl(freshUrl);
      setUser({ ...data, foto_perfil_url: freshName, avatar_rev: Date.now() });

      setSnapshot({
        telefono,
        nombre,
        apellidos,
        correo,
        genero,
        fotoFileName: freshName,
        fotoUrl: freshUrl,
      });
      setEditMode(false);
      toast.success("Perfil guardado", { className: "toast-success" });
    } catch (err) {
      console.error(
        "Error guardando perfil:",
        err?.response?.data || err.message || err
      );
      toast.error("No se pudo guardar el perfil.", {
        className: "toast-error",
      });
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
      toast.info("Se ha enviado el código a tu correo", {
        className: "toast-info",
      });
      setShowTwoFactorModal(false);
      setShowTwoFactorCodeModal(true);
    } catch (err) {
      console.error("Error enviando código:", err);
      toast.error("No se pudo enviar el código. Intenta nuevamente.", {
        className: "toast-error",
      });
    }
  };

  const handleVerifyCode = async () => {
    if (!twoFactorCode)
      return toast.info("Ingresa el código recibido", {
        className: "toast-info",
      });
    try {
      await validarCodigoDosPasos(correo, twoFactorCode);
      toast.success("Autenticación de dos pasos activada correctamente", {
        className: "toast-success",
      });
      setShowTwoFactorCodeModal(false);
      setTwoFactorCode("");
    } catch (err) {
      console.error("Error verificando código:", err);
      toast.warn("Código inválido o expirado. Intenta de nuevo.", {
        className: "toast-warn",
      });
    }
  };

  const handleResendCode = async () => {
    try {
      await enviarCorreoDosPasos(correo);
      toast.info("Se ha reenviado el código a tu correo", {
        className: "toast-info",
      });
    } catch (err) {
      console.error("Error reenviando código:", err);
      toast.error("No se pudo reenviar el código. Intenta más tarde.", {
        className: "toast-error",
      });
    }
  };

  /* ==================== RENDER ==================== */
  if (cargando) return null;

  return (
    <div className="perfil-container">
      <section className="sidebar">
        <PerfilSidebar />
      </section>
      <h1 className="perfil-title">{t("perfil.title")}</h1>
      <hr className="perfil-separator" />
      <p className="Datos-text">{t("perfil.dataTitle")}</p>

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

          {/* input oculto pero clickable vía ref */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFotoChange}
          />

          <button
            className="editar-boton"
            onClick={() => fileInputRef.current?.click()}
            title="Cambiar foto"
          >
            <Icon name="camera" className="icon-small" />
            <span>{t("perfil.editPhoto")}</span>
          </button>
        </aside>

        <section className="perfil-card">
          <div className="fields-grid">
            <Field label={t("perfil.field.nombre")} icon={<Icon name="user" />}>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder={t("perfil.placeholder.nombre")}
                disabled={!editMode}
              />
            </Field>

            <Field
              label={t("perfil.field.apellidos")}
              icon={<Icon name="user" />}
            >
              <input
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                placeholder={t("perfil.placeholder.apellidos")}
                disabled={!editMode}
              />
            </Field>

            <Field label={t("perfil.field.correo")} icon={<Icon name="mail" />}>
              <input
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder={t("perfil.placeholder.correo")}
                disabled={!editMode}
              />
            </Field>

            <Field
              label={t("perfil.field.telefono")}
              icon={<Icon name="number" />}
            >
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder={t("perfil.placeholder.telefono")}
                disabled={!editMode}
              />
            </Field>

            <Field label={t("perfil.field.genero")}>
              <select
                value={genero}
                onChange={(e) => setGenero(e.target.value)}
                disabled={!editMode}
              >
                <option value="masculino">
                  {t("perfil.gender.masculino")}
                </option>
                <option value="femenino">{t("perfil.gender.femenino")}</option>
                <option value="otro">{t("perfil.gender.otro")}</option>
              </select>
            </Field>
          </div>

          {!editMode ? (
            <button className="boton-editar" onClick={enterEdit}>
              {t("perfil.button.editar")}
            </button>
          ) : (
            <div className="botones-accion">
              <button className="boton-guardar" onClick={handleSave}>
                {t("perfil.button.guardar")}
              </button>
              <button className="boton-cancelar" onClick={handleCancel}>
                {t("perfil.button.cancelar")}
              </button>
            </div>
          )}

          {/* --------- MODAL CAMBIO DE PASSWORD --------- */}
          {showPasswordModal && (
            <div className="modal-overlay">
              <div className="mPerfil-modal">
                <div className="modal-headerr">
                  <h3 className="label-modal-confirm">
                    {t("perfil.modal.changePassword.title")}
                  </h3>
                  <button
                    className="mPerfil-cancel-button"
                    onClick={() => setShowPasswordModal(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="modal-body">
                  <label>{t("perfil.modal.changePassword.oldPassword")}</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                  <label>{t("perfil.modal.changePassword.newPassword")}</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <label>
                    {t("perfil.modal.changePassword.confirmPassword")}
                  </label>
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
                      if (!oldPassword || !newPassword || !confirmPassword)
                        return setPasswordError(
                          t("perfil.modal.changePassword.completeFields")
                        );
                      if (newPassword !== confirmPassword)
                        return setPasswordError(
                          t("perfil.modal.changePassword.mismatch")
                        );
                      if (newPassword.length < 6)
                        return setPasswordError(
                          t("perfil.modal.changePassword.minLength")
                        );
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
                        toast.success(t("perfil.toast.passwordChanged"), {
                          className: "toast-success",
                        });
                      } catch (err) {
                        const msg =
                          err?.response?.data?.message ||
                          err?.response?.data ||
                          err.message ||
                          String(err);
                        setPasswordError(
                          msg.includes("Contraseña incorrecta")
                            ? t("perfil.modal.changePassword.wrongOld")
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

          {/* --------- MODALES 2FA --------- */}
          {showTwoFactorModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-0 relative">
                <div className="bg-[#2b6daf] text-white text-center py-2">
                  <h2 className="font-semibold text-lg">
                    {t("perfil.modal.2fa.title")}
                  </h2>
                </div>
                <button
                  className="absolute top-3 right-3 text-white hover:text-gray-200"
                  onClick={() => setShowTwoFactorModal(false)}
                >
                  ✕
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
                        Enviar código al ***@gmail.com
                      </span>
                    </label>
                  </div>
                  <button
                    className="w-full bg-[#2b6daf] hover:bg-blue-700 text-white py-2 rounded-md"
                    onClick={handleSendCode}
                  >
                    {t("perfil.modal.2fa.sendCode")}
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
                    {t("perfil.modal.2fa.title")}
                  </h2>
                </div>
                <button
                  className="absolute top-3 right-3 text-white hover:text-gray-200"
                  onClick={() => setShowTwoFactorCodeModal(false)}
                >
                  ✕
                </button>
                <div className="p-6">
                  <div className="flex flex-col items-center mb-4">
                    <img
                      src="two-factor.png"
                      alt="2FA"
                      className="w-24 h-24 mb-2"
                    />
                    <p className="text-center text-gray-700 text-sm">
                      {t("perfil.modal.2fa.instruction")}
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
                    {t("perfil.modal.2fa.verify")}
                  </button>
                  <div className="text-center">
                    <button
                      className="text-[#2b6daf] text-sm hover:underline"
                      onClick={handleResendCode}
                    >
                      {t("perfil.modal.2fa.resend")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --------- MODAL HISTORIAL --------- */}
          {showHistorial && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div
                className="bg-white rounded-lg shadow-lg w-full max-w-xl p-0 relative "
                style={{ marginTop: "80px" }}
              >
                <div className="bg-[#2b6daf] text-white text-center py-3 rounded-t-lg">
                  <h2 className="font-semibold text-lg">
                    {t("perfil.history.title")}
                  </h2>
                </div>
                <button
                  className="absolute top-3 right-3 text-white hover:text-gray-200"
                  onClick={() => setShowHistorial(false)}
                >
                  ✕
                </button>

                <div className="p-6">
                  <div
                    className="historial-card mx-auto"
                    style={{
                      maxWidth: "520px",
                      borderRadius: 8,
                      border: "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    <div style={{ padding: "8px 16px" }}>
                      {loadingHistorial ? (
                        <p className="text-center text-gray-500">
                          {t("perfil.history.loading")}
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
                                {t("perfil.history.noRecords")}
                              </li>
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
        <h1 className="Config">{t("perfil.configuration")}</h1>
        <div className="candado-link">
          <img src="/Vector.png" alt="imagen" className="candado" />
          <Link
            to="#"
            className="new-link"
            onClick={() => setShowPasswordModal(true)}
          >
            {t("perfil.changePassword")}
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
            {t("perfil.modal.2fa.title")}
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
            {t("perfil.history.title")}
          </Link>
        </div>
      </section>
    </div>
  );
}
