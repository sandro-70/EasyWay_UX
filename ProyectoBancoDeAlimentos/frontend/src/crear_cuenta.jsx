import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { RegistrarUser } from "./api/Usuario.Route";
import "./crear_cuenta.css";

const Crear_cuenta = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    contraseña: "",
    telefono: "",
    genero: "otro",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "correo") {
      value = value.trim().toLowerCase();
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.nombre || !formData.correo || !formData.contraseña) {
        throw new Error("Nombre, correo y contraseña son obligatorios");
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.correo)) {
        throw new Error("Por favor ingresa un correo electrónico válido");
      }

      const payload = {
        ...formData,
        id_rol: 2,
      };

      const res = await RegistrarUser(payload, {
        validateStatus: (s) => s >= 200 && s < 500,
      });

      if (res.status === 201) {
        alert("¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.");
        navigate("/login");
        return;
      }
      console.log("Respuesta del backend:", res.data);

      // Lee msg o message
      const apiMsg = res?.data?.msg || res?.data?.message;

      if (res.status === 400 || res.status === 409) {
        // 400: validación / duplicado (si usas 409 para duplicado, también cae aquí)
        setError(apiMsg || "El correo ya está registrado.");
      } else {
        setError(apiMsg || "Ocurrió un problema. Intenta más tarde.");
      }
    } catch (err) {
      const apiMsg =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        err?.message;
      setError(apiMsg || "Ocurrió un problema. Intenta más tarde.");
      console.debug("Error en registro:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crear-form">
      <img className="logo-titulo" src="/logo-easyway.png" alt="Logo" />
      <p className="crear-text">Crear cuenta</p>
      <p className="menosmin-text">Crea tu cuenta en menos de un minuto!</p>

      <hr className="linea" />

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <input
            type="text"
            className="input-field"
            placeholder="Nombre *"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            className="input-field"
            placeholder="Apellido *"
            name="apellido"
            value={formData.apellido}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            className="input-field"
            placeholder="Correo electrónico *"
            name="correo"
            value={formData.correo}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            className="input-field"
            placeholder="Contraseña *"
            name="contraseña"
            value={formData.contraseña}
            onChange={handleChange}
            required
            minLength={6}
          />

          <input
            type="tel"
            className="input-field"
            placeholder="Teléfono"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="crear-button" disabled={loading}>
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <Link
        to="/login"
        className="ya-tienes-cuenta-link"
        rel="noopener noreferrer"
      >
        ¿Ya tienes una cuenta?
      </Link>
    </div>
  );
};

export default Crear_cuenta;
