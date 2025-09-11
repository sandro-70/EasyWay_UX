// src/context/UserContext.jsx
import { createContext, useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";
import { InformacionUser } from "../api/Usuario.Route";

export const UserContext = createContext();

function normalizeRole(payload) {
  const me = payload?.user ?? payload ?? null;
  const raw =
    me?.rol?.nombre_rol ||
    payload?.role ||
    me?.rol ||
    (typeof me?.id_rol === "number"
      ? me.id_rol === 1
        ? "administrador"
        : "cliente"
      : null);
  return typeof raw === "string" ? raw.toLowerCase() : raw || null;
}

export const UserProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null); // 'administrador' | 'cliente' | null
  const [user, setUser] = useState(null); // 👈 nuevo estado para info completa del usuario
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUserRole(null);
      setUser(null); // 👈 también limpiamos info del usuario
      return;
    }
    try {
      const res = await InformacionUser(); // tu /api/auth/me
      setUser(res.data); // 👈 guardamos info completa
      const roleName = normalizeRole(res?.data);
      setUserRole(roleName);
    } catch (err) {
      setUserRole(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refreshUser();
      setLoading(false);
    })();
  }, [refreshUser]);

  // Multi-tab: si el token cambia en otra pestaña, refrescamos.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token") refreshUser();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refreshUser]);

  const login = async (token) => {
    localStorage.setItem("token", token);
    await refreshUser(); // fuerza re-render del header
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUserRole(null); // fuerza re-render del header
    setUser(null); // limpiamos info del usuario
  };

  const isAuthenticated = !!userRole;
  const isAdmin = userRole === "administrador";

  return (
    <UserContext.Provider
      value={{
        userRole,
        user, // 👈 ahora disponible para foto y datos
        setUser, // 👈 permite actualizar foto desde MiPerfil
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
