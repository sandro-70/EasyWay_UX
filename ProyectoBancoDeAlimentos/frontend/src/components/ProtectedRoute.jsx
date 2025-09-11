import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, rolesPermitidos }) => {
  const token = localStorage.getItem("token");
  const rol = localStorage.getItem("rol"); // 👈 lo guardas en login.jsx

  // Si no hay token, mandamos a login
  if (!token) {
    return <Navigate to="/login" />;
  }

  // Si hay roles permitidos y el rol actual no está en la lista
  if (rolesPermitidos && !rolesPermitidos.includes(rol?.toLowerCase())) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default ProtectedRoute;
