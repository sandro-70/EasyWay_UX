// src/Sidebar.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import "./sidebar.css";
import { UserContext } from "./components/userContext";
import { InformacionRole } from "./api/Usuario.Route";

const norm = (s) => String(s ?? "").trim().toLowerCase();
const normSlug = (s) => norm(s).replace(/\s+/g, "_").replace(/-+/g, "_");
const roleIdFromName = (n) =>
  n === "administrador" ? 1 : n === "cliente" ? 2 : n === "consultor" ? 3 : null;

const Sidebar = ({ moveButton, showSidebar }) => {
  const { user, userRole } = useContext(UserContext);
  const [privs, setPrivs] = useState(new Set());

  const isAdmin = userRole === "administrador";
  const isConsultor = userRole === "consultor";

  useEffect(() => {
    let alive = true;
    (async () => {
      if (isAdmin) { setPrivs(new Set(["*"])); return; }
      if (isConsultor) {
        const roleId = user?.rol?.id_rol ?? roleIdFromName(user?.rol?.nombre_rol ?? userRole);
        if (!roleId) { if (alive) setPrivs(new Set()); return; }
        try {
          const r = await InformacionRole(roleId);
          const lista = Array.isArray(r?.data?.privilegios) ? r.data.privilegios
                      : Array.isArray(r?.data) ? r.data : [];
          const names = lista.map((p) => p?.nombre_privilegio ?? p?.nombre ?? p)
                            .filter(Boolean).map(normSlug);
          if (alive) setPrivs(new Set(names));
        } catch {
          if (alive) setPrivs(new Set());
        }
      } else {
        setPrivs(new Set());
      }
    })();
    return () => { alive = false; };
  }, [isAdmin, isConsultor, user, userRole]);

  const has = (...req) => {
    if (isAdmin) return true;
    const needed = req.flat().map(normSlug);
    return needed.every((p) => privs.has(p));
  };

  const closeIfMobile = () => {
    if (window.innerWidth < 1024) showSidebar(false);
  };

  const handleClick = () => showSidebar(!moveButton);

  return (
    <div>
      <button
        onClick={handleClick}
        className={`btn_sidebar ${moveButton ? "left-[240px]" : "left-2"}`}
      >
        <span className="material-symbols-outlined text-[42px] text-white">menu</span>
      </button>

      {moveButton && (
        <div className="sidebar pt-1">
          {/* BLOQUE SCROLLEABLE */}
          <div className="sidebar-scroll">
            <hr className="bg-white h-[3px] mt-1" />

            {(isAdmin || isConsultor) && (
              <NavLink
                to="/EditarPerfilAdmin"
                className="perfil"
                onClick={closeIfMobile}
              >
                <span className="material-symbols-outlined text-[42px] text-white">person</span>
                Mi Perfil
              </NavLink>
            )}

            <hr className="bg-white h-[3px] mb-2" />

            <ul className="space-y-5 relative flex flex-col pt-1">
              {has("ver_dashboard") && (
                <li>
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) => `sidebar_item ${isActive ? "active" : ""}`}
                    onClick={closeIfMobile}
                  >
                    <span className="material-symbols-outlined text-[42px] text-white">finance_mode</span>
                    Dashboard
                  </NavLink>
                </li>
              )}

              {has("gestionar_productos") && (
                <li>
                  <NavLink
                    to="/gestionProductos"
                    className={({ isActive }) => `sidebar_item ${isActive ? "active" : ""}`}
                    onClick={closeIfMobile}
                  >
                    <span className="material-symbols-outlined text-[42px] text-white">inventory_2</span>
                    Gestión de Categorias
                  </NavLink>
                </li>
              )}

              {has("gestionar_inventario") && (
                <li>
                  <NavLink
                    to="/inventario"
                    className={({ isActive }) => `sidebar_item ${isActive ? "active" : ""}`}
                    onClick={closeIfMobile}
                  >
                    <span className="material-symbols-outlined text-[42px] text-white">package_2</span>
                    Gestion de<br />Inventario
                  </NavLink>
                </li>
              )}

              {(isAdmin || has("ver_reportes_pedidos")) && (
                <li>
                  <NavLink
                    to="/gestionPedidos"
                    className={({ isActive }) => `sidebar_item ${isActive ? "active" : ""}`}
                    onClick={closeIfMobile}
                  >
                    <span className="material-symbols-outlined text-[42px] text-white">assignment</span>
                    Gestion de<br />pedidos
                  </NavLink>
                </li>
              )}

              {has("ver_reportes") && (
                <li>
                  <NavLink
                    to="/reportes"
                    className={({ isActive }) => `sidebar_item ${isActive ? "active" : ""}`}
                    onClick={closeIfMobile}
                  >
                    <span className="material-symbols-outlined text-[42px] text-white">clinical_notes</span>
                    Reportes
                  </NavLink>
                </li>
              )}

              {isAdmin && (
                <>
                  <li>
                    <NavLink
                      to="/MenuPromociones"
                      className={({ isActive }) => `sidebar_item ${isActive ? "active" : ""}`}
                      onClick={closeIfMobile}
                    >
                      <span className="material-symbols-outlined text-[42px] text-white">percent_discount</span>
                      Promociones y descuentos
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/userManagementViews"
                      className={({ isActive }) => `sidebar_item ${isActive ? "active" : ""}`}
                      onClick={closeIfMobile}
                    >
                      <span className="material-symbols-outlined text-[42px] text-white">groups</span>
                      Gestion de <br />Usuarios
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* FOOTER FIJO (fuera del scroll) */}
          {isAdmin && (
            <div className="sidebar-footer">
              <NavLink
                to="/ConfigBanner"
                className={({ isActive }) => `sidebar_item ${isActive ? "active" : ""}`}
                onClick={closeIfMobile}
              >
                <span className="material-symbols-outlined text-[42px] text-white">settings</span>
                Configuracion
              </NavLink>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
