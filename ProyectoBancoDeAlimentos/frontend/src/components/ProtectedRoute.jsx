import { Navigate } from "react-router-dom";

const ProtectedRoute = ({
  children,
  rolesPermitidos,
  privilegiosNecesarios,
}) => {
  const token = localStorage.getItem("token");
  const rol = localStorage.getItem("rol");

  if (!token) {
    return <Navigate to="/login" />;
  }

  // Roles permitidos (admin, cliente)
  if (rolesPermitidos && !rolesPermitidos.includes(rol?.toLowerCase())) {
    return <Navigate to="/unauthorized" />;
  }

  // ✅ Privilegios para consultor
  if (rol?.toLowerCase() === "consultor" && privilegiosNecesarios?.length > 0) {
    const privilegiosUsuario = JSON.parse(
      localStorage.getItem("privilegios") || "[]"
    );

    const tienePrivilegio = privilegiosNecesarios.every((p) =>
      privilegiosUsuario.includes(p)
    );

    if (!tienePrivilegio) {
      return <Navigate to="/unauthorized" />;
    }
  }

  return children;
};

export default ProtectedRoute;
