// src/components/ProtectedRoute.jsx
import { useEffect, useMemo, useState, useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "./userContext";
import { InformacionRole } from "../api/Usuario.Route";

/**
 * Props:
 * - children: ReactNode
 * - rolesPermitidos?: string[]          -> fallback por rol (se mantiene compatibilidad)
 * - privilegiosNecesarios?: string[]    -> si viene, se valida por privilegios
 * - requireAll?: boolean                -> true = exige TODOS; false = basta con UNO (default: false)
 * - redirectTo?: string                 -> ruta si no autorizado (default: "/login")
 * - loadingFallback?: ReactNode         -> UI mientras carga privilegios (default: null)
 */
export default function ProtectedRoute({
  children,
  rolesPermitidos = [],
  privilegiosNecesarios = [],
  requireAll = false,
  redirectTo = "/login",
  loadingFallback = null,
}) {
  const { user } = useContext(UserContext);
  const [loadingPrivs, setLoadingPrivs] = useState(false);
  const [rolePrivs, setRolePrivs] = useState(null); // array de strings normalizados

  const norm = (s) => String(s || "").trim().toLowerCase();

  const userRoleName = useMemo(() => {
    return (
      norm(user?.rol?.nombre_rol) ||
      norm(user?.rol?.role_name) ||
      norm(user?.role) ||
      ""
    );
  }, [user]);

  const userRoleId = useMemo(() => {
    return user?.rol?.id_rol ?? user?.id_rol ?? user?.role_id ?? null;
  }, [user]);

  const needPrivCheck =
    Array.isArray(privilegiosNecesarios) && privilegiosNecesarios.length > 0;

  // Cargar privilegios del rol sólo si es necesario para esta ruta
  useEffect(() => {
    let alive = true;

    const fetchPrivs = async () => {
      if (!needPrivCheck || !userRoleId) return;
      try {
        setLoadingPrivs(true);
        const res = await InformacionRole(userRoleId);
        const raw = res?.data ?? [];
        const flat = Array.isArray(raw) ? raw : [];
        const names = flat.map((p) =>
          norm(
            p?.nombre_privilegio ??
              p?.nombre ??
              p?.slug ??
              p?.codigo ??
              p
          )
        );
        if (alive) setRolePrivs(names);
      } catch (e) {
        console.error("Error cargando privilegios del rol:", e);
        if (alive) setRolePrivs([]); // sin privilegios
      } finally {
        if (alive) setLoadingPrivs(false);
      }
    };

    fetchPrivs();
    return () => {
      alive = false;
    };
  }, [needPrivCheck, userRoleId]);

  // No autenticado
  if (!user) return <Navigate to={redirectTo} replace />;

  // Validación por privilegios (si se solicita)
  if (needPrivCheck) {
    if (loadingPrivs || !rolePrivs) return loadingFallback;
    const requeridos = privilegiosNecesarios.map(norm);
    const setUser = new Set(rolePrivs);
    const hasAll = requeridos.every((p) => setUser.has(p));
    const hasAny = requeridos.some((p) => setUser.has(p));
    const allowed = requireAll ? hasAll : hasAny;
    return allowed ? children : <Navigate to="/" replace />;
  }

  // Fallback por rol (rutas antiguas)
  if (rolesPermitidos && rolesPermitidos.length > 0) {
    const permitidos = rolesPermitidos.map(norm);
    const ok = userRoleName && permitidos.includes(userRoleName);
    return ok ? children : <Navigate to="/" replace />;
  }

  // Si no se configuró nada, basta con estar logueado
  return children;
}
