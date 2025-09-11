import { useState, useEffect, useContext } from "react";
import {
  InformacionUser,
  changePassword,
  updateUserById,
  uploadProfilePhoto,
  getRoles,
  getPrivilegios,
} from "../api/Usuario.Route";
import {
  getAllDepartamentos,
  getAllMunicipios,
  addDireccion,
  getDirecciones,
} from "../api/DireccionesApi";
import { UserContext } from "../components/userContext";
import { Link } from "react-router-dom";

// Importa axiosInstance desde tu configuración
import axiosInstance from "../api/axiosInstance";

// Función para cambio de contraseña - agregar a Usuario.Route.js
const changePasswordByUser = async (id_usuario, contraseña_actual, nueva_contraseña) => {
  const response = await fetch(`/api/MiPerfil/cambiar-password/${id_usuario}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contraseña_actual,
      nueva_contraseña,
    }),
  });
  return response.json();
};

// Icon component...
function Icon({ name, className = "h-4 w-4" }) {
  switch (name) {
    case "user":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
          <circle cx="12" cy="8" r="4" strokeWidth="1.8" />
          <path d="M4 20c2-4 14-4 16 0" strokeWidth="1.8" />
        </svg>
      );
    case "camera":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
          <path d="M4 8h4l2-2h4l2 2h4v12H4z" strokeWidth="1.8" />
          <circle cx="12" cy="14" r="3.5" strokeWidth="1.8" />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
          <path d="M5 13l4 4 10-10" strokeWidth="2" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
          <path d="M6 6l12 12M6 18L18 6" strokeWidth="2" />
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

function Field({ label, children }) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 text-sm font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function PrivilegiosModal({ open, onClose, items = [] }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[560px] max-w-[92vw] rounded-2xl bg-white shadow-xl ring-1 ring-[#d8dadc]">
        <div className="flex items-center justify-between rounded-t-2xl bg-[#2b6daf] px-4 py-3">
          <h3 className="text-lg font-semibold text-white">Privilegios</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full border border-white text-white hover:bg-white/10"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="p-4">
          <div className="max-h-72 overflow-y-auto rounded-xl border border-[#d8dadc]">
            {items.map((txt, i) => (
              <div key={i} className="px-4 py-3 text-sm text-slate-700">
                {txt}
                {i < items.length - 1 && <div className="mt-3 h-px w-full bg-[#eef0f2]" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CambioContrasenaModal({
  open,
  onClose,
  oldPassword,
  setOldPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  passwordError,
  passwordLoading,
  handlePasswordChange,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[450px] max-w-[92vw] rounded-2xl bg-white shadow-xl ring-1 ring-[#d8dadc]">
        <div className="flex items-center justify-between rounded-t-2xl bg-[#f0833e] px-4 py-3">
          <h3 className="text-lg font-semibold text-white">Cambio de contraseña</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full border border-white text-white hover:bg-white/10"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <Field label="Contraseña anterior">
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full rounded-xl border border-[#d8dadc] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f0833e]"
              placeholder="Ingresa tu contraseña actual"
            />
          </Field>

          <Field label="Nueva contraseña">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-[#d8dadc] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f0833e]"
              placeholder="Ingresa tu nueva contraseña"
            />
          </Field>

          <Field label="Confirmación de nueva contraseña">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-[#d8dadc] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f0833e]"
              placeholder="Confirma tu nueva contraseña"
            />
          </Field>

          {passwordError && (
            <p className="text-sm text-red-600" role="alert" aria-live="assertive">
              {passwordError}
            </p>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors"
              disabled={passwordLoading}
            >
              Cancelar
            </button>
            <button
              onClick={handlePasswordChange}
              disabled={passwordLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-[#f0833e] rounded-xl hover:opacity-95 transition-opacity disabled:opacity-50"
            >
              {passwordLoading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditarPerfilAdmin() {
  const { user } = useContext(UserContext);

  // States de datos del perfil
  const [genero, setGenero] = useState("masculino");
  const [rol, setRol] = useState("");
  const [roles, setRoles] = useState([]);
  const [privilegios, setPrivilegios] = useState([]);
  const [showPrivilegios, setShowPrivilegios] = useState(false);
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [municipio, setMunicipio] = useState("");
  //const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [idMunicipio, setIdMunicipio] = useState("");

  // Estados del modal de contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // FOTO DE PERFIL
  const [fotoUrl, setFotoUrl] = useState("");
  const [fotoBase64, setFotoBase64] = useState(null);
  const [editMode, setEditMode] = useState(true);


  const id_usuario = localStorage.getItem("id_usuario") || user?.id;

  // EFECTO PARA LIMPIAR EL ERROR DE CONTRASEÑA
  useEffect(() => {
    if (!passwordError) return;
    const timer = setTimeout(() => setPasswordError(""), 2000);
    return () => clearTimeout(timer);
  }, [passwordError]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resUser = await InformacionUser(id_usuario);
        const data = resUser.data || {};
        setNombre(data.nombre || "");
        setApellidos(data.apellidos || data.apellido);
        setCorreo(data.correo || "");
        setTelefono(data.telefono || "");
        setGenero(data.genero || "masculino");
        if (data.rol?.nombre_rol) setRol(data.rol.nombre_rol);
        if (data.foto_perfil_url) setFotoUrl(data.foto_perfil_url);

        const resDirecciones = await getDirecciones(id_usuario);
        if (resDirecciones.data?.length > 0) {
          const direccionPred = resDirecciones.data.find((d) => d.predeterminada) || resDirecciones.data[0];
          setDireccion(direccionPred.calle || "");
          setMunicipio(direccionPred.ciudad || direccionPred.municipio || "");
          setIdMunicipio(direccionPred.id_municipio || "");
          const resDeptos = await getAllDepartamentos();
          setDepartamentos(resDeptos.data || []);
          const resMunis = await getAllMunicipios();
          setMunicipios(resMunis.data || []);
          const municipioEncontrado = resMunis.data.find((m) => m.id_municipio === direccionPred.id_municipio);
          if (municipioEncontrado) {
            setDepartamento(municipioEncontrado.id_departamento);
          }
        } else {
          const resDeptos = await getAllDepartamentos();
          setDepartamentos(resDeptos.data || []);
          const resMunis = await getAllMunicipios();
          setMunicipios(resMunis.data || []);
        }
      } catch (err) {
        console.error("Error cargando perfil:", err);
      }
    };

    const fetchAuxData = async () => {
      try {
        const resRoles = await getRoles();
        setRoles(resRoles.data || []);
        const resPriv = await getPrivilegios();
        setPrivilegios(resPriv.data.map((p) => p.nombre_privilegio));
        const resDeptos = await getAllDepartamentos();
        setDepartamentos(resDeptos.data || []);
        const resMunis = await getAllMunicipios();
        setMunicipios(resMunis.data || []);
      } catch (err) {
        console.error("Error cargando roles/privilegios/departamentos/municipios:", err);
      }
    };

    if (id_usuario) {
      fetchData();
      fetchAuxData();
    }
  }, [id_usuario]);

  const handleDepartamentoChange = (e) => {
    const nuevoDepartamento = e.target.value;
    setDepartamento(nuevoDepartamento);
    setMunicipio("");
    setIdMunicipio("");
  };

  const handleMunicipioChange = (e) => {
    const nuevoIdMunicipio = e.target.value;
    setIdMunicipio(nuevoIdMunicipio);
    const municipioSeleccionado = municipios.find((m) => m.id_municipio == nuevoIdMunicipio);
    if (municipioSeleccionado) {
      setMunicipio(municipioSeleccionado.nombre_municipio);
    }
  };

  // Manejar subida de foto de perfil
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


  const handleSave = async () => {
    try {
        const rolSeleccionado = roles.find((r) => r.nombre_rol === rol);
        if (!rolSeleccionado) {
            alert("⚠ Rol no válido. Por favor selecciona un rol válido.");
            return;
        }
        const idToUpdate = parseInt(id_usuario);
        if (!idToUpdate) {
            alert("❌ No se pudo determinar el ID del usuario.");
            return;
        }
        const payload = {
            nombre: nombre.trim(),
            apellido: apellidos.trim(),
            correo: correo.trim(),
            telefono: telefono.trim(),
            genero: genero,
            direccion: direccion.trim(),
            departamento: departamento,
            municipio: municipio,
            ciudad: municipio,
            id_rol: rolSeleccionado.id,
        };
        console.log("Payload a enviar:", payload);
        if (!payload.apellido) {
            alert("⚠ El apellido es obligatorio.");
            return;
        }
        const updateResponse = await updateUserById(idToUpdate, payload);
        
        try {
            if (direccion && departamento && municipio && idMunicipio) {
                const direccionPayload = {
                    id_usuario: idToUpdate,
                    calle: direccion,
                    ciudad: municipio,
                    municipio: municipio,
                    departamento: departamento,
                    id_municipio: idMunicipio,
                    predeterminada: true,
                };
                
                const direccionResponse = await addDireccion(direccionPayload);
            }
        } catch (direccionError) {
            console.error("Error al guardar dirección (continuando):", direccionError);
        }
        
        // ✨ ELIMINA el siguiente bloque de código
        /*
        if (selectedPhoto) {
            try {
                const fotoResponse = await uploadProfilePhoto(selectedPhoto);
            } catch (fotoError) {
                console.error("Error al subir foto (continuando):", fotoError);
            }
        }
        */

        alert("✅ Perfil actualizado correctamente");
        window.location.reload();
    } catch (error) {
        console.error("Error completo:", error);
        if (error.response) {
            alert(`Error: ${error.response.data.message || JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            alert("Error de conexión. Verifica tu conexión a internet.");
        } else {
            alert(`Error inesperado: ${error.message}`);
        }
    }
};

  const handlePasswordChange = async () => {
    setPasswordError("");
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("Completa todos los campos");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("La nueva contraseña y la confirmación no coinciden");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    try {
      setPasswordLoading(true);
      // Verificar contraseña anterior usando la ruta de login
      await axiosInstance.post("/api/auth/login", {
        correo,
        ["contraseña"]: oldPassword,
      });
      // Cambiar contraseña
      await changePassword(correo, newPassword);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordModal(false);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data || err.message || String(err);
      setPasswordError(
        msg.includes("Contraseña incorrecta") ? "Contraseña anterior incorrecta" : msg
      );
      console.error("Error cambiando contraseña:", err);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    // Limpiar estados del modal al cerrarlo
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
  };

  return (
    <div className="w-[90vw]">
      <div className="w-full max-w-6xl px-4">
        <div className="rounded-2xl bg-white shadow ring-1 ring-[#d8dadc]">
          <h1 className="pt-4 text-center text-3xl font-semibold text-[#f0833e]">
            Editar Perfil Administrador
          </h1>
          <div className="h-1 w-full bg-[#f0833e]" />
        </div>
      </div>

      <div className="w-full max-w-6xl px-4 mt-6 grid grid-cols-2 gap-6 items-start">
        {/* Sidebar */}
        <aside className="rounded-2xl bg-white p-6 shadow ring-1 ring-[#d8dadc] flex flex-col items-center" style={{ width: 550, height: 553 }}>

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

          <label className="mb-2 w-full text-center text-sm font-semibold text-slate-700">Rol</label>
          <select value={rol} onChange={(e) => setRol(e.target.value)} className="w-56 rounded-xl border border-[#d8dadc] bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2ca9e3]">
            <option value="">Selecciona un rol</option>
            {roles.map((r) => (
              <option key={r.id} value={r.nombre_rol}>
                {r.nombre_rol}
              </option>
            ))}
          </select>

          <button type="button" onClick={() => setShowPrivilegios(true)} className="mt-2 text-xs font-semibold text-[#2b6daf] underline underline-offset-2 hover:opacity-90">
            Ver Privilegios
          </button>
        </aside>

        {/* Main Form */}
        <section className="rounded-2xl bg-white p-6 shadow ring-1 ring-[#d8dadc] flex flex-col justify-between">
          <div>
            <h2 className="mb-4 text-center text-lg font-semibold text-slate-700">Datos generales</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre">
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan Javier" className="w-full rounded-xl border border-[#d8dadc] px-3 py-2 text-sm" />
              </Field>
              <Field label="Género">
                <select value={genero} onChange={(e) => setGenero(e.target.value)} className="w-full rounded-xl border border-[#d8dadc] px-3 py-2 text-sm">
                  <option value="masculino">masculino</option>
                  <option value="femenino">femenino</option>
                  <option value="otro">otro</option>
                </select>
              </Field>
              <Field label="Correo">
                <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="ejemplo@gmail.com" className="w-full rounded-xl border border-[#d8dadc] px-3 py-2 text-sm" />
              </Field>
              <Field label="Apellidos">
                <input value={apellidos} onChange={(e) => setApellidos(e.target.value)} placeholder="Perez Maldonado" className="w-full rounded-xl border border-[#d8dadc] px-3 py-2 text-sm" />
              </Field>
            </div>
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 rounded-xl bg-[#f0833e] px-6 py-2 text-sm font-semibold text-white hover:opacity-95"
              >
                <Icon name="lock" className="h-4 w-4" />
                Cambio de contraseña
              </button>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-4 text-center text-lg font-semibold text-slate-700">Contacto y ubicación</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Dirección">
                <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Bo. El carmen 3 calle 6 ave" className="w-full rounded-xl border border-[#d8dadc] px-3 py-2 text-sm" />
              </Field>
              <Field label="Teléfono">
                <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="8789-9099" className="w-full rounded-xl border border-[#d8dadc] px-3 py-2 text-sm" />
              </Field>
              <Field label="Departamento">
                <select
                  value={departamento}
                  onChange={handleDepartamentoChange}
                  className="w-full rounded-xl border border-[#d8dadc] px-3 py-2 text-sm"
                >
                  <option value="">Seleccione un departamento</option>
                  {departamentos.map((d) => (
                    <option key={d.id_departamento} value={d.nombre_departamento}>
                      {d.nombre_departamento}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Municipio">
                <select
                  value={idMunicipio}
                  onChange={handleMunicipioChange}
                  className="w-full rounded-xl border border-[#d8dadc] px-3 py-2 text-sm"
                  disabled={!departamento}
                >
                  <option value="">Seleccione un municipio</option>
                  {municipios
                    .filter((m) => {
                      const deptoSeleccionado = departamentos.find((d) => d.nombre_departamento === departamento);
                      return deptoSeleccionado && m.id_departamento === deptoSeleccionado.id_departamento;
                    })
                    .map((m) => (
                      <option key={m.id_municipio} value={m.id_municipio}>
                        {m.nombre_municipio}
                      </option>
                    ))}
                </select>
              </Field>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <button
              onClick={handleSave}
              className="rounded-xl bg-[#f0833e] px-6 py-2 text-sm font-semibold text-white shadow hover:opacity-95"
            >
              Guardar cambios
            </button>
          </div>
        </section>
      </div>

      <PrivilegiosModal open={showPrivilegios} onClose={() => setShowPrivilegios(false)} items={privilegios} />

      <CambioContrasenaModal
        open={showPasswordModal}
        onClose={handleClosePasswordModal}
        oldPassword={oldPassword}
        setOldPassword={setOldPassword}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        passwordError={passwordError}
        passwordLoading={passwordLoading}
        handlePasswordChange={handlePasswordChange}
      />
    </div>
  );
  
}