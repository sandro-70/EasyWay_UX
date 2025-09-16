// src/components/ProtectedRoute.jsx
import { useEffect, useMemo, useRef, useState, useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "./userContext";
import { InformacionRole } from "../api/Usuario.Route";

const PRIV_CACHE = new Map();

const norm = (s) => String(s ?? "").trim().toLowerCase();
const normSlug = (s) => norm(s).replace(/\s+/g, "_").replace(/-+/g, "_");
const roleIdFromName = (n) => (n==="administrador"?1:n==="cliente"?2:n==="consultor"?3:null);

export default function ProtectedRoute({
  children,
  rolesPermitidos = [],
  privilegiosNecesarios = [],
  requireAll = false,
  redirectTo = "/login",
  loadingFallback = null,
}) {
  const { user, userRole, loading: userLoading } = useContext(UserContext);

  const [loadingPrivs, setLoadingPrivs] = useState(false);
  const [rolePrivs, setRolePrivs] = useState(null);
  const lastPrivsRef = useRef(null);

  const userRoleIdRaw = useMemo(
    () => user?.rol?.id_rol ?? user?.id_rol ?? user?.role_id ?? null,
    [user]
  );
  const userRoleName = useMemo(
    () => norm(userRole) || norm(user?.rol?.nombre_rol) || norm(user?.role),
    [userRole, user]
  );
  const userRoleId = userRoleIdRaw ?? roleIdFromName(userRoleName); // ⬅️ fallback por nombre
  const isAdmin = userRoleName === "administrador" || Number(userRoleId) === 1;
  const needPrivCheck = Array.isArray(privilegiosNecesarios) && privilegiosNecesarios.length > 0;

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!needPrivCheck) { setRolePrivs([]); return; }
      if (isAdmin) { setRolePrivs(["*"]); lastPrivsRef.current = ["*"]; return; }

      if (!userRoleId) {
        setLoadingPrivs(true);
        setRolePrivs(null);
        return;
      }

      if (PRIV_CACHE.has(userRoleId)) {
        const cached = PRIV_CACHE.get(userRoleId);
        if (alive) { setRolePrivs(cached); lastPrivsRef.current = cached; }
        return;
      }

      try {
        setLoadingPrivs(true);
        const res = await InformacionRole(userRoleId);
        if (res?.status === 304) {
          if (alive) setRolePrivs(prev => prev ?? lastPrivsRef.current ?? null);
          return;
        }
        const payload = res?.data;
        const list = Array.isArray(payload?.privilegios) ? payload.privilegios
                   : Array.isArray(payload) ? payload : [];
        const names = list.map((p) => p?.nombre_privilegio ?? p?.nombre ?? p)
                          .filter(Boolean)
                          .map(normSlug);
        if (!alive) return;
        PRIV_CACHE.set(userRoleId, names);
        lastPrivsRef.current = names;
        setRolePrivs(names);
      } catch (e) {
        console.error("[PR] error cargando privilegios:", e);
        if (!alive) return;
        if (lastPrivsRef.current) setRolePrivs(lastPrivsRef.current);
        else setRolePrivs(null);
      } finally {
        if (alive) setLoadingPrivs(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [needPrivCheck, userRoleId, isAdmin]);

  if (userLoading) return loadingFallback ?? null;
  if (!userRoleName) return <Navigate to={redirectTo} replace />;

  if (isAdmin) {
    if (!rolesPermitidos?.length) return children;
    const names = rolesPermitidos.filter((x) => typeof x === "string").map(norm);
    const ids = new Set(rolesPermitidos.filter((x) => typeof x === "number").map(Number));
    if (names.includes("administrador") || ids.has(1)) return children;
  }

  if (needPrivCheck) {
    if (loadingPrivs || rolePrivs === null) return loadingFallback ?? null;
    const requeridos = privilegiosNecesarios.map(normSlug);
    const owned = new Set(rolePrivs);
    const hasAll = requeridos.every((p) => owned.has(p));
    const hasAny = requeridos.some((p) => owned.has(p));
    const allowed = requireAll ? hasAll : hasAny;
    return allowed ? children : <Navigate to="/" replace />;
  }

  if (rolesPermitidos && rolesPermitidos.length > 0) {
    const names = rolesPermitidos.filter((x) => typeof x === "string").map(norm);
    const ids = new Set(rolesPermitidos.filter((x) => typeof x === "number").map(Number));
    const okByName = userRoleName && names.includes(userRoleName);
    const okById = userRoleId != null && ids.has(Number(userRoleId));
    return okByName || okById ? children : <Navigate to="/" replace />;
  }

  return children;
}
