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
  const u = claims.user ?? claims;
  return u?.foto_perfil_url || u?.foto_perfil || u?.foto || u?.avatar || u?.profile_photo || "";
};
function normalizeRole(payload) {
  const me = payload?.user ?? payload ?? null;
  const raw =
    me?.rol?.nombre_rol ||
    payload?.role ||
    me?.rol ||
    (typeof me?.id_rol === "number" ? (me.id_rol === 1 ? "administrador" : "cliente") : null);
  return typeof raw === "string" ? raw.toLowerCase() : raw || null;
}

/* ===== Provider ===== */
export const UserProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Funde datos: prioriza foto API si existe; si no, conserva previa; si no, usa la del token
  const mergeUser = (prev, apiData, claimFotoName) => {
    const next = { ...(prev || {}), ...(apiData || {}) };

    const apiFotoName = fileNameFromPath(
      apiData?.foto_perfil_url || apiData?.foto_perfil || apiData?.foto || ""
    );
    const prevFoto = prev?.foto_perfil_url || "";
    const finalFoto = apiFotoName || prevFoto || claimFotoName || "";

    if (finalFoto) next.foto_perfil_url = finalFoto;

    // cache-buster
    if (!next.avatar_rev || (finalFoto && finalFoto !== prevFoto)) {
      next.avatar_rev = Date.now();
    }
    return next;
  };

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUserRole(null);
      setUser(null);
      return;
    }

    const claims = parseJwt(token);
    const claimFotoName = fileNameFromPath(getClaimFoto(claims));

    try {
      const res = await InformacionUser(); // /api/auth/me o similar
      const apiUser = res?.data?.user ?? res?.data ?? {};
      setUser((prev) => mergeUser(prev, apiUser, claimFotoName));
      setUserRole(normalizeRole(res?.data ?? apiUser));
    } catch {
      // Si falla la API, conserva la foto del token
      setUser((prev) => {
        const next = { ...(prev || {}) };
        if (claimFotoName && !next.foto_perfil_url) next.foto_perfil_url = claimFotoName;
        if (!next.avatar_rev) next.avatar_rev = Date.now();
        return next;
      });
      setUserRole(null);
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

  // Login: empuja foto del token al instante y luego refresca API
  const login = async (token) => {
    localStorage.setItem("token", token);

    const claims = parseJwt(token);
    const claimFotoName = fileNameFromPath(getClaimFoto(claims));
    if (claimFotoName) {
      setUser((prev) => ({
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
    setUser(null);
  };

  const isAuthenticated = !!userRole;
  const isAdmin = userRole === "administrador";

  // Debug útil:
  if (typeof window !== "undefined") window.__debugUser = user;

  return (
    <UserContext.Provider
      value={{
        userRole,
        user,
        setUser,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
