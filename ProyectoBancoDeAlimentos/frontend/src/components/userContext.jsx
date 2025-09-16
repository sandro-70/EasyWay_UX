// src/components/userContext.jsx
import { createContext, useState, useEffect, useCallback } from "react";
import { InformacionUser } from "../api/Usuario.Route";

export const UserContext = createContext();

/* ===== Helpers ===== */
function parseJwt(token) {
  try {
    if (!token) return null;
    const b = token.split(".")[1];
    if (!b) return null;
    const j = atob(b.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(
      decodeURIComponent(
        [...j].map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
      )
    );
  } catch {
    return null;
  }
}
const fileNameFromPath = (p) => (!p ? "" : String(p).split("/").pop());
const getClaimFoto = (claims) => {
  if (!claims) return "";
  const u = claims?.user ?? claims;
  return u?.foto_perfil_url || u?.foto_perfil || u?.foto || u?.avatar || u?.profile_photo || "";
};

const roleIdFromName = (name) => {
  const n = (name || "").toString().trim().toLowerCase();
  if (n === "administrador") return 1;
  if (n === "cliente") return 2;
  if (n === "consultor") return 3;
  return null;
};
const roleNameFromId = (id) => {
  const n = Number(id);
  if (n === 1) return "administrador";
  if (n === 2) return "cliente";
  if (n === 3) return "consultor";
  return null;
};

function normalizeRole(payload) {
  const me = payload?.user ?? payload ?? {};
  const rawObj = typeof me?.rol === "object" ? me.rol : null;
  const rawStr = typeof me?.rol === "string" ? me.rol : null;

  let id =
    rawObj?.id_rol ??
    rawObj?.id ??
    me?.id_rol ??
    me?.role_id ??
    (rawStr ? roleIdFromName(rawStr) : null);

  let name =
    (rawObj?.nombre_rol ?? rawObj?.name ?? rawStr ?? me?.role)?.toString().toLowerCase() ??
    null;

  if (!name && id != null) name = roleNameFromId(id);
  if (name && id == null) id = roleIdFromName(name);
  return name || null;
}

/* ===== Provider ===== */
export const UserProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null);
  const [user, _setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const mergeUser = (prev, apiData, claimFotoName) => {
    const next = { ...(prev || {}), ...(apiData || {}) };

    // ---- Normaliza rol: nunca lo borres; completa id o nombre si faltan ----
    const prevRol = prev?.rol && typeof prev.rol === "object" ? prev.rol : null;
    const inRolObj = apiData?.rol && typeof apiData.rol === "object" ? apiData.rol : null;
    const inRolStr = apiData?.rol && typeof apiData.rol === "string" ? apiData.rol : null;

    let rid =
      inRolObj?.id_rol ??
      inRolObj?.id ??
      apiData?.id_rol ??
      apiData?.role_id ??
      prevRol?.id_rol ??
      null;

    let rname =
      (inRolObj?.nombre_rol ?? inRolObj?.name ?? inRolStr ?? apiData?.role)?.toString().toLowerCase() ||
      prevRol?.nombre_rol ||
      null;

    if (!rname && rid != null) rname = roleNameFromId(rid);
    if (rname && rid == null) rid = roleIdFromName(rname);

    if (rid != null || rname) {
      next.rol = { id_rol: rid, nombre_rol: rname || null };
    } else if (prevRol) {
      next.rol = prevRol; // conserva rol previo si el payload no trae
    }

    // ---- Foto / cache-buster ----
    const apiFotoName = fileNameFromPath(
      apiData?.foto_perfil_url || apiData?.foto_perfil || apiData?.foto || ""
    );
    const prevFoto = prev?.foto_perfil_url || "";
    const finalFoto = apiFotoName || prevFoto || claimFotoName || "";
    if (finalFoto) next.foto_perfil_url = finalFoto;

    if (!next.avatar_rev || (finalFoto && finalFoto !== prevFoto)) {
      next.avatar_rev = Date.now();
    }
    return next;
  };

  const setUser = (updater) => {
    _setUser((prev) => {
      const claims = parseJwt(localStorage.getItem("token") || "");
      const claimFotoName = fileNameFromPath(getClaimFoto(claims));
      const incoming = typeof updater === "function" ? updater(prev) : updater;
      return mergeUser(prev, incoming, claimFotoName);
    });
  };

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUserRole(null);
      _setUser(null);
      return;
    }

    const claims = parseJwt(token);
    const claimFotoName = fileNameFromPath(getClaimFoto(claims));

    try {
      const res = await InformacionUser(); // acepta /info sin id
      const apiUser = res?.data?.user ?? res?.data ?? {};
      _setUser((prev) => mergeUser(prev, apiUser, claimFotoName));

      const nextRole = normalizeRole(res?.data ?? apiUser);
      setUserRole((prev) => nextRole || prev || null);
    } catch {
      _setUser((prev) => {
        const next = { ...(prev || {}) };
        if (claimFotoName && !next.foto_perfil_url) next.foto_perfil_url = claimFotoName;
        if (!next.avatar_rev) next.avatar_rev = Date.now();
        return next;
      });
      setUserRole((prev) => prev ?? null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refreshUser();
      setLoading(false);
    })();
  }, [refreshUser]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token") refreshUser();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refreshUser]);

  const login = async (token) => {
    localStorage.setItem("token", token);
    const claims = parseJwt(token);
    const claimFotoName = fileNameFromPath(getClaimFoto(claims));
    if (claimFotoName) {
      _setUser((prev) => ({
        ...(prev || {}),
        foto_perfil_url: claimFotoName,
        avatar_rev: Date.now(),
      }));
    }
    await refreshUser();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUserRole(null);
    _setUser(null);
  };

  const roleNorm = (userRole || "").trim().toLowerCase();
  const isAuthenticated = !!roleNorm;
  const isAdmin = roleNorm === "administrador";
  const isConsultor = roleNorm === "consultor";

  if (typeof window !== "undefined") window.__debugUser = user;

  return (
    <UserContext.Provider
      value={{
        userRole: roleNorm,
        user,
        setUser,
        loading,
        isAuthenticated,
        isAdmin,
        isConsultor,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
