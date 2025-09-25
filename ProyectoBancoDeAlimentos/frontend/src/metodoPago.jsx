import React, { useState, useEffect, useRef } from "react";
import "./metodoPago.css";
import PerfilSidebar from "./components/perfilSidebar";
import {
  getAllMetodoPago,
  createMetodoPago,
  deleteMetodoPago,
  setMetodoPagoDefault,
} from "./api/metodoPagoApi";
import arrowL from "./images/arrowL.png";
import arrowR from "./images/arrowR.png";
import chip from "./images/chip.png";
import { toast } from "react-toastify";
import "./toast.css";
import { useTranslation } from "react-i18next";

export default function MetodoPago() {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [metodosPago, setMetodosPago] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    numero_tarjeta: "",
    nombre: "",
    apellido: "",
    vencimiento_mes: "",
    vencimiento_ano: "",
    cvv: "",
  });

  useEffect(() => {
    cargarMetodosPago();
  }, []);

  const cargarMetodosPago = async () => {
    try {
      setCargando(true);
      const response = await getAllMetodoPago();
      setMetodosPago(response.data);
    } catch (error) {
      console.error("Error al cargar métodos de pago:", error);
      toast.error("No se pudieron cargar los métodos de pago", {
        className: "toast-error",
      });
    } finally {
      setCargando(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "numero_tarjeta") {
      const onlyNumbers = value.replace(/\D/g, "");
      const formattedValue = onlyNumbers
        .replace(/(\d{4})/g, "$1 ")
        .trim()
        .slice(0, 19);
      setFormData({ ...formData, [name]: formattedValue });
      return;
    }

    if (name === "vencimiento") {
      const [mes, ano] = value.split("/");
      setFormData({
        ...formData,
        vencimiento_mes: mes || "",
        vencimiento_ano: ano || "",
      });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const mes = parseInt(formData.vencimiento_mes, 10);
      const ano = parseInt(formData.vencimiento_ano, 10);
      const anoCompleto = ano < 100 ? 2000 + ano : ano;

      if (isNaN(mes) || mes < 1 || mes > 12) {
        return toast.error("Mes de vencimiento inválido (1-12)", {
          className: "toast-error",
        });
      }

      if (isNaN(anoCompleto) || anoCompleto < 2000 || anoCompleto > 2100) {
        return toast.error("Año de vencimiento inválido", {
          className: "toast-error",
        });
      }

      const numeroTarjetaLimpio = formData.numero_tarjeta.replace(/\s/g, "");
      const payload = {
        token_pago: generarTokenSimulado(numeroTarjetaLimpio),
        brand_tarjeta: determinarMarcaTarjeta(numeroTarjetaLimpio),
        tarjeta_ultimo: numeroTarjetaLimpio.slice(-4),
        vencimiento_mes: mes,
        vencimiento_ano: anoCompleto,
        nombre_en_tarjeta: `${formData.nombre} ${formData.apellido}`,
        id_direccion_facturacion: null,
        metodo_predeterminado: metodosPago.length === 0,
      };

      await createMetodoPago(payload);
      toast.success("Método de pago agregado correctamente", {
        className: "toast-success",
      });
      setShowForm(false);
      setFormData({
        numero_tarjeta: "",
        nombre: "",
        apellido: "",
        vencimiento_mes: "",
        vencimiento_ano: "",
        cvv: "",
      });
      cargarMetodosPago();
    } catch (error) {
      console.error("Error al agregar método de pago:", error);
      toast.error(
        error.response?.data?.message || "Error al agregar el método de pago",
        { className: "toast-error" }
      );
    }
  };

  const generarTokenSimulado = (numeroTarjeta) => {
    return `tok_${numeroTarjeta.slice(-8)}_${Date.now()}`;
  };

  const determinarMarcaTarjeta = (numero) => {
    if (/^4/.test(numero)) return "Visa";
    if (/^5[1-5]/.test(numero)) return "Mastercard";
    if (/^3[47]/.test(numero)) return "American Express";
    if (/^6/.test(numero)) return "Discover";
    return "Otra";
  };

  const handleEliminar = async (id) => {
    if (
      window.confirm(
        "¿Estás seguro de que quieres eliminar este método de pago?"
      )
    ) {
      try {
        await deleteMetodoPago(id);
        toast.info("Método de pago eliminado", { className: "toast-info" });
        cargarMetodosPago();
      } catch (error) {
        console.error("Error al eliminar método de pago:", error);
        toast.error("Error al eliminar el método de pago", {
          className: "toast-error",
        });
      }
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setMetodoPagoDefault(id);
      toast.success("Método de pago predeterminado actualizado", {
        className: "toast-success",
      });
      cargarMetodosPago();
    } catch (error) {
      console.error("Error al establecer método predeterminado:", error);
      toast.error("Error al establecer método predeterminado", {
        className: "toast-error",
      });
    }
  };

  const tarjetasRef = useRef(null);

  const scroll = (direction) => {
    if (tarjetasRef.current) {
      const tarjeta = tarjetasRef.current.querySelector(".tarjeta-card");
      if (!tarjeta) return;

      const gap = 20; // Debe coincidir con el gap CSS
      const width = tarjeta.offsetWidth + gap;

      if (direction === "left") {
        tarjetasRef.current.scrollLeft -= width;
      } else {
        tarjetasRef.current.scrollLeft += width;
      }
    }
  };

  return (
    <div className="metodo-pago">
      <section className="sidebar">
        <PerfilSidebar />
      </section>

      <div className="metodo-pago-layout">
        {!showForm ? (
          <div className="agregar-tarjeta-container">
            <h1 className="titulo-pago">{t("metodospago")}</h1>
            <hr className="metodo-separador" />
            {error && (
              <div className="error-message">
                {error}
                <button onClick={() => setError("")} className="cerrar-error">
                  X
                </button>
              </div>
            )}
            <div className="contenedor-tarjeta">
              {cargando ? (
                <p>Cargando métodos de pago...</p>
              ) : metodosPago.length > 0 ? (
                <div className="scroll-wrapper">
                  <button
                    className="arrow-button"
                    onClick={() => scroll("left", tarjetasRef, 100)}
                  >
                    <img src={arrowL} alt="left" className="arrow-icon" />
                  </button>
                  <div className="tarjetas-lista" ref={tarjetasRef}>
                    {metodosPago.map((metodo) => (
                      <div key={metodo.id_metodo_pago} className="tarjeta-card">
                        <div className="tarjeta-header">
                          <img
                            src={chip}
                            className="icono-tarjeta"
                            alt="chip"
                          />
                        </div>
                        <div className="tarjeta-info">
                          <div className="numero-tarjeta">
                            **** **** **** {metodo.tarjeta_ultimo}
                          </div>
                          <div className="nombre-tarjeta">
                            {metodo.nombre_en_tarjeta}
                          </div>
                        </div>
                        <div className="tarjeta-acciones">
                          {metodo.metodo_predeterminado ? (
                            <span className="predeterminada-badge">
                              {t("predeterminada")}
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                handleSetDefault(metodo.id_metodo_pago)
                              }
                              className="btn-hacer-predeterminada"
                            >
                              {t("hacerPredeterminada")}
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleEliminar(metodo.id_metodo_pago)
                            }
                            className="btn-eliminar-tarjeta"
                          >
                            {t("Delete")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    className="arrow-button"
                    onClick={() => scroll("right", tarjetasRef, 320)}
                  >
                    <img src={arrowR} alt="right" className="arrow-icon" />
                  </button>
                </div>
              ) : (
                <p className="texto-info">{t("noSavedCards")}</p>
              )}
              <button onClick={() => setShowForm(true)} className="btn-anadir">
                + {t("newCard")}
              </button>
            </div>
          </div>
        ) : (
          <div className="contenedor-formulario">
            <form className="form-tarjeta" onSubmit={handleSubmit}>
              <div className="campo">
                <label>{t("numeroTarjeta")}</label>
                <input
                  type="text"
                  name="numero_tarjeta"
                  value={formData.numero_tarjeta}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 16) {
                      handleInputChange({
                        target: { name: e.target.name, value },
                      });
                    }
                  }}
                  placeholder="0000 0000 0000 0000"
                  required
                />
              </div>

              <div className="fila">
                <div className="campo">
                  <label>{t("perfil.field.nombre")}</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej: Diego"
                    required
                  />
                </div>
                <div className="campo">
                  <label>{t("apellido")}</label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    placeholder="Ej: Matute Lora"
                    required
                  />
                </div>
              </div>

              <div className="fila">
                <div className="campo">
                  <label>{t("vencimiento")}</label>
                  <div className="vencimiento-input">
                    <input
                      type="text"
                      name="vencimiento_mes"
                      value={formData.vencimiento_mes}
                      onChange={handleInputChange}
                      placeholder="MM"
                      maxLength="2"
                      required
                    />
                    <span></span>
                    <input
                      type="text"
                      name="vencimiento_ano"
                      value={formData.vencimiento_ano}
                      onChange={handleInputChange}
                      placeholder="AA"
                      maxLength="4"
                      required
                    />
                  </div>
                </div>
                <div className="campo">
                  <label>CVV</label>
                  <input
                    type="text"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    placeholder="000"
                    maxLength="3"
                    required
                  />
                </div>
              </div>

              <div className="botones">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() => setShowForm(false)}
                >
                  {t("perfil.cancel")}
                </button>
                <button type="submit" className="btn-guardar-tarjeta">
                  {t("perfil.save")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Info de seguridad solo cuando NO estamos agregando tarjeta */}
        {!showForm && (
          <div className="info-seguridad">
            <p>
              <b>Easy Way</b> {t("offers secure payment processing")}
            </p>
            <ul>
              <li>✔ {t("m1")}</li>
              <li>✔ {t("m2")}</li>
              <li>✔ {t("m3")}</li>
              <li>✔ {t("m4")}</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
