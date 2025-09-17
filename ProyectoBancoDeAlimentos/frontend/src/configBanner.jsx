import React, { useState, useEffect } from "react";
import { getPromocionesOrden, actualizarPromocion } from "./api/PromocionesApi";
import axiosInstance from "./api/axiosInstance";

const BACKEND_ORIGIN = (() => {
  const base = axiosInstance?.defaults?.baseURL;
  try {
    const u = base
      ? base.startsWith("http")
        ? new URL(base)
        : new URL(base, window.location.origin)
      : new URL(window.location.origin);
    return `${u.protocol}//${u.host}`;
  } catch {
    return window.location.origin;
  }
})();

// para nombres de archivo tipo "foto.jpg"
const backendImageUrl = (fileName) =>
  fileName
    ? `${BACKEND_ORIGIN}/api/images/productos/${encodeURIComponent(fileName)}`
    : "";

// adapta la ruta que venga en DB a una URL válida del backend
const toPublicFotoSrc = (nameOrPath, defaultDir = "productos") => {
  if (!nameOrPath) return "";
  const s = String(nameOrPath).trim();
  if (/^https?:\/\//i.test(s)) return s; // ya es absoluta
  if (s.startsWith("/api/images/")) return `${BACKEND_ORIGIN}${encodeURI(s)}`;
  if (s.startsWith("/images/")) return `${BACKEND_ORIGIN}/api${encodeURI(s)}`;
  // nombre suelto => /api/images/<defaultDir>/<archivo>
  return `${BACKEND_ORIGIN}/api/images/${encodeURIComponent(
    defaultDir
  )}/${encodeURIComponent(s)}`;
};

const ConfigBanner = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    orden: "",
    name: "",
    description: "",
    status: false,
  });

  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getPromocionesOrden();
      console.log("Respuesta completa de la API:", res);

      const mappedBanners = res.data.map((item) => {
        console.log("Item individual:", item);
        return {
          id_promocion: item.id_promocion,
          orden: item.orden,
          name: item.nombre_promocion,
          description: item.descripción || item.descripcion,
          backgroundImage: item.banner_url,
          status:
            item.activa === true || item.activa === 1 || item.activa === "true",
        };
      });
      setBanners(mappedBanners);

      if (mappedBanners.length === 0) {
        setCurrentIndex(0);
      } else if (currentIndex >= mappedBanners.length) {
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error("Error al cargar promociones:", err);
      setError(
        "Error al cargar promociones: " + (err.message || "Error desconocido")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const nextBanner = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  // Función para encontrar el primer orden disponible
  const findNextAvailableOrder = () => {
    const activeOrders = banners
      .filter((banner) => banner.status && banner.orden > 0)
      .map((banner) => banner.orden)
      .sort((a, b) => a - b);

    for (let i = 1; i <= activeOrders.length + 1; i++) {
      if (!activeOrders.includes(i)) {
        return i;
      }
    }
    return activeOrders.length + 1;
  };

  const openEditModal = () => {
    const current = banners[currentIndex];
    setEditForm({
      orden: current.status ? current.orden || 1 : 0,
      name: current.name || "",
      description: current.description || "",
      status: current.status || false,
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditForm({ orden: "", name: "", description: "", status: false });
    setSaving(false);
  };

  const handleInputChange = (field, value) => {
    setEditForm((prev) => {
      const newForm = { ...prev, [field]: value };

      // Si cambia el estado, actualizar el orden automáticamente
      if (field === "status") {
        if (value) {
          // Si se activa, asignar el próximo orden disponible
          newForm.orden = findNextAvailableOrder();
        } else {
          // Si se desactiva, orden = 0
          newForm.orden = 0;
        }
      }

      return newForm;
    });
  };

  const validateOrden = (nuevoOrden) => {
    const currentBanner = banners[currentIndex];

    // Si esta descativado, 0 es siempre válido
    if (nuevoOrden === 0) {
      return true;
    }

    // Si es el mismo orden que ya tiene el banner actual
    if (nuevoOrden === currentBanner.orden) {
      return true;
    }

    // Buscar si existe otro banner activo con el mismo orden
    const bannerConMismoOrden = banners.find(
      (banner) =>
        banner.orden === nuevoOrden &&
        banner.id_promocion !== currentBanner.id_promocion &&
        banner.status
    );

    if (bannerConMismoOrden) {
      alert(
        `Error: El orden ${nuevoOrden} ya está siendo utilizado por el banner "${bannerConMismoOrden.name}". Por favor, elige un orden diferente.`
      );
      return false;
    }

    return true;
  };

  const saveChanges = async () => {
    if (!editForm.name.trim() || !editForm.description.trim()) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    // Validar orden solo si está activo
    if (editForm.status && editForm.orden < 1) {
      alert("El orden debe ser un número mayor a 0 para banners activos");
      return;
    }

    // Validar que el orden no esté duplicado
    if (editForm.status && !validateOrden(editForm.orden)) {
      return;
    }

    try {
      setSaving(true);
      const currentBanner = banners[currentIndex];

      const updateData = {
        orden: parseInt(editForm.orden),
        nombre_promocion: editForm.name.trim(),
        descripción: editForm.description.trim(),
        banner_url: currentBanner.backgroundImage,
        activa: editForm.status,
      };

      console.log(
        "Actualizando promoción:",
        currentBanner.id_promocion,
        updateData
      );

      const response = await actualizarPromocion(
        currentBanner.id_promocion,
        updateData
      );
      console.log("Respuesta de actualización:", response);

      // Actualizar el banner local inmediatamente para reflejar el cambio
      setBanners((prevBanners) =>
        prevBanners.map((banner, index) =>
          index === currentIndex
            ? {
                ...banner,
                orden: parseInt(editForm.orden),
                name: editForm.name.trim(),
                description: editForm.description.trim(),
                status: editForm.status,
              }
            : banner
        )
      );

      alert("Banner actualizado exitosamente");
      closeEditModal();

      // Recargar datos
      await fetchBanners();
    } catch (err) {
      console.error("Error completo al guardar:", err);
      console.error("Respuesta del servidor:", err.response);

      let errorMessage = "Error desconocido";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      alert("Error al guardar cambios: " + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    fetchBanners();
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: 40 }}>
        Cargando banners...
      </div>
    );
  if (error)
    return (
      <div style={{ textAlign: "center", marginTop: 40, color: "#dc2626" }}>
        <div>{error}</div>
        <button
          onClick={handleRefresh}
          style={{
            marginTop: 12,
            padding: "8px 16px",
            backgroundColor: "#d8572f",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
      </div>
    );
  if (banners.length === 0)
    return (
      <div style={{ textAlign: "center", marginTop: 40 }}>
        <div>No hay banners disponibles</div>
        <button
          onClick={handleRefresh}
          style={{
            marginTop: 12,
            padding: "8px 16px",
            backgroundColor: "#d8572f",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Recargar
        </button>
      </div>
    );

  const currentBanner = banners[currentIndex];

  return (
    <div style={styles.pageWrapper}>
      {/* Header */}
      <div style={styles.headerWrapper}>
        <h1 style={styles.header}>Configuracion Banner</h1>
        <div style={styles.headerLineWrapper}>
          <div style={styles.headerLine}></div>
        </div>
      </div>

      <div style={styles.wrapper}>
        <div style={styles.container}>
          {/* Banner Section */}
          <div style={styles.bannerSection}>
            <button
              onClick={prevBanner}
              style={{ ...styles.navigationArrow, ...styles.navLeft }}
              onMouseOver={(e) => {
                e.target.style.background =
                  styles.navigationArrowHover.background;
                e.target.style.color = styles.navigationArrowHover.color;
              }}
              onMouseOut={(e) => {
                e.target.style.background = styles.navigationArrow.background;
                e.target.style.color = styles.navigationArrow.color;
              }}
            >
              ‹
            </button>

            <div style={styles.bannerCard} onClick={openEditModal}>
              <div style={styles.imageContainer}>
                <img
                  src={toPublicFotoSrc(
                    currentBanner.backgroundImage,
                    "fotoDePerfil"
                  )}
                  alt={currentBanner.name}
                  style={styles.bannerImage}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/PlaceHolder.png";
                  }}
                />
                <div style={styles.imageOverlay}></div>
              </div>
              <div style={styles.bannerContent}>
                <div style={styles.bannerId}>
                  Orden:{" "}
                  {currentBanner.status ? currentBanner.orden : "Inactivo (0)"}
                </div>
                <div style={styles.bannerName}>{currentBanner.name}</div>
                <div style={styles.bannerDescription}>
                  {currentBanner.description}
                </div>
                <div style={styles.bannerStatus}>
                  Estado: {currentBanner.status ? "Activa" : "Inactiva"}
                </div>
              </div>
            </div>

            <button
              onClick={nextBanner}
              style={{ ...styles.navigationArrow, ...styles.navRight }}
              onMouseOver={(e) => {
                e.target.style.background =
                  styles.navigationArrowHover.background;
                e.target.style.color = styles.navigationArrowHover.color;
              }}
              onMouseOut={(e) => {
                e.target.style.background = styles.navigationArrow.background;
                e.target.style.color = styles.navigationArrow.color;
              }}
            >
              ›
            </button>
          </div>

          {/* Info Section */}
          <div style={styles.infoSection}>
            <div style={styles.infoTitle}>
              <span style={styles.infoBrand}>
                Haz clic en el banner para editarlo
              </span>
            </div>
            <div style={styles.bannerCounter}>
              Banner {currentIndex + 1} de {banners.length}
            </div>
          </div>

          {/* Edit Modal */}
          {isEditModalOpen && (
            <div style={styles.modalOverlay} onClick={closeEditModal}>
              <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>Editar Banner</h3>
                  <button
                    style={styles.closeButton}
                    onClick={closeEditModal}
                    disabled={saving}
                    onMouseOver={(e) => {
                      if (!saving) {
                        e.target.style.backgroundColor = "#f3f4f6";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!saving) {
                        e.target.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    ×
                  </button>
                </div>

                <div style={styles.formGroup}>
                  <div style={styles.statusRow}>
                    <label style={styles.label}>Estado de la Promoción:</label>
                    <label style={styles.toggleWrapper}>
                      <input
                        type="checkbox"
                        checked={editForm.status}
                        onChange={(e) =>
                          handleInputChange("status", e.target.checked)
                        }
                        style={styles.hiddenCheckbox}
                        disabled={saving}
                      />

                      <div
                        style={{
                          ...styles.toggleSlider,
                          backgroundColor: editForm.status
                            ? "#d8572f"
                            : "#e5e7eb",
                        }}
                      >
                        <span>{editForm.status ? "Activa" : "Inactiva"}</span>

                        <div
                          style={{
                            ...styles.toggleButton,
                            transform: editForm.status
                              ? "translateX(53px)"
                              : "translateX(2px)",
                          }}
                        ></div>
                      </div>
                    </label>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Orden del Banner </label>
                  <input
                    type="number"
                    value={editForm.orden}
                    onChange={(e) =>
                      handleInputChange("orden", parseInt(e.target.value) || 0)
                    }
                    style={{
                      ...styles.input,
                      backgroundColor: !editForm.status ? "#f3f4f6" : "white",
                      color: !editForm.status ? "#9ca3af" : "#111827",
                    }}
                    onFocus={(e) => {
                      if (editForm.status) {
                        e.target.style.borderColor =
                          styles.inputFocus.borderColor;
                        e.target.style.boxShadow = styles.inputFocus.boxShadow;
                      }
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d1d5db";
                      e.target.style.boxShadow = "none";
                      if (e.target.value && editForm.status) {
                        const ordenIngresado = parseInt(e.target.value);
                        if (!validateOrden(ordenIngresado)) {
                          setEditForm((prev) => ({
                            ...prev,
                            orden: findNextAvailableOrder(),
                          }));
                        }
                      }
                    }}
                    placeholder={
                      editForm.status ? "Orden del banner" : "0 (Inactivo)"
                    }
                    min="0"
                    disabled={saving || !editForm.status}
                    readOnly={!editForm.status}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Nombre del Banner</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    style={styles.input}
                    onFocus={(e) => {
                      e.target.style.borderColor =
                        styles.inputFocus.borderColor;
                      e.target.style.boxShadow = styles.inputFocus.boxShadow;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d1d5db";
                      e.target.style.boxShadow = "none";
                    }}
                    placeholder="Ingresa el nombre del banner"
                    maxLength="100"
                    disabled={saving}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Descripción del Banner</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    style={{ ...styles.input, ...styles.textarea }}
                    onFocus={(e) => {
                      e.target.style.borderColor =
                        styles.inputFocus.borderColor;
                      e.target.style.boxShadow = styles.inputFocus.boxShadow;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d1d5db";
                      e.target.style.boxShadow = "none";
                    }}
                    maxLength="500"
                    disabled={saving}
                  />
                </div>

                <div style={styles.modalButtons}>
                  <button
                    style={styles.cancelButton}
                    onClick={closeEditModal}
                    disabled={saving}
                    onMouseOver={(e) => {
                      if (!saving) {
                        e.target.style.backgroundColor = "#f9fafb";
                        e.target.style.borderColor = "#9ca3af";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!saving) {
                        e.target.style.backgroundColor = "white";
                        e.target.style.borderColor = "#d1d5db";
                      }
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    style={{
                      ...styles.saveButton,
                      opacity: saving ? 0.6 : 1,
                      cursor: saving ? "not-allowed" : "pointer",
                    }}
                    onClick={saveChanges}
                    disabled={saving}
                    onMouseOver={(e) => {
                      if (!saving) {
                        e.target.style.backgroundColor = "#c44d26";
                        e.target.style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!saving) {
                        e.target.style.backgroundColor = "#d8572f";
                        e.target.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageWrapper: {
    position: "absolute",
    top: "145px",
    left: 0,
    right: 0,
    width: "100%",
    height: "calc(100% - 145px)",
    display: "flex",
    flexDirection: "column",
  },
  headerWrapper: {
    margin: "0 auto 20px",
    padding: "0 20px",
    width: "70%",
  },
  header: {
    fontSize: "28px",
    fontWeight: "650",
    color: "#f97316",
    textAlign: "left",
  },
  headerLineWrapper: {
    marginTop: "4px",
  },
  headerLine: {
    width: "100%",
    height: "2px",
    backgroundColor: "#f97316",
  },
  wrapper: {
    minHeight: "100vh",
    backgroundColor: "#f9fafb",
    padding: "40px 20px",
  },
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
  },
  bannerSection: {
    padding: "40px 40px 20px",
    position: "relative",
    width: "1000px",
  },
  navigationArrow: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(0,0,0,0.05)",
    border: "none",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    color: "#6b7280",
    transition: "all 0.2s ease",
    zIndex: 10,
  },
  navigationArrowHover: {
    background: "rgba(0,0,0,0.1)",
    color: "#374151",
  },
  navLeft: {
    left: "10px",
  },
  navRight: {
    right: "10px",
  },
  bannerCard: {
    borderRadius: "12px",
    width: "100%",
    maxWidth: "900px",
    height: "280px",
    position: "relative",
    margin: "0 auto",
    boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
    cursor: "pointer",
    transition: "all 0.3s ease",
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    borderRadius: "12px",
    objectFit: "cover",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6))",
    borderRadius: "12px",
  },
  bannerContent: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "white",
    zIndex: 2,
    width: "90%",
  },
  bannerId: {
    fontSize: "12px",
    fontWeight: "500",
    marginBottom: "8px",
    opacity: "0.9",
    textShadow: "0 1px 3px rgba(0,0,0,0.5)",
    padding: "4px 8px",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: "8px",
  },
  bannerName: {
    fontSize: "18px",
    fontWeight: "700",
    marginBottom: "8px",
    lineHeight: "1.2",
    textShadow: "0 1px 3px rgba(0,0,0,0.7)",
  },
  bannerDescription: {
    fontSize: "13px",
    fontWeight: "400",
    marginBottom: "12px",
    opacity: "0.95",
    lineHeight: "1.3",
    maxWidth: "280px",
    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
  },
  bannerStatus: {
    fontSize: "12px",
    fontWeight: "600",
    padding: "6px 12px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.25)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.1)",
    textShadow: "none",
  },
  infoSection: {
    backgroundColor: "#f9fafb",
    padding: "32px 40px",
    borderTop: "1px solid #e5e7eb",
    textAlign: "center",
  },
  infoTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#111827",
    marginBottom: "8px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    justifyContent: "center",
  },
  infoBrand: {
    color: "#6b7280",
    fontWeight: "500",
  },
  bannerCounter: {
    fontSize: "14px",
    color: "#9ca3af",
    fontWeight: "500",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "0px 0px 20px 0px",
    width: "90%",
    maxWidth: "500px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    position: "relative",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2b6daf",
    padding: "10px 40px",
    borderRadius: "16px 16px 0 0",
    marginBottom: "10px",
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "white",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "24px",
    color: "white",
    cursor: "pointer",
    padding: "0",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    transition: "background-color 0.2s ease",
  },
  formGroup: {
    marginBottom: "20px",
    padding: "0 20px",
  },
  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "8px",
    textAlign: "left",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "16px",
    color: "#111827",
    backgroundColor: "white",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    boxSizing: "border-box",
  },
  textarea: {
    resize: "vertical",
    minHeight: "80px",
    fontFamily: "inherit",
  },
  inputFocus: {
    outline: "none",
    borderColor: "#d8572f",
    boxShadow: "0 0 0 3px rgba(216, 87, 47, 0.1)",
  },
  statusToggleContainer: {
    marginTop: "4px",
  },
  toggleWrapper: {
    display: "flex",
    alignItems: "right",
    cursor: "pointer",
    padding: "0",
  },
  hiddenCheckbox: {
    position: "absolute",
    opacity: 0,
    cursor: "pointer",
    height: 0,
    width: 0,
  },
  toggleSlider: {
    position: "relative",
    width: "78px",
    height: "24px",
    borderRadius: "24px",
    transition: "background-color 0.3s ease",
    cursor: "pointer",
  },
  toggleButton: {
    position: "absolute",
    top: "2px",
    left: "2px",
    width: "20px",
    height: "20px",
    backgroundColor: "white",
    borderRadius: "50%",
    transition: "transform 0.3s ease",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    padding: "2px",
  },
  modalButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "24px",
    padding: "0 30px",
  },
  cancelButton: {
    flex: 1,
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "white",
    color: "#374151",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  saveButton: {
    flex: 1,
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#d8572f",
    color: "white",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};

export default ConfigBanner;
