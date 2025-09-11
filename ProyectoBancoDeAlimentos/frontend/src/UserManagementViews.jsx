import React, { useMemo, useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import "./UserManagementViews.css";

/** ==== API ==== */
import {
  getAllInformacionUsuario,
  RegistrarUser,
  updateUserById,
  EditProfile,            // <-- fallback para editar sin :id
  getRoles,
  addPrivilegio,
  asignarPrivilegioARol,
} from "./api/Usuario.Route";

/** Catálogo de privilegios por defecto (fallback visual) */
const PRIV_LIST = [
  { id: 1, label: "Gestionar Productos" },
  { id: 2, label: "Gestionar Inventario" },
  { id: 3, label: "Ver reportes" },
  { id: 4, label: "Privilegio 4" },
  { id: 5, label: "Privilegio 5" },
  { id: 6, label: "Privilegio 6" },
];

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

function Field({ label, value, onChange, readOnly, as = "input", children, placeholder, type="text" }) {
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
          onChange={onChange || (() => {})}
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

/** Utilidad: mapeo rol <-> id_rol */
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

/** Helpers para Privilegios */
const normRole = (roleName) => String(roleName || "").toLowerCase().trim();
const showPrivTab = (roleName) => {
  const r = normRole(roleName);
  return r === "consultor" || r === "consultante";
};

/** Normaliza privilegios desde backend a {ids:number[], names:string[]} */
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

/** Construye lista de privilegios para UI (si hay nombres, los usa; si no, PRIV_LIST) */
const buildPrivilegeView = (privs) => {
  const { ids, names } = splitPrivileges(privs);
  if (names.length > 0) {
    const list = names.map((label, i) => ({ id: i + 1, label }));
    const checkedIds = list.map(x => x.id);
    return { list, checkedIds };
  }
  return { list: PRIV_LIST.slice(), checkedIds: ids.filter(Number.isFinite) };
};

export default function UserManagementViews() {
  /** ==== Estado principal ==== */
  const [users, setUsers] = useState([]);  // sin seed
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

  const [roleMaps, setRoleMaps] = useState({ idToName: new Map(), nameToId: new Map() });
    const [moveButton, setLeft] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
  // Crear (mantengo tu UI actual)
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    role: "Usuario",
    status: "ACTIVO",
    privileges: [],
    correo: "",
    contraseña: ""
  });

  /** ==== Carga inicial ==== */
  useEffect(() => {
    (async () => {
      try {
        const rolesRes = await getRoles();
        const maps = buildRoleMaps(rolesRes?.data || []);
        setRoleMaps(maps);

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

  const handleClick = () => {
    setLeft(!moveButton);
    setShowSidebar(!showSidebar);
  };
  /** ==== Búsqueda/paginación ==== */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.id, u.firstName, u.lastName, u.role, u.status].join(" ").toLowerCase().includes(q)
    );
  }, [users, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const visible = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  /** ==== Crear (sin tocar UI) ==== */
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
      const id_rol = roleMaps.nameToId.get(role) ?? 2;
      await RegistrarUser({
        nombre: firstName.trim(),
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
          privileges: ids,
          privilegeNames: names,
        };
      });
      setUsers(uiUsers);
      setCreateOpen(false);
      setNewUser({
        firstName: "",
        lastName: "",
        role: "Usuario",
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
  const openInfo = (u) => {
    const view = buildPrivilegeView(u.privilegeNames?.length ? u.privilegeNames : u.privileges);
    setInfoUser({
      ...u,
      _privView: view.list,
      privileges: view.checkedIds,
    });
    setInfoTab("resumen");
    setInfoOpen(true);
  };
  const closeInfo = () => { setInfoOpen(false); setInfoUser(null); };

  /** ==== Editar ==== */
  const openEdit = (u) => {
    const view = buildPrivilegeView(u.privilegeNames?.length ? u.privilegeNames : u.privileges);
    setEditUser({
      ...u,
      _privView: view.list,
      privileges: view.checkedIds,
    });
    setEditTab("datos");
    setEditOpen(true);
  };
  const closeEdit = () => { setEditOpen(false); setEditUser(null); };

  const saveEdit = async () => {
    if (!editUser) return;

    try {
      const payload = {
        nombre: editUser.firstName,
        apellido: editUser.lastName,
        id_rol: roleMaps.nameToId.get(editUser.role) ?? 2,
        estado: editUser.status,
      };

      // Intento 1: /perfil/:id
      try {
        await updateUserById(editUser.dbId, payload);
      } catch (e1) {
        // Intento 2 (fallback): /perfil (sin :id)
        await EditProfile({ id: editUser.dbId, ...payload });
      }

      // Privilegios SOLO si es Consultante/Consultor
      if (showPrivTab(editUser.role)) {
        for (const p of editUser.privileges || []) {
          const privObj = (editUser._privView || PRIV_LIST).find(x => x.id === p);
          const label = privObj?.label;
          if (label) {
            try {
              await addPrivilegio(editUser.dbId, label);
              await asignarPrivilegioARol(editUser.dbId, roleMaps.nameToId.get(editUser.role) ?? 3, p);
            } catch (e) {
              console.warn("No se pudo asignar privilegio:", label, e);
            }
          }
        }
      }

      // Reflejar en UI
      setUsers((prev) => prev.map((u) => (u.id === editUser.id ? { ...u, ...editUser } : u)));
      closeEdit();
    } catch (err) {
      console.error("Error guardando edición:", err);
      alert("No se pudo guardar. Revisa el backend/logs.");
    }
  };

  return (
    <div className="page-container">
      <main className="main-content">
        <header className="page-header">
          <h1><span className="accent">Gestión Perfil De Usuarios</span></h1>

          <button className="btn-primary" onClick={() => setCreateOpen(true)}>
            <Icon icon="mdi:account-plus" />
            <span>Crear Usuario</span>
          </button>
        </header>
      
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
                      <button onClick={() => openInfo(u)} aria-label="Información"><Icon icon="mdi:eye-outline" /></button>
                      <button onClick={() => openEdit(u)} aria-label="Editar"><Icon icon="mdi:pencil-outline" /></button>
                    </div>
                  </td>
                </tr>
              ))}

              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 20 }}>
                    No hay resultados para “{query}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
      </main>

      {/* CREAR */}
      <Modal open={createOpen} title="Crear usuario" onClose={() => setCreateOpen(false)}>
        <div className="modal-body modal-grid-2">
          <Field label="Nombre" value={newUser.firstName} onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })} placeholder="Nombre" />
          <Field label="Apellido" value={newUser.lastName} onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })} placeholder="Apellido" />
          {/* UI actual */}
          <Field label="Correo" value={newUser.correo} onChange={(e) => setNewUser({ ...newUser, correo: e.target.value })} placeholder="correo@dominio.com" type="email" />
          <Field label="Contraseña" value={newUser.contraseña} onChange={(e) => setNewUser({ ...newUser, contraseña: e.target.value })} placeholder="********" type="password" />
          <Field label="Rol" as="select" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
            <option>Consultor</option>
          </Field>
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
                    <Field label="Rol" value={infoUser.role ?? "-"} readOnly />
                    <Field label="Estado" value={infoUser.status ?? "-"} readOnly />
                  </div>
                ),
              },
              // Tab Privilegios (Consultor/Consultante)
              ...( showPrivTab(infoUser.role)
                ? [{
                    key: "priv",
                    label: "Privilegios",
                    icon: "mdi:shield-key-outline",
                    content: (
                      <div className="priv-list">
                        {(infoUser._privView || PRIV_LIST).map((p) => {
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
                    <Field
                      label="Rol"
                      as="select"
                      value={editUser.role}
                      onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                    >
                      <option>Administrador</option>
                      <option>Usuario</option>
                      <option>Consultor</option>
                    </Field>
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
              // Tab Privilegios (Consultor/Consultante)
              ...( showPrivTab(editUser.role)
                ? [{
                    key: "priv",
                    label: "Privilegios",
                    icon: "mdi:shield-key-outline",
                    content: (
                      <div className="priv-list">
                        {(editUser._privView || PRIV_LIST).map((p) => {
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
          <button className="btn-secondary" onClick={closeEdit}>Cancelar</button>
          <button className="btn-primary" onClick={saveEdit}>
            <Icon icon="mdi:content-save-outline" /> Guardar
          </button>
        </div>
      </Modal>
    </div>
    
  );
}
