// src/EditarPerfilAdmin.jsx
import { useState, useEffect, useContext, useRef } from "react";
import "./EditMiPerfil.css";
import { Link } from "react-router-dom";
import { UserContext } from "../components/userContext";
import {
  createLog,
  getLogsUsuario,
  InformacionUser,
  changePassword,
  uploadProfilePhoto1,
  enviarCorreoDosPasos,
  validarCodigoDosPasos,
  editarPerfil, // ← usamos esta API para guardar
} from "../api/Usuario.Route";
import {
  getAllDepartamentos,
  getAllMunicipios,
  getDirecciones, // ← para obtener id_direccion
} from "../api/DireccionesApi";
import axiosInstance from "../api/axiosInstance";

/* ===================== ORIGIN backend + helper URL imagen ===================== */
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

// Extensión desde archivo
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

// Helpers de ID
const getUserId = (u) => u?.id_usuario ?? u?.id ?? u?.usuario_id ?? u?.userId ?? 1;
const buildIdProfileFileName = (user, file) => `user_${getUserId(user)}${getExt(file)}`;

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
    case "lock":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="1.8" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="1.8" />
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

/* ===================== Componente ===================== */
export default function EditarPerfilAdmin() {
  const { user, setUser } = useContext(UserContext);

  // Datos generales
  const [telefono, setTelefono] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [correo, setCorreo] = useState("");
  const [genero, setGenero] = useState("Masculino");
  const [rol, setRol] = useState("Administrador");

  // Dirección
  const [calle, setCalle] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [codigoPostal, setCodigoPostal] = useState(""); // opcional (no UI)
  const [predeterminada, setPredeterminada] = useState(true); // opcional (no UI)
  const [idDireccion, setIdDireccion] = useState(null);

  const [departamento, setDepartamento] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [idMunicipio, setIdMunicipio] = useState("");
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);

  // Foto
  const [fotoUrl, setFotoUrl] = useState("");
  const [fotoFileName, setFotoFileName] = useState("");

  // UI
  const [cargando, setCargando] = useState(true);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // 🔴 arranca en SOLO LECTURA
  const [editMode, setEditMode] = useState(false);

  // modales
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showHistorial, setShowHistorial] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showTwoFactorCodeModal, setShowTwoFactorCodeModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState("");
  const [historial, setHistorial] = useState([]);

  // para limpiar el input file en cancelar
  const fileInputRef = useRef(null);

  // snapshot para Cancelar sin recargar
  const [snapshot, setSnapshot] = useState(null);

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

  useEffect(() => {
    if (!passwordError) return;
    const t = setTimeout(() => setPasswordError(""), 2000);
    return () => clearTimeout(t);
  }, [passwordError]);

  // Carga inicial
  useEffect(() => {
    let mounted = true;

    const fetchUserAndAddress = async () => {
      try {
        const res = await InformacionUser();
        const data = res?.data?.user ?? res?.data ?? {};
        if (!mounted) return;

        const uid = getUserId(data);
        if (uid) createLog(uid).catch(() => {});

        // Datos generales
        const _telefono = data.telefono || data.numero_telefono || data.telefono_usuario || "";
        const _nombre = data.nombre || data.nombre_usuario || data.nombres || "";
        const _apellidos = data.apellido || data.apellidos || data.apellido_usuario || "";
        const _correo = data.correo || data.email || "";
        const _genero = data.genero || "Masculino";
        const _rol = data.rol?.nombre_rol || "Administrador";

        setTelefono(_telefono);
        setNombre(_nombre);
        setApellidos(_apellidos);
        setCorreo(_correo);
        setGenero(_genero);
        setRol(_rol);

        // Foto (normalizada a user_<id>.<ext>)
        const fromApi = data.foto_perfil_url || data.foto_perfil || data.foto || "";
        const guessedExt = fileNameFromPath(fromApi).split(".").pop() || "png";
        const idName = `user_${uid}.${guessedExt}`;
        const url = `${backendImageUrl(idName)}?t=${Date.now()}`;
        setFotoFileName(idName);
        setFotoUrl(url);
        pushUserToContext({ ...data, foto_perfil_url: idName });

        // Catálogos
        const [resDeptos, resMunis] = await Promise.all([
          getAllDepartamentos(),
          getAllMunicipios(),
        ]);
        const dpt = resDeptos?.data || [];
        const mns = resMunis?.data || [];
        setDepartamentos(dpt);
        setMunicipios(mns);

        // Dirección
        const resDir = await getDirecciones(uid);
        const lista = resDir?.data || [];
        let _calle = "", _ciudad = "", _codigoPostal = "", _pred = true, _idDir = null;
        let _departamento = "", _municipio = "", _idMunicipio = "";

        if (Array.isArray(lista) && lista.length > 0) {
          const dir = lista.find((d) => d.predeterminada) || lista[0];
          _calle = dir.calle || "";
          _ciudad = dir.ciudad || "";
          _codigoPostal = dir.codigo_postal || "";
          _pred = !!dir.predeterminada;
          _idDir = dir.id_direccion ?? dir.id ?? null;

          const muni = mns.find((m) => m.id_municipio === (dir.id_municipio || dir.municipio_id));
          if (muni) {
            _municipio = muni.nombre_municipio;
            _idMunicipio = String(muni.id_municipio);
            const dept = dpt.find((d) => d.id_departamento === muni.id_departamento);
            if (dept) _departamento = dept.nombre_departamento;
            // si ciudad viene vacío, default al nombre del municipio
            if (!_ciudad) _ciudad = muni.nombre_municipio;
          }
        }

        setCalle(_calle);
        setCiudad(_ciudad);
        setCodigoPostal(_codigoPostal);
        setPredeterminada(_pred);
        setIdDireccion(_idDir);

        setDepartamento(_departamento);
        setMunicipio(_municipio);
        setIdMunicipio(_idMunicipio);

        // snapshot inicial
        setSnapshot({
          telefono: _telefono,
          nombre: _nombre,
          apellidos: _apellidos,
          correo: _correo,
          genero: _genero,
          rol: _rol,
          fotoUrl: url,
          fotoFileName: idName,
          calle: _calle,
          ciudad: _ciudad,
          codigoPostal: _codigoPostal,
          predeterminada: _pred,
          idDireccion: _idDir,
          departamento: _departamento,
          municipio: _municipio,
          idMunicipio: _idMunicipio,
        });

        setCargando(false);
      } catch (err) {
        console.error("Error cargando perfil admin:", err);
        setCargando(false);
      }
    };

    fetchUserAndAddress();
    return () => {
      mounted = false;
    };
  }, []);

  /* =================== SUBIR FOTO (solo en modo edición) =================== */
  const handleFotoChange = async (e) => {
    if (!editMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setFotoUrl(URL.createObjectURL(file)); // preview

    try {
      const fileNameById = buildIdProfileFileName(user, file);
      const { data } = await uploadProfilePhoto1(file, fileNameById);
      const filename = data?.filename || fileNameById;

      const res = await InformacionUser();
      const data1 = res?.data?.user ?? res?.data ?? {};
      const fromApi = data1.foto_perfil_url || data1.foto_perfil || data1.foto || filename;
      const justName = fileNameFromPath(fromApi);

      setFotoUrl(`${backendImageUrl(justName)}?t=${Date.now()}`);
      setFotoFileName(justName);
      setUser((prev) => ({ ...(prev || {}), ...data1, foto_perfil_url: justName, avatar_rev: Date.now() }));
    } catch (err) {
      console.error("Error subiendo foto:", err);
      alert("No se pudo subir la foto.");
    }
  };

  /* =================== Historial =================== */
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

  /* =================== Dirección =================== */
  const handleDepartamentoChange = (e) => {
    const nuevoDepartamento = e.target.value;
    setDepartamento(nuevoDepartamento);
    setMunicipio("");
    setIdMunicipio("");
  };

  const handleMunicipioChange = (e) => {
    const nuevoIdMunicipio = e.target.value;
    setIdMunicipio(nuevoIdMunicipio);
    const muni = municipios.find((m) => String(m.id_municipio) === String(nuevoIdMunicipio));
    if (muni) {
      setMunicipio(muni.nombre_municipio);
      // si el usuario no escribió ciudad, por defecto igualar a municipio
      if (!ciudad) setCiudad(muni.nombre_municipio);
    }
  };

  /* =================== Editar / Guardar / Cancelar =================== */
  const enterEdit = () => {
    setSnapshot({
      telefono, nombre, apellidos, correo, genero, rol,
      fotoUrl, fotoFileName,
      calle, ciudad, codigoPostal, predeterminada, idDireccion,
      departamento, municipio, idMunicipio,
    });
    setEditMode(true);
  };

  const handleSave = async () => {
    try {
      const uid = getUserId(user);
      if (!uid) return alert("No se pudo determinar el usuario.");

      await editarPerfil(
        uid,                          // id_usuario
        (nombre || "").trim(),        // nombre
        (apellidos || "").trim(),     // apellido
        (telefono || "").trim(),      // telefono
        genero,                       // genero
        fotoFileName || "",           // foto_perfil_url (nombre archivo)
        idDireccion ?? null,          // id_direccion (si hay)
        (calle || "").trim(),         // calle
        (ciudad || "").trim(),        // ciudad
        (codigoPostal || "").trim(),  // codigo_postal
        !!predeterminada,             // predeterminada
        idMunicipio ? Number(idMunicipio) : null // id_municipio
      );

      // refresca usuario + foto
      const fullRes = await InformacionUser();
      const data = fullRes?.data?.user ?? fullRes?.data ?? {};
      const freshName = fileNameFromPath(
        data.foto_perfil_url || data.foto_perfil || data.foto || fotoFileName || ""
      );
      const freshUrl = `${toPublicFotoSrc(freshName)}?t=${Date.now()}`;
      setFotoFileName(freshName);
      setFotoUrl(freshUrl);
      setUser({ ...data, foto_perfil_url: freshName, avatar_rev: Date.now() });

      // refresca dirección para capturar id_direccion si cambió/creó
      try {
        const resDir = await getDirecciones(uid);
        const lista = resDir?.data || [];
        if (Array.isArray(lista) && lista.length > 0) {
          const dir = lista.find((d) => d.predeterminada) || lista[0];
          setIdDireccion(dir.id_direccion ?? dir.id ?? null);
        }
      } catch {}

      // Actualiza snapshot a lo guardado
      setSnapshot({
        telefono, nombre, apellidos, correo, genero, rol,
        fotoUrl: freshUrl, fotoFileName: freshName,
        calle, ciudad, codigoPostal, predeterminada, idDireccion,
        departamento, municipio, idMunicipio,
      });

      alert("✅ Perfil actualizado correctamente");
      setEditMode(false);
    } catch (err) {
      console.error("Error guardando perfil admin:", err);
      alert("No se pudo guardar el perfil.");
    }
  };

  const handleCancel = () => {
    if (snapshot) {
      setTelefono(snapshot.telefono || "");
      setNombre(snapshot.nombre || "");
      setApellidos(snapshot.apellidos || "");
      setCorreo(snapshot.correo || "");
      setGenero(snapshot.genero || "Masculino");
      setRol(snapshot.rol || "Administrador");
      setFotoUrl(snapshot.fotoUrl || "");
      setFotoFileName(snapshot.fotoFileName || "");
      setCalle(snapshot.calle || "");
      setCiudad(snapshot.ciudad || "");
      setCodigoPostal(snapshot.codigoPostal || "");
      setPredeterminada(!!snapshot.predeterminada);
      setIdDireccion(snapshot.idDireccion ?? null);
      setDepartamento(snapshot.departamento || "");
      setMunicipio(snapshot.municipio || "");
      setIdMunicipio(snapshot.idMunicipio || "");
    }
    // limpia selección del file input si había
    if (fileInputRef.current) fileInputRef.current.value = "";
    setEditMode(false);
  };

  /* =================== Password & 2FA =================== */
  const handlePasswordSubmit = async () => {
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
  };

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

  if (cargando) return null;

  return (
    <div className="perfil-container">
      <h1 className="perfil-title">Editar Perfil Administrador</h1>
      <hr className="perfil-separator" />
      <p className="Datos-text">Datos Generales</p>

      <div className="perfil-content">
        {/* Sidebar con avatar */}
        <aside className="perfil-sidebar">
          <div className="perfil-avatar">
            {fotoUrl ? (
              <img src={fotoUrl} alt="Foto de perfil" className="perfil-avatar-image" />
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

        {/* Form principal – Nombre/Apellido · Correo/Teléfono · Género/Rol · Depto/Muni · Calle/Ciudad */}
        <section className="perfil-card">
          <div className="fields-grid">
            <Field label="Nombre" icon={<Icon name="user" />}>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan" disabled={!editMode} />
            </Field>
            <Field label="Apellidos" icon={<Icon name="user" />}>
              <input value={apellidos} onChange={(e) => setApellidos(e.target.value)} placeholder="Pérez" disabled={!editMode} />
            </Field>

            <Field label="Correo" icon={<Icon name="mail" />}>
              <input value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="ejemplo@gmail.com" disabled={!editMode} />
            </Field>
            <Field label="Teléfono" icon={<Icon name="number" />}>
              <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="9999-9999" disabled={!editMode} />
            </Field>

            <Field label="Género">
              <select value={genero} onChange={(e) => setGenero(e.target.value)} disabled={!editMode}>
                <option>masculino</option>
                <option>femenino</option>
                <option>otro</option>
              </select>
            </Field>
            <Field label="Rol">
              <input value={rol} disabled />
            </Field>

            <Field label="Departamento">
              <select value={departamento} onChange={handleDepartamentoChange} disabled={!editMode}>
                <option value="">Seleccione un departamento</option>
                {departamentos.map((d) => (
                  <option key={d.id_departamento} value={d.nombre_departamento}>
                    {d.nombre_departamento}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Municipio">
              <select value={idMunicipio} onChange={handleMunicipioChange} disabled={!editMode || !departamento}>
                <option value="">Seleccione un municipio</option>
                {municipios
                  .filter((m) => {
                    const deptoSel = departamentos.find((d) => d.nombre_departamento === departamento);
                    return deptoSel && m.id_departamento === deptoSel.id_departamento;
                  })
                  .map((m) => (
                    <option key={m.id_municipio} value={m.id_municipio}>
                      {m.nombre_municipio}
                    </option>
                  ))}
              </select>
            </Field>

            <Field label="Calle">
              <input
                value={calle}
                onChange={(e) => setCalle(e.target.value)}
                placeholder="Bo. El Carmen 3 calle 6 ave"
                disabled={!editMode}
              />
            </Field>

            <Field label="Ciudad">
              <input
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="San Pedro Sula"
                disabled={!editMode}
              />
            </Field>
          </div>

          {/* Botones */}
          {!editMode ? (
            <button className="boton-editar" onClick={enterEdit}>Editar</button>
          ) : (
            <div className="botones-accion">
              <button className="boton-guardar" onClick={handleSave}>Guardar</button>
              <button className="boton-cancelar" onClick={handleCancel}>Cancelar</button>
            </div>
          )}

          {/* ---------------- MODAL CAMBIO DE PASSWORD ---------------- */}
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
                  <button className="MPbtn-secondary" onClick={handlePasswordSubmit} disabled={passwordLoading}>
                    {passwordLoading ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- MODALES 2FA ---------------- */}
          {showTwoFactorModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-0 relative">
                <div className="bg-[#2b6daf] text-white text-center py-2">
                  <h2 className="font-semibold text-lg">Activar autenticación en dos pasos</h2>
                </div>
                <button className="absolute top-3 right-3 text-white hover:text-gray-200" onClick={() => setShowTwoFactorModal(false)}>✕</button>
                <div className="p-6">
                  <div className="flex justify-center mb-4">
                    <img src="two-factor.png" alt="2FA" className="w-24 h-24" />
                  </div>
                  <div className="flex flex-col gap-3 mb-4">
                    <label className="flex items-center gap-2 border border-[#2b6daf] p-2 rounded">
                      <input type="radio" name="twofactor" className="accent-[#2b6daf] align-middle m-0" />
                      <span className="align-middle">Enviar correo al ***@gmail.com</span>
                    </label>
                  </div>
                  <button className="w-full bg-[#2b6daf] hover:bg-blue-700 text-white py-2 rounded-md" onClick={handleSendCode}>
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
                  <h2 className="font-semibold text-lg">Activar autenticación en dos pasos</h2>
                </div>
                <button className="absolute top-3 right-3 text-white hover:text-gray-200" onClick={() => setShowTwoFactorCodeModal(false)}>✕</button>
                <div className="p-6">
                  <div className="flex flex-col items-center mb-4">
                    <img src="two-factor.png" alt="2FA" className="w-24 h-24 mb-2" />
                    <p className="text-center text-gray-700 text-sm">Por tu seguridad, ingresa el código que te hemos enviado</p>
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
                  <button className="w-full bg-[#2b6daf] hover:bg-blue-700 text-white py-2 rounded-md mb-2" onClick={handleVerifyCode}>
                    Verificar
                  </button>
                  <div className="text-center">
                    <button className="text-[#2b6daf] text-sm hover:underline" onClick={handleResendCode}>
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
              <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-0 relative" style={{ marginTop: "80px" }}>
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
          <Link to="#" className="new-link" onClick={() => setShowPasswordModal(true)}>
            Cambiar contraseña
          </Link>
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
