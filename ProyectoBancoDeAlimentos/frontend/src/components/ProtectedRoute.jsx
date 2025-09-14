// src/components/ProtectedRoute.jsx
import { useEffect, useMemo, useState, useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "./userContext";
import { InformacionRole } from "../api/Usuario.Route";

export default function ProtectedRoute({
  children,
  rolesPermitidos = [],
  privilegiosNecesarios = [],
  requireAll = false,
  redirectTo = "/login",
  loadingFallback = null,
}) {
  const { user, loading: userLoading } = useContext(UserContext);
  const [loadingPrivs, setLoadingPrivs] = useState(false);
  const [rolePrivs, setRolePrivs] = useState(null);

  const norm = (s) => String(s ?? "").trim().toLowerCase();
  const normSlug = (s) =>
    norm(s).replace(/\s+/g, "_").replace(/-+/g, "_"); // "Gestionar Inventario" -> "gestionar_inventario"

  const needPrivCheck =
    Array.isArray(privilegiosNecesarios) && privilegiosNecesarios.length > 0;

  const mapRoleNameById = (id) => {
    switch (Number(id)) {
      case 1:
        return "administrador";
      case 2:
        return "cliente";
      case 3:
        return "consultor";
      default:
        return "";
    }
  };

  const userRoleId = useMemo(
    () => user?.rol?.id_rol ?? user?.id_rol ?? user?.role_id ?? null,
    [user]
  );

  const userRoleName = useMemo(
    () =>
      norm(user?.rol?.nombre_rol) ||
      norm(user?.rol?.role_name) ||
      norm(user?.role) ||
      mapRoleNameById(userRoleId),
    [user, userRoleId]
  );

  // Carga privilegios del rol si la ruta los exige
  useEffect(() => {
    let alive = true;
    const fetchPrivs = async () => {
      if (!needPrivCheck || !userRoleId) {
        setRolePrivs([]); // estado estable
        return;
      }
      try {
        setLoadingPrivs(true);
        const res = await InformacionRole(userRoleId);
        const flat = Array.isArray(res?.data) ? res.data : [];

        // normaliza TODOS a slug
        const names = flat.map((p) =>
          normSlug(p?.nombre_privilegio ?? p?.nombre ?? p?.slug ?? p?.codigo ?? p)
        );

        if (alive) setRolePrivs(names);

        // DEBUG: quita esto en producción
        console.debug("[ProtectedRoute] rolePrivs=", names);
      } catch (e) {
        console.error("Error cargando privilegios del rol:", e);
        if (alive) setRolePrivs([]);
      } finally {
        if (alive) setLoadingPrivs(false);
      }
    };
    fetchPrivs();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needPrivCheck, userRoleId]);

  // Espera user
  if (userLoading) return loadingFallback ?? null;

  // No autenticado
  if (!user) return <Navigate to={redirectTo} replace />;

  // ---- BYPASS PARA ADMIN ----
  const isAdmin =
    userRoleName === "administrador" || Number(userRoleId) === 1;
  if (isAdmin) {
    // Admin entra con rol permitido (si lo configuraste) y además ignora privilegios faltantes
    if (rolesPermitidos?.length > 0) {
      const names = rolesPermitidos.filter((x) => typeof x === "string").map(norm);
      const ids = new Set(rolesPermitidos.filter((x) => typeof x === "number").map(Number));
      const okByName = names.includes("administrador");
      const okById = ids.has(1);
      if (okByName || okById) return children;
      // si la ruta no permite admin explícitamente, sigue el flujo normal (raro en tu caso)
    } else {
      return children;
    }
  }

  // Validación por privilegios (si se pide y no es admin)
  if (needPrivCheck) {
    if (loadingPrivs || rolePrivs === null) return loadingFallback ?? null;

    const requeridos = privilegiosNecesarios.map(normSlug);
    const setUser = new Set(rolePrivs);

    // DEBUG: quita esto en producción
    console.debug("[ProtectedRoute] requeridos=", requeridos);

    const hasAll = requeridos.every((p) => setUser.has(p));
    const hasAny = requeridos.some((p) => setUser.has(p));
    const allowed = requireAll ? hasAll : hasAny;

    return allowed ? children : <Navigate to="/" replace />;
  }

  // Validación por rol (acepta id o nombre)
  if (rolesPermitidos && rolesPermitidos.length > 0) {
    const permitidosNames = rolesPermitidos
      .filter((x) => typeof x === "string")
      .map(norm);
    const permitidosIds = new Set(
      rolesPermitidos.filter((x) => typeof x === "number").map(Number)
    );
    const okByName = userRoleName && permitidosNames.includes(userRoleName);
    const okById = userRoleId != null && permitidosIds.has(Number(userRoleId));
    const ok = okByName || okById;
    return ok ? children : <Navigate to="/" replace />;
  }

  return children;
}
