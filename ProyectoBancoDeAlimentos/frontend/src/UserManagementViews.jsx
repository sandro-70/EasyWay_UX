import React, { useMemo, useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import "./UserManagementViews.css";

/** ==== API ==== */
import {
  getAllInformacionUsuario,
  RegistrarUser,
  updateUserById,
  EditProfile,
  getRoles,
  addPrivilegio,
  asignarPrivilegioARol,
  getPrivilegios,
} from "./api/Usuario.Route";

import { manejoUsuarioPrivilegios, getRolesYPrivilegiosDeUsuario } from "./api/roles_privilegiosApi";

const StatusBadge = ({ value }) => (
  <span className={"status-badge " + (value === "ACTIVO" ? "activo" : "inactivo")}>
    {value}
  </span>
);
const RolePill = ({ role }) => <span className="role-pill">{role}</span>;

const Modal = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            <Icon icon="mdi:close" width={20} height={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

function Field({ label, value, onChange, readOnly, as = "input", children, placeholder, type = "text" }) {
  return (
    <label>
      <span>{label}</span>
      {as === "select" ? (
        <select value={value} onChange={onChange} disabled={readOnly}>
          {children}
        </select>
      ) : (
        <input
          readOnly={readOnly}
          value={value}
          onChange={onChange || (() => { })}
          placeholder={placeholder}
          type={type}
        />
      )}
    </label>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      <div className="tabs-nav">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${active === t.key ? "active" : ""}`}
            onClick={() => onChange(t.key)}
            type="button"
          >
            {t.icon && <Icon icon={t.icon} />}
            {t.label}
          </button>
        ))}
      </div>
      <div className="tabs-body">
        {tabs.find((t) => t.key === active)?.content}
      </div>
    </div>
  );
}


/** ==== Helpers de roles/permiso ==== */
const buildRoleMaps = (rolesApi = []) => {
  const idToName = new Map();
  const nameToId = new Map();
  rolesApi.forEach(r => {
    idToName.set(String(r.id_rol), r.nombre_rol);
    nameToId.set(r.nombre_rol, Number(r.id_rol));
  });
  // Fallbacks
  if (!nameToId.has("Administrador")) nameToId.set("Administrador", 1);
  if (!nameToId.has("Usuario")) nameToId.set("Usuario", 2);
  if (!nameToId.has("Consultor")) nameToId.set("Consultor", 3);
  if (!idToName.has("1")) idToName.set("1", "Administrador");
  if (!idToName.has("2")) idToName.set("2", "Usuario");
  if (!idToName.has("3")) idToName.set("3", "Consultor");
  return { idToName, nameToId };
};

const normRole = (roleName) => String(roleName || "").toLowerCase().trim();
const showPrivTab = (roleName) => {
  const r = normRole(roleName);
  return r === "consultor" || r === "consultante";
};
const isAdminRoleName = (v) => normRole(v) === "administrador";

// Detecta si el USUARIO ACTUAL es admin desde localStorage (ajusta si usas otro método)
const detectCurrentUserIsAdmin = () => {
  try {
    const r = (localStorage.getItem("rol") || localStorage.getItem("role") || "").toLowerCase();
    const id = String(localStorage.getItem("id_rol") || "");
    return r === "administrador" || id === "1";
  } catch { return false; }
};
// Quién está logueado (ajusta claves si tu localStorage usa otros nombres)
const detectCurrentUser = () => {
  try {
    return {
      id: Number(localStorage.getItem("id_usuario") || localStorage.getItem("id") || 0),
      role: (localStorage.getItem("rol") || localStorage.getItem("role") || "").toLowerCase(),
    };
  } catch {
    return { id: 0, role: "" };
  }
};


const NormprivilegiosApi = (raw = []) => {
  if (!Array.isArray(raw)) return [];
  return raw.map((p, i) => {
    const id = Number(p.id_privilegio ?? p.id ?? i + 1);
    const lbl = String(p.nombre_privilegio ?? p.nombre ?? p.label ?? `Privilegio ${id}`).trim();
    return { id, label: lbl };
  });
}

const buildPrivMaps = (list = []) => {
  const idToLabel = new Map();
  const labelToId = new Map();
  list.forEach(p => {
    idToLabel.set(Number(p.id), p.label);
    if (!labelToId.has(p.label)) labelToId.set(p.label, Number(p.id));
  });
  return { idToLabel, labelToId };
};

const splitPrivileges = (privs) => {
  const ids = [];
  const names = [];
  if (Array.isArray(privs)) {
    for (const p of privs) {
      if (typeof p === "number") ids.push(p);
      else if (typeof p === "string") names.push(p);
      else if (p && typeof p === "object") {
        if (Number.isFinite(p.id)) ids.push(p.id);
        else if (Number.isFinite(p.id_privilegio)) ids.push(p.id_privilegio);
        else if (p.nombre) names.push(String(p.nombre));
        else if (p.nombre_privilegio) names.push(String(p.nombre_privilegio));
        else if (p.label) names.push(String(p.label));
      }
    }
  }
  return { ids, names };
};

const buildPrivilegeView = (userPrivs, catalog, privMaps) => {
  const { ids, names } = splitPrivileges(userPrivs);
  const list = Array.isArray(catalog) ? catalog : [];
  // Si vinieron nombres, mapéalos a IDs reales del catálogo
  const nameIds = (names || [])
    .map(n => privMaps.labelToId.get(n))
    .filter((x) => Number.isFinite(x));
  // Si vinieron IDs que no estén en catálogo, se ignoran (catálogo es la verdad)
  const checkedIds = Array.from(new Set([...(ids || []), ...nameIds]))
    .filter((id) => list.some(p => Number(p.id) === Number(id)));
  return { list, checkedIds };
};

export default function UserManagementViews() {
  /** ==== Estado principal ==== */
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const [createOpen, setCreateOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [infoUser, setInfoUser] = useState(null);
  const [editUser, setEditUser] = useState(null);

  const [infoTab, setInfoTab] = useState("resumen");
  const [editTab, setEditTab] = useState("datos");

  const [privCatalog, setPrivCatalog] = useState([]);              // [{id,label}]
  const [privMaps, setPrivMaps] = useState({ idToLabel: new Map(), labelToId: new Map() });

  const [roleMaps, setRoleMaps] = useState({ idToName: new Map(), nameToId: new Map() });
  const currentUser = useMemo(() => detectCurrentUser(), []);

  // Crear (rol fijo Consultor)
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    role: "Consultor",   // fijo consultor
    status: "ACTIVO",
    privileges: [],
    correo: "",
    contraseña: ""
  });

  const currentUserIsAdmin = useMemo(() => detectCurrentUserIsAdmin(), []);

  /** ==== Carga inicial ==== */
  useEffect(() => {
    (async () => {
      try {
        const rolesRes = await getRoles();
        const maps = buildRoleMaps(rolesRes?.data || []);
        setRoleMaps(maps);


        // 2) Privilegios
        const privRes = await getPrivilegios();
        const norm = NormprivilegiosApi(privRes?.data || privRes || []);
        setPrivCatalog(norm);
        setPrivMaps(buildPrivMaps(norm));

        //const privuser = await manejoUsuarioPrivilegios();
        const resp = await getAllInformacionUsuario();
        const arr = Array.isArray(resp?.data) ? resp.data : (resp?.data?.usuarios || []);
        const uiUsers = (arr || []).map((u, idx) => {
          const { ids, names } = splitPrivileges(u.privilegios ?? u.privileges);
          return {
            dbId: u.id_usuario ?? u.id ?? idx + 1,
            id: String(u.id_usuario ?? u.id ?? idx + 1).padStart(3, "0"),
            firstName: u.nombre ?? u.firstName ?? "",
            lastName: u.apellido ?? u.lastName ?? "",
            role: maps.idToName.get(String(u.id_rol)) || u.rol || "Usuario",
            status: (u.estado || "ACTIVO").toUpperCase(),
            correo: u.correo ?? u.email ?? "-",
            genero: u.genero ?? u.gender ?? "Otro",
            privileges: ids,
            privilegeNames: names,
          };
        });
        setUsers(uiUsers);
      } catch (err) {
        console.error("Error cargando usuarios:", err);
        setUsers([]);
      }
    })();
  }, []);

  /** ==== Búsqueda/paginación ==== */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.id, u.firstName, u.lastName, u.role, u.status, u.correo, u.genero].join(" ").toLowerCase().includes(q)
    );
  }, [users, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const visible = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  /** ==== Crear ==== */
  const handleCreate = async () => {
    const { firstName, lastName, role, correo, contraseña } = newUser;
    if (!firstName.trim() || !lastName.trim()) {
      alert("Nombre y Apellido son obligatorios.");
      return;
    }
    if (!correo.trim() || !contraseña.trim()) {
      alert("Correo y Contraseña son obligatorios.");
      return;
    }

    try {
      const id_rol = roleMaps.nameToId.get(role) ?? 3; // Consultor
      await RegistrarUser({
        nombre: firstName.trim(),
        apellido: lastName.trim(),
        correo: correo.trim(),
        contraseña: contraseña.trim(),
        telefono: "",
        id_rol,
      });

      // refrescar lista
      const r = await getAllInformacionUsuario();
      const arr = Array.isArray(r?.data) ? r.data : (r?.data?.usuarios || []);
      const uiUsers = (arr || []).map((u, idx) => {
        const { ids, names } = splitPrivileges(u.privilegios ?? u.privileges);
        return {
          dbId: u.id_usuario ?? u.id ?? idx + 1,
          id: String(u.id_usuario ?? u.id ?? idx + 1).padStart(3, "0"),
          firstName: u.nombre ?? "",
          lastName: u.apellido ?? "",
          role: roleMaps.idToName.get(String(u.id_rol)) || u.rol || "Usuario",
          status: (u.estado || "ACTIVO").toUpperCase(),
          correo: u.correo ?? u.email ?? "-",
          genero: u.genero ?? u.gender ?? "Otro",
          privileges: ids,
          privilegeNames: names,
        };
      });
      setUsers(uiUsers);
      setCreateOpen(false);
      setNewUser({
        firstName: "",
        lastName: "",
        role: "Consultor",
        status: "ACTIVO",
        privileges: [],
        correo: "",
        contraseña: ""
      });
      setPage(1);
    } catch (err) {
      console.error("RegistrarUser error:", err);
      alert("No se pudo crear el usuario. Revisa el backend/logs.");
    }
  };

  /** ==== Info ==== */
  // INFORMACIÓN (solo lectura) – cargar privilegios en vivo
  const openInfo = async (u) => {
    try {
      // 1) Pide al backend el rol + privilegios del usuario (por NOMBRE)
      const r = await getRolesYPrivilegiosDeUsuario(u.dbId);

      // Sequelize a veces devuelve user.rol o user.rols; ambos incluyen privilegios [{ nombre_privilegio }]
      const privNames = Array.isArray(r?.data?.privilegios)
        ? r.data.privilegios.map(p => String(p.nombre_privilegio || "").trim()).filter(Boolean)
        : (
          Array.isArray(r?.data?.[0]?.privilegios)
            ? r.data[0].privilegios.map(p => String(p.nombre_privilegio || "").trim()).filter(Boolean)
            : []
        );

      // 2) Convierte nombres → IDs del catálogo y marca checkboxes
      const view = buildPrivilegeView(
        privNames.length ? privNames : (u.privilegeNames?.length ? u.privilegeNames : u.privileges),
        privCatalog,
        privMaps
      );

      setInfoUser({
        ...u,
        _privView: view.list,        // catálogo que se dibuja
        privileges: view.checkedIds, // IDs chequeados
      });
      setInfoTab("resumen");
      setInfoOpen(true);
    } catch (err) {
      console.warn("No se pudo cargar privilegios live; fallback a datos locales:", err);
      const view = buildPrivilegeView(
        u.privilegeNames?.length ? u.privilegeNames : u.privileges,
        privCatalog,
        privMaps
      );
      setInfoUser({
        ...u,
        _privView: view.list,
        privileges: view.checkedIds,
      });
      setInfoTab("resumen");
      setInfoOpen(true);
    }
  };


  const closeInfo = () => { setInfoOpen(false); setInfoUser(null); };

  /** ==== Editar ==== */
  const openEdit = async (u) => {
    try {
      const r = await getRolesYPrivilegiosDeUsuario(u.dbId);
      const privNames = Array.isArray(r?.data?.privilegios)
        ? r.data.privilegios.map(p => String(p.nombre_privilegio || "").trim()).filter(Boolean)
        : [];

      const view = buildPrivilegeView(
        privNames.length ? privNames : (u.privilegeNames?.length ? u.privilegeNames : u.privileges),
        privCatalog,
        privMaps
      );

      setEditUser({
        ...u,
        _privView: view.list,
        privileges: view.checkedIds,
        _originalRole: u.role,
        _originalCorreo: (u.correo ?? "").trim().toLowerCase(),
      });
      setEditTab("datos");
      setEditOpen(true);
    } catch (err) {
      console.warn("No se pudo cargar privilegios live; fallback a datos locales:", err);
      const view = buildPrivilegeView(
        u.privilegeNames?.length ? u.privilegeNames : u.privileges,
        privCatalog,
        privMaps
      );
      setEditUser({
        ...u,
        _privView: view.list,
        privileges: view.checkedIds,
        _originalRole: u.role,
        _originalCorreo: (u.correo ?? "").trim().toLowerCase(),
      });
      setEditTab("datos");
      setEditOpen(true);
    }
  };


  const closeEdit = () => { setEditOpen(false); setEditUser(null); };

  const saveEdit = async () => {
    if (!editUser) return;

    try {
      const isEditingSelf =
        Number(editUser.dbId) === Number(currentUser.id) && currentUser.id !== 0;

      // Resuelve el rol destino SOLO si es admin y está permitido
      let roleNameForPayload = editUser._originalRole;
      if (currentUserIsAdmin && isAdminRoleName(editUser._originalRole)) {
        roleNameForPayload =
          editUser.role === "Consultor" ? "Consultor" : "Administrador";
      }

      // Construye payload de forma segura (solo campos válidos)
      const payload = {};
      if ((editUser.firstName ?? "").trim()) payload.nombre = editUser.firstName.trim();
      if ((editUser.lastName ?? "").trim()) payload.apellido = editUser.lastName.trim();
      if ((editUser.telefono ?? "").trim()) payload.telefono = String(editUser.telefono).trim();
      if (typeof editUser.tema !== "undefined") payload.tema = !!editUser.tema;
      if ((editUser.genero ?? "").trim()) payload.genero = editUser.genero.trim(); // opcional si lo activaste

      // Solo admin editando a OTROS puede tocar correo/id_rol/activo
      if (!isEditingSelf && currentUserIsAdmin) {
        if ((editUser.correo ?? "").trim()) {
          payload.correo = String(editUser.correo).trim().toLowerCase();
        }
        // id_rol desde el nombre calculado arriba
        const maybeRolId =
          roleMaps.nameToId.get(roleNameForPayload) ??
          roleMaps.nameToId.get(editUser._originalRole);
        if (Number.isInteger(maybeRolId)) payload.id_rol = Number(maybeRolId);

        // estado -> activo
        if (typeof editUser.status !== "undefined") {
          payload.activo = String(editUser.status).toUpperCase() === "ACTIVO";
        }
      }

      // Evita mandar payload vacío (dispararía "Nada que actualizar")
      if (Object.keys(payload).length === 0) {
        alert("No hay cambios válidos para enviar.");
        return;
      }

      if (isEditingSelf) {
        // /perfil (PUT/PATCH) – tu helper ya lo envía así
        await EditProfile({ id: editUser.dbId, ...payload });
      } else {
        // /usuarios/:id – ADMIN
        await updateUserById(editUser.dbId, payload);
      }

      // Refrescar tabla...
      try {
        const r = await getAllInformacionUsuario();
        const arr = Array.isArray(r?.data) ? r.data : (r?.data?.usuarios || []);
        const uiUsers = (arr || []).map((u, idx) => {
          const { ids, names } = splitPrivileges(u.privilegios ?? u.privileges);
          return {
            dbId: u.id_usuario ?? u.id ?? idx + 1,
            id: String(u.id_usuario ?? u.id ?? idx + 1).padStart(3, "0"),
            firstName: u.nombre ?? "",
            lastName: u.apellido ?? "",
            role: roleMaps.idToName.get(String(u.id_rol)) || u.rol || "Usuario",
            status: (u.activo ? "ACTIVO" : "INACTIVO"),
            correo: u.correo ?? u.email ?? "-",
            genero: u.genero ?? "otro",
            privileges: ids,
            privilegeNames: names,
          };
        });
        setUsers(uiUsers);
      } catch (errRefresh) {
        // fallback local
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editUser.id ? { ...u, ...editUser, role: roleNameForPayload } : u
          )
        );
      }
      // === Asignación de privilegios (Consultor) ===
      if (showPrivTab(roleNameForPayload) && !isEditingSelf && currentUserIsAdmin) {
        const selectedIds = Array.isArray(editUser.privileges) ? editUser.privileges : [];
        try {
          await manejoUsuarioPrivilegios(editUser.dbId, selectedIds);
        } catch (e) {
          console.error("No se pudo actualizar privilegios del rol:", e);
          alert("No se pudieron guardar los privilegios. Revisa backend/logs.");
        }
      }


      closeEdit();
    } catch (err) {
      console.error("Error guardando edición:", err);
      alert("No se pudo guardar. Revisa permisos y datos válidos.");
    }
  };
  // === Iconos SVG locales (idéntico al de inventario) ===
  const SvgIcon = {
    Edit: (props) => (
      <svg viewBox="0 0 24 24" className={"svg-20 " + (props.className || "")}>
        <path
          d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    ),
  };


  return (
    <div className="page-container">
      <main className="main-content">
        <header className="page-header">
          <h1><span className="accent">Gestión De Usuarios</span></h1>

          <button className="btn-primary" onClick={() => setCreateOpen(true)}>
            <Icon icon="mdi:account-plus" />
            <span>Crear Usuario</span>
          </button>

        </header>
        <div className="divider" />
        <div className="search-bar">
          <div className="search-input">
            <Icon icon="mdi:magnify" className="search-icon" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Buscar Usuario"
            />
          </div>

          <div className="user-count">
            <span>Usuarios registrados:</span>
            <span className="count-bubble">{filtered.length}</span>
          </div>
        </div>

        {/* Tabla */}
        <div className="table-container">
          <div className="table-scroll">
          <table className="users-table">
            <colgroup>
              <col className="col-id" />
              <col className="col-name" />
              <col className="col-last" />
              <col className="col-status" />
              <col className="col-role" />
              <col className="col-actions" />
            </colgroup>

            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Estado</th>
                <th>Rol</th>
                <th>Opciones</th>
              </tr>
            </thead>

            <tbody>
              {visible.map((u) => (
                <tr key={u.id}>
                  <td className="cell-center">{u.id}</td>
                  <td className="cell-left"><span className="truncate">{u.firstName}</span></td>
                  <td className="cell-left"><span className="truncate">{u.lastName}</span></td>
                  <td className="cell-center"><StatusBadge value={u.status} /></td>
                  <td className="cell-center"><RolePill role={u.role} /></td>
                  <td className="cell-center">
                    <div className="action-buttons">
                      <button onClick={() => openInfo(u)} aria-label="Información" className="icon-btn icon-btn--view">
                       <Icon icon="mdi:eye-outline" className="icon--view" />  </button>
                      <button onClick={() => openEdit(u)} aria-label="Editar" className="icon-btn icon-btn--edit">
                        <SvgIcon.Edit className="icon--edit" />
                      </button> </div>
                  </td>
                </tr>
              ))}

              {visible.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: 20 }}>
                    No hay resultados para “{query}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
            {/* Paginación */}
        <div className="pagination">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe === 1} aria-label="Página anterior">
            <Icon icon="mdi:chevron-left" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => setPage(n)} className={n === pageSafe ? "active" : ""} aria-label={`Ir a página ${n}`}>
              {n}
            </button>
          ))}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={pageSafe === totalPages} aria-label="Página siguiente">
            <Icon icon="mdi:chevron-right" />
          </button>
        </div>
          </div>
        </div>

      
      </main>

      {/* CREAR */}
      <Modal open={createOpen} title="Crear usuario" onClose={() => setCreateOpen(false)}>
        <div className="modal-body modal-grid-2">
          <Field label="Nombre" value={newUser.firstName} onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })} placeholder="Nombre" />
          <Field label="Apellido" value={newUser.lastName} onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })} placeholder="Apellido" />
          <Field label="Correo" value={newUser.correo} onChange={(e) => setNewUser({ ...newUser, correo: e.target.value })} placeholder="correo@dominio.com" type="email" />
          <Field label="Contraseña" value={newUser.contraseña} onChange={(e) => setNewUser({ ...newUser, contraseña: e.target.value })} placeholder="********" type="password" />
          {/* Rol fijo en "Consultor" y no editable */}
          <Field label="Rol" value="Consultor" readOnly />
          <Field label="Estado" as="select" value={newUser.status} onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}>
            <option value="ACTIVO">ACTIVO</option>
            <option value="INACTIVO">INACTIVO</option>
          </Field>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={() => setCreateOpen(false)}>Cancelar</button>
          <button className="btn-primary" onClick={handleCreate}>
            <Icon icon="mdi:plus" /> Crear
          </button>
        </div>
      </Modal>

      {/* INFORMACIÓN (solo lectura) */}
      <Modal open={infoOpen} title="Información del usuario" onClose={closeInfo}>
        {infoUser && (
          <Tabs
            active={infoTab}
            onChange={setInfoTab}
            tabs={[
              {
                key: "resumen",
                label: "Resumen",
                icon: "mdi:account-badge",
                content: (
                  <div className="modal-body modal-grid-2">
                    <Field label="Nombre" value={infoUser.firstName ?? "-"} readOnly />
                    <Field label="Apellido" value={infoUser.lastName ?? "-"} readOnly />
                    <Field label="Correo" value={infoUser.correo ?? "-"} readOnly />
                    <Field label="Género" value={infoUser.genero ?? "-"} readOnly />
                    <Field label="Rol" value={infoUser.role ?? "-"} readOnly />
                    <Field label="Estado" value={infoUser.status ?? "-"} readOnly />
                  </div>
                ),
              },
              ...(showPrivTab(infoUser.role)
                ? [{
                  key: "priv",
                  label: "Privilegios",
                  icon: "mdi:shield-key-outline",
                  content: (
                    <div className="priv-list">
                      {(infoUser._privView || privCatalog).map((p) => {
                        const checked = infoUser.privileges?.includes(p.id);
                        return (
                          <label className="priv-item readonly" key={p.id}>
                            <input type="checkbox" checked={!!checked} disabled />
                            <span className="edit-checkmark"></span>
                            <span className="priv-label">{p.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  ),
                }]
                : []
              ),
            ]}
          />
        )}
        <div className="modal-actions">
          <button className="btn-primary" onClick={closeInfo}>
            <Icon icon="mdi:check" /> Aceptar
          </button>
        </div>
      </Modal>

      {/* EDITAR */}
      <Modal open={editOpen} title="Editar usuario" onClose={closeEdit}>
        {editUser && (
          <Tabs
            active={editTab}
            onChange={setEditTab}
            tabs={[
              {
                key: "datos",
                label: "Datos personales",
                icon: "mdi:account-edit-outline",
                content: (
                  <div className="modal-body modal-grid-2">
                    <Field label="ID" value={editUser.id} readOnly />

                    {/* ===== Rol (reglas) =====
                       Select solo si el editor es Admin y el usuario ORIGINAL es Administrador.
                       En caso contrario (Usuario/Consultor), solo lectura.
                    */}
                    {currentUserIsAdmin && isAdminRoleName(editUser._originalRole) ? (
                      <Field
                        label="Rol"
                        as="select"
                        value={editUser.role}
                        onChange={(e) => {
                          const next = e.target.value;
                          if (next === "Consultor" || next === "Administrador") {
                            setEditUser({ ...editUser, role: next });
                          } else {
                            setEditUser({ ...editUser, role: editUser._originalRole });
                          }
                        }}
                      >
                        <option value="Administrador">Administrador</option>
                        <option value="Consultor">Consultor</option>
                      </Field>
                    ) : (
                      <Field label="Rol" value={editUser.role} readOnly />
                    )}

                    <Field
                      label="Nombre"
                      value={editUser.firstName}
                      onChange={(e) => setEditUser({ ...editUser, firstName: e.target.value })}
                    />
                    <Field
                      label="Apellido"
                      value={editUser.lastName}
                      onChange={(e) => setEditUser({ ...editUser, lastName: e.target.value })}
                    />

                    {/* Correo */}
                    <Field
                      label="Correo"
                      value={editUser.correo ?? ""}
                      onChange={(e) => setEditUser({ ...editUser, correo: e.target.value })}
                      type="email"
                      placeholder="correo@dominio.com"
                    />

                    {/* Género */}
                    <Field
                      label="Género"
                      as="select"
                      value={editUser.genero ?? "Otro"}
                      onChange={(e) => setEditUser({ ...editUser, genero: e.target.value })}
                    >
                      <option>Masculino</option>
                      <option>Femenino</option>
                      <option>Otro</option>
                    </Field>

                    <Field
                      label="Estado"
                      as="select"
                      value={editUser.status}
                      onChange={(e) => setEditUser({ ...editUser, status: e.target.value })}
                    >
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="INACTIVO">INACTIVO</option>
                    </Field>
                  </div>
                ),
              },
              ...(showPrivTab(editUser.role)
                ? [{
                  key: "priv",
                  label: "Privilegios",
                  icon: "mdi:shield-key-outline",
                  content: (
                    <div className="priv-list">
                      {(editUser._privView || privCatalog).map((p) => {
                        const checked = editUser.privileges?.includes(p.id);
                        return (
                          <label className="priv-item" key={p.id}>
                            <input
                              type="checkbox"
                              checked={!!checked}
                              onChange={() => {
                                const has = editUser.privileges?.includes(p.id);
                                const next = has
                                  ? editUser.privileges.filter((x) => x !== p.id)
                                  : [...(editUser.privileges || []), p.id];
                                setEditUser({ ...editUser, privileges: next });
                              }}
                            />
                            <span className="edit-checkmark"></span>
                            <span className="priv-label">{p.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  ),
                }]
                : []
              )
            ]}
          />
        )}
        <div className="modal-actions">
          <button className="btn-primary" onClick={saveEdit}>
            <Icon icon="mdi:content-save-outline" /> Guardar
          </button>
        </div>
      </Modal>
    </div>
  );
}
