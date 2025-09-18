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

  // Función para contar banners activos
  const getActiveBannersCount = () => {
    return banners.filter((banner) => banner.status && banner.orden > 0).length;
  };

  // Función para obtener el orden máximo después del cambio
  const getMaxOrderAfterChange = (willBeActive) => {
    const currentBanner = banners[currentIndex];
    const currentlyActiveBanners = getActiveBannersCount();

    if (willBeActive && !currentBanner.status) {
      // Se está activando un banner inactivo: +1 al total
      return currentlyActiveBanners + 1;
    } else if (!willBeActive && currentBanner.status) {
      // Se está desactivando un banner activo: -1 al total
      return Math.max(0, currentlyActiveBanners - 1);
    } else {
      // No cambia el estado, el máximo es el número actual de activos
      return currentlyActiveBanners;
    }
  };

  const openEditModal = () => {
    const current = banners[currentIndex];
    setEditForm({
      orden: current.status ? current.orden || 1 : "",
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

      // Si cambia el estado a activo, asignar el siguiente orden disponible (al final)
      if (field === "status") {
        if (value) {
          // Se activa: poner al final de la secuencia
          const maxOrder = getMaxOrderAfterChange(true);
          newForm.orden = maxOrder;
        } else {
          // Se desactiva: orden = 0
          newForm.orden = "";
        }
      }

      return newForm;
    });
  };

  // Función para validar el orden ingresado
  const validateOrder = (orden, isActive) => {
    if (!isActive) {
      return { isValid: true, message: "" };
    }

    const orderNum = parseInt(orden);
    const maxOrder = getMaxOrderAfterChange(true);

    if (isNaN(orderNum)) {
      return { isValid: false, message: "El orden debe ser un número" };
    }

    if (orderNum < 1) {
      return { isValid: false, message: "El orden mínimo es 1" };
    }

    if (orderNum > maxOrder) {
      return {
        isValid: false,
        message: `El orden máximo permitido es ${maxOrder}`,
      };
    }

    return { isValid: true, message: "" };
  };

  // Función para reorganizar banners cuando se cambia el orden
  const reorganizeBanners = async (newOrder, currentBanner) => {
    const currentOrder = currentBanner.orden;

    // Si el banner está inactivo y se está activando
    if (!currentBanner.status && editForm.status) {
      // Mover todos los banners desde la posición deseada hacia adelante
      const bannersToMove = banners.filter(
        (banner) =>
          banner.id_promocion !== currentBanner.id_promocion &&
          banner.status &&
          banner.orden >= newOrder
      );

      if (bannersToMove.length > 0) {
        const confirmMessage = `Al activar "${
          currentBanner.name
        }" en la posición ${newOrder}, se moverán los siguientes banners:

${bannersToMove
  .map((b) => `"${b.name}" (${b.orden} → ${b.orden + 1})`)
  .join("\n")}

¿Deseas continuar?`;

        if (!window.confirm(confirmMessage)) {
          return false;
        }

        // Mover los banners afectados
        for (const banner of bannersToMove.sort((a, b) => b.orden - a.orden)) {
          await actualizarPromocion(banner.id_promocion, {
            orden: banner.orden + 1,
            nombre_promocion: banner.name,
            descripción: banner.description,
            banner_url: banner.backgroundImage,
            activa: banner.status,
          });
        }
      }
      return true;
    }

    // Si el banner ya está activo y cambia de posición
    if (currentBanner.status && editForm.status && newOrder !== currentOrder) {
      let bannersToMove = [];
      let message = "";

      if (newOrder > currentOrder) {
        // Moviendo hacia adelante: los banners entre current+1 y newOrder se mueven hacia atrás
        bannersToMove = banners.filter(
          (banner) =>
            banner.id_promocion !== currentBanner.id_promocion &&
            banner.status &&
            banner.orden > currentOrder &&
            banner.orden <= newOrder
        );
        message = `Al mover "${
          currentBanner.name
        }" del orden ${currentOrder} al ${newOrder}, se moverán hacia atrás:

${bannersToMove
  .map((b) => `"${b.name}" (${b.orden} → ${b.orden - 1})`)
  .join("\n")}`;
      } else {
        // Moviendo hacia atrás: los banners entre newOrder y current-1 se mueven hacia adelante
        bannersToMove = banners.filter(
          (banner) =>
            banner.id_promocion !== currentBanner.id_promocion &&
            banner.status &&
            banner.orden >= newOrder &&
            banner.orden < currentOrder
        );
        message = `Al mover "${
          currentBanner.name
        }" del orden ${currentOrder} al ${newOrder}, se moverán hacia adelante:

${bannersToMove
  .map((b) => `"${b.name}" (${b.orden} → ${b.orden + 1})`)
  .join("\n")}`;
      }

      if (bannersToMove.length > 0) {
        message += "\n\n¿Deseas continuar?";
        if (!window.confirm(message)) {
          return false;
        }

        // Reorganizar los banners afectados
        for (const banner of bannersToMove) {
          const newBannerOrder =
            newOrder > currentOrder ? banner.orden - 1 : banner.orden + 1;
          await actualizarPromocion(banner.id_promocion, {
            orden: newBannerOrder,
            nombre_promocion: banner.name,
            descripción: banner.description,
            banner_url: banner.backgroundImage,
            activa: banner.status,
          });
        }
      }
    }

    return true;
  };

  const saveChanges = async () => {
    // Validaciones básicas
    if (!editForm.name.trim() || !editForm.description.trim()) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    // Validar orden si está activo
    const orderValidation = validateOrder(editForm.orden, editForm.status);
    if (!orderValidation.isValid) {
      alert(orderValidation.message);
      return;
    }

    try {
      setSaving(true);
      const currentBanner = banners[currentIndex];
      const newOrder = editForm.status ? parseInt(editForm.orden) : 0;

      // Si hay cambio en el orden o estado, reorganizar primero
      if (
        editForm.status !== currentBanner.status ||
        (editForm.status && newOrder !== currentBanner.orden)
      ) {
        const reorganizeResult = await reorganizeBanners(
          newOrder,
          currentBanner
        );
        if (!reorganizeResult) {
          setSaving(false);
          return; // Usuario canceló
        }
      }

      // Actualizar el banner actual
      const updateData = {
        orden: newOrder,
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
      await actualizarPromocion(currentBanner.id_promocion, updateData);

      alert("Banner actualizado exitosamente");
      closeEditModal();
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

                {/* Previsualización del Banner */}
                <div style={styles.previewSection}>
                  <h4 style={styles.previewTitle}>Previsualización</h4>
                  <div style={styles.previewBannerCard}>
                    <div style={styles.previewImageContainer}>
                      <img
                        src={toPublicFotoSrc(
                          currentBanner.backgroundImage,
                          "fotoDePerfil"
                        )}
                        alt={editForm.name || currentBanner.name}
                        style={styles.previewBannerImage}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/PlaceHolder.png";
                        }}
                      />
                      <div style={styles.previewImageOverlay}></div>
                    </div>
                    <div style={styles.previewBannerContent}>
                      <div style={styles.previewBannerId}>
                        Orden:{" "}
                        {editForm.status
                          ? editForm.orden || "1"
                          : "Inactivo (0)"}
                      </div>
                      <div style={styles.previewBannerName}>
                        {editForm.name.trim() || "Nombre del banner"}
                      </div>
                      <div style={styles.previewBannerDescription}>
                        {editForm.description.trim() ||
                          "Descripción del banner"}
                      </div>
                      <div style={styles.previewBannerStatus}>
                        Estado: {editForm.status ? "Activa" : "Inactiva"}
                      </div>
                    </div>
                  </div>
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
                    onChange={(e) => handleInputChange("orden", e.target.value)}
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
                    }}
                    placeholder={
                      editForm.status
                        ? `Orden del banner (1-${getMaxOrderAfterChange(
                            editForm.status
                          )})`
                        : "0 (Inactivo)"
                    }
                    min="1"
                    max={getMaxOrderAfterChange(editForm.status)}
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
    width: "40px",
    height: "40px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "35px",
    color: "#33363dff",
    transition: "all 0.2s ease",
    zIndex: 10,
  },
  navigationArrowHover: {
    color: "#515137ff",
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
    maxWidth: "600px", // Aumentado de 500px a 600px
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    position: "relative",
    maxHeight: "95vh",
    overflowY: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2b6daf",
    padding: "15px 30px",
    borderRadius: "16px 16px 0 0",
    marginBottom: "20px",
  },
  modalTitle: {
    fontSize: "22px",
    fontWeight: "600",
    color: "white",
    margin: "0",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "28px",
    color: "white",
    cursor: "pointer",
    padding: "0",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    transition: "background-color 0.2s ease",
  },

  // Estilos mejorados para la previsualización
  previewSection: {
    padding: "0 25px 25px",
    borderBottom: "1px solid #e5e7eb",
    marginBottom: "10px",
  },
  previewTitle: {
    fontSize: "18px",
    color: "#374151",
    marginBottom: "5px",
    textAlign: "center",
  },
  previewBannerCard: {
    borderRadius: "12px",
    width: "100%",
    height: "200px", // Altura fija para mejor proporción
    position: "relative",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
    overflow: "hidden",
    border: "2px solid #e5e7eb",
  },
  previewImageContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  previewBannerImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "10px",
  },
  previewImageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6))",
    borderRadius: "10px",
  },
  previewBannerContent: {
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
    zIndex: 3,
    width: "90%",
  },
  previewBannerId: {
    fontSize: "11px",
    fontWeight: "500",
    marginBottom: "6px",
    opacity: "0.9",
    textShadow: "0 1px 3px rgba(0,0,0,0.7)",
    padding: "3px 8px",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: "6px",
    backdropFilter: "blur(5px)",
  },
  previewBannerName: {
    fontSize: "16px",
    fontWeight: "700",
    marginBottom: "6px",
    lineHeight: "1.2",
    textShadow: "0 1px 3px rgba(0,0,0,0.8)",
    maxWidth: "90%",
    wordBreak: "break-word",
  },
  previewBannerDescription: {
    fontSize: "12px",
    fontWeight: "400",
    marginBottom: "8px",
    opacity: "0.95",
    lineHeight: "1.3",
    maxWidth: "85%",
    textShadow: "0 1px 2px rgba(0,0,0,0.6)",
    display: "-webkit-box",
    WebkitLineClamp: "2",
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  previewBannerStatus: {
    fontSize: "10px",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.3)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.2)",
    textShadow: "none",
  },

  formGroup: {
    marginBottom: "20px",
    padding: "0 25px",
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
    fontWeight: "600",
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
    minHeight: "90px",
    fontFamily: "inherit",
  },
  inputFocus: {
    outline: "none",
    borderColor: "#d8572f",
    boxShadow: "0 0 0 3px rgba(216, 87, 47, 0.1)",
  },
  toggleWrapper: {
    display: "flex",
    alignItems: "center",
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
    width: "85px",
    height: "32px",
    borderRadius: "32px",
    transition: "background-color 0.3s ease",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "600",
    color: "white",
    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
  },
  toggleButton: {
    position: "absolute",
    top: "3px",
    left: "3px",
    width: "26px",
    height: "26px",
    backgroundColor: "white",
    borderRadius: "50%",
    transition: "transform 0.3s ease",
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
    border: "1px solid rgba(0,0,0,0.1)",
  },
  modalButtons: {
    display: "flex",
    gap: "15px",
    marginTop: "10px",
    padding: "0 25px",
  },
  cancelButton: {
    flex: 1,
    padding: "14px",
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
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#d8572f",
    color: "white",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};
export default ConfigBanner;
