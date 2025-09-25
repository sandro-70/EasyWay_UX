import React, { useState, useEffect } from "react";
import PerfilSidebar from "./components/perfilSidebar";
import * as Icon from "lucide-react";
import EditarDireccionModal from "./editarDireccionModal";
import {
  getDirecciones,
  addDireccion,
  eliminarDireccionApi,
  getAllMunicipios,
  getAllDepartamentos,
} from "./api/DireccionesApi";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import "./toast.css";
import { useTranslation } from "react-i18next";

export default function MisDirecciones() {
  const [showModal, setShowModal] = useState(false);
  const [direcciones, setDirecciones] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [editId, setEditId] = useState(null);
  const { t } = useTranslation();

  const [form, setForm] = useState({
    codigoPostal: "",
    calle: "",
    predeterminada: false,
    id_municipio: "",
    id_departamento: "",
  });

  const [errores, setErrores] = useState({});
  /*const [toast, setToast] = useState({ mensaje: "", tipo: "" });

  const showToast = (mensaje, tipo = "error") => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast({ mensaje: "", tipo: "" }), 3000);
  };*/

  const getUserId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      return decoded.id;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    console.log(" municipios:");
    const id_usuario = getUserId();
    if (!id_usuario) {
      toast.error("Usuario no autenticado", { className: "toast-error" });
      return;
    }

    const fetchData = async () => {
      try {
        // Obtener direcciones del usuario

        const direccionesRes = await getDirecciones(id_usuario);
        // Validar que la respuesta sea un array
        if (Array.isArray(direccionesRes.data)) {
          setDirecciones(direccionesRes.data);
        } else {
          setDirecciones([]);
        }

        // Obtener municipios
        console.log(" municipios:");
        const municipiosRes = await getAllMunicipios();
        console.log(" municipios:" + municipiosRes);
        if (Array.isArray(municipiosRes.data)) {
          setMunicipios(municipiosRes.data);
        } else {
          setMunicipios([]);
        }

        // Obtener departamentos
        const departamentosRes = await getAllDepartamentos();
        console.log(" departamentos:" + departamentosRes);

        if (Array.isArray(departamentosRes.data)) {
          setDepartamentos(departamentosRes.data);
        } else {
          setDepartamentos([]);
        }
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
        toast.error("No tiene direcciones", { className: "toast-error" });
        setDirecciones([]);
        setMunicipios([]);
        setDepartamentos([]);
      }
    };

    fetchData();
  }, []); // El array de dependencias vacío asegura que se ejecute solo una vez al montar el componente

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    let nuevosErrores = {};
    if (!form.calle.trim()) nuevosErrores.calle = "La calle es obligatoria";
    if (!form.codigoPostal.trim())
      nuevosErrores.codigoPostal = "El código postal es obligatorio";
    if (!form.id_municipio.trim())
      nuevosErrores.id_municipio = "El municipio es obligatorio";

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      toast.warn("Por favor completa todos los campos obligatorios", {
        className: "toast-warn",
      });
      return;
    }

    try {
      const id_usuario = getUserId();
      if (!id_usuario) return;

      const municipioSeleccionado = municipios.find(
        (m) => m.id_municipio == form.id_municipio
      );
      const payload = {
        id_usuario,
        calle: form.calle,
        codigo_postal: form.codigoPostal,
        predeterminada: form.predeterminada,
        id_municipio: form.id_municipio,
        id_departamento: form.id_departamento,
        ciudad: municipioSeleccionado
          ? municipioSeleccionado.nombre_municipio
          : null,
      };

      await addDireccion(payload);
      const res = await getDirecciones(id_usuario);
      // Validar la respuesta de nuevo por si se vuelve a vaciar
      if (Array.isArray(res.data)) {
        setDirecciones(res.data);
      } else {
        setDirecciones([]);
      }

      setForm({
        codigoPostal: "",
        calle: "",
        predeterminada: false,
        id_municipio: "",
        id_departamento: "",
      });
      toast.success("Dirección guardada con éxito", {
        className: "toast-success",
      });
    } catch (error) {
      console.error("Error al guardar dirección:", error);
      toast.error("Error al guardar dirección", { className: "toast-error" });
    }
  };

  const removeRow = async (id) => {
    try {
      const id_usuario = getUserId();
      await eliminarDireccionApi({ id_usuario, id_direccion: id });
      const res = await getDirecciones(id_usuario);
      // Validar la respuesta de nuevo
      if (Array.isArray(res.data)) {
        setDirecciones(res.data);
      } else {
        setDirecciones([]);
      }
      toast.success("Dirección eliminada correctamente", {
        className: "toast-success",
      });
    } catch (error) {
      console.error("Error al eliminar dirección:", error);
      toast.error("Error al eliminar dirección", { className: "toast-error" });
    }
  };

  const getMunicipioById = (id) =>
    municipios.find((m) => m.id_municipio === id)?.nombre_municipio || "";
  const getDeptoPorMunicipio = (idMunicipio) => {
    const municipio = municipios.find((m) => m.id_municipio === idMunicipio);
    if (!municipio) return "";
    return (
      departamentos.find((d) => d.id_departamento === municipio.id_departamento)
        ?.nombre_departamento || ""
    );
  };

  return (
    <div className="mis-direcciones">
      <section className="sidebar">
        <PerfilSidebar />
      </section>

      <div className="direccion-pago-layout">
        <div>
          <h1 className="titulo-direcciones">{t("perfil.myAddresses")}</h1>
          <hr className="direccion-separado" />

          {/* Formulario */}
          <div className="formulario-direccion">
            <form onSubmit={handleSave}>
              <div
                style={{ display: "flex", gap: "20px", marginBottom: "15px" }}
              >
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <label style={{ marginBottom: "5px" }}>
                    {" "}
                    {t("codigoPostal")}
                  </label>
                  <input
                    type="text"
                    name="codigoPostal"
                    placeholder="Ej: 21101"
                    value={form.codigoPostal}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                    }}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <label style={{ marginBottom: "5px" }}>
                    {" "}
                    {t("Department")}
                  </label>
                  <select
                    name="id_departamento"
                    value={form.id_departamento}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                    }}
                  >
                    <option value="">{t("select")}</option>
                    {departamentos.map((d) => (
                      <option key={d.id_departamento} value={d.id_departamento}>
                        {d.nombre_departamento}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                style={{ display: "flex", gap: "20px", marginBottom: "15px" }}
              >
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <label style={{ marginBottom: "5px" }}>
                    {t("City/Town")}
                  </label>
                  <select
                    name="id_municipio"
                    value={form.id_municipio}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                    }}
                  >
                    <option value="">{t("select")}</option>
                    {municipios
                      .filter((m) => m.id_departamento == form.id_departamento)
                      .map((m) => (
                        <option key={m.id_municipio} value={m.id_municipio}>
                          {m.nombre_municipio}
                        </option>
                      ))}
                  </select>
                </div>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <label style={{ marginBottom: "5px" }}>{t("street")}</label>
                  <input
                    type="text"
                    name="calle"
                    placeholder="Ej: Calle José Ortega"
                    value={form.calle}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  marginBottom: "15px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <input
                  type="checkbox"
                  id="predeterminado"
                  name="predeterminada"
                  checked={form.predeterminada}
                  onChange={handleChange}
                />
                <label htmlFor="predeterminado" style={{ marginLeft: "8px" }}>
                  {t("setDefaultAddress")}
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="submit"
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    backgroundColor: "#f0833e",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  {editId ? t("perfil.update") : t("perfil.save")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      codigoPostal: "",
                      calle: "",
                      predeterminada: false,
                      id_municipio: "",
                      id_departamento: "",
                    })
                  }
                  style={{
                    padding: "10px 20px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {t("perfil.cancel")}
                </button>
              </div>
            </form>
          </div>

          {/* Tabla */}
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "10px",
              border: "1px solid #eee",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f9f9f9" }}>
                  <th
                    style={{ padding: "10px", borderBottom: "1px solid #ddd" }}
                  >
                    ID
                  </th>
                  <th
                    style={{ padding: "10px", borderBottom: "1px solid #ddd" }}
                  >
                    {t("codigoPostal")}
                  </th>
                  <th
                    style={{ padding: "10px", borderBottom: "1px solid #ddd" }}
                  >
                    {t("Department")}
                  </th>
                  <th
                    style={{ padding: "10px", borderBottom: "1px solid #ddd" }}
                  >
                    {t("street")}
                  </th>
                  <th
                    style={{ padding: "10px", borderBottom: "1px solid #ddd" }}
                  >
                    {t("City")}
                  </th>
                  <th
                    style={{ padding: "10px", borderBottom: "1px solid #ddd" }}
                  >
                    {t("Predetermined")}
                  </th>
                  <th
                    style={{ padding: "10px", borderBottom: "1px solid #ddd" }}
                  >
                    {t("options")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {direcciones.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      style={{ textAlign: "center", padding: "15px" }}
                    >
                      {t("noAddresses")}
                    </td>
                  </tr>
                ) : (
                  direcciones.map((d) => (
                    <tr key={d.id_direccion}>
                      <td
                        style={{
                          padding: "10px",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        {d.id_direccion}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        {d.codigo_postal}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        {d.id_municipio
                          ? getDeptoPorMunicipio(d.id_municipio)
                          : "N/A"}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        {d.calle}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        {d.id_municipio
                          ? getMunicipioById(d.id_municipio)
                          : "N/A"}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        {d.predeterminada ? "Sí" : "No"}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        <button
                          onClick={() => {
                            setShowModal(true);
                          }}
                          style={{
                            marginRight: "10px",
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                          }}
                        ></button>
                        <button
                          onClick={() => removeRow(d.id_direccion)}
                          style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                          }}
                        >
                          <Icon.Trash size={18} color="red" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Toast */}
        {toast.mensaje && (
          <div
            style={{
              position: "fixed",
              top: "95px",
              right: "20px",
              background: toast.tipo === "success" ? "#2b6daf" : "#d8572f",
              color: "white",
              padding: "12px 20px",
              borderRadius: "12px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
              zIndex: 1000,
              animation: "fadein 0.3s, fadeout 0.5s 2.5s",
            }}
          >
            {toast.mensaje}
          </div>
        )}
        {showModal && (
          <EditarDireccionModal
            setShowModal={setShowModal}
            setDirecciones={setDirecciones}
            getUserId={getUserId}
            direcciones={direcciones}
            //setToast={setToast}
          />
        )}
      </div>
    </div>
  );
}
