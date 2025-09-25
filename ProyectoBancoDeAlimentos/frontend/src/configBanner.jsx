import React, { useState, useEffect } from "react";
import { getPromocionesOrden, actualizarPromocion } from "./api/PromocionesApi";
import axiosInstance from "./api/axiosInstance";
import { toast } from "react-toastify";
import "./toast.css";

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

const backendImageUrl = (fileName) =>
  fileName
    ? `${BACKEND_ORIGIN}/api/images/productos/${encodeURIComponent(fileName)}`
    : "";

const toPublicFotoSrc = (nameOrPath, defaultDir = "productos") => {
  if (!nameOrPath) return "";
  const s = String(nameOrPath).trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/api/images/")) return `${BACKEND_ORIGIN}${encodeURI(s)}`;
  if (s.startsWith("/images/")) return `${BACKEND_ORIGIN}/api${encodeURI(s)}`;
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

  // Reemplazar la función fetchBanners actual con esta versión corregida:

  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getPromocionesOrden();
      console.log("Respuesta completa de la API:", res);

      const mappedBanners = res.data.map((item) => ({
        id_promocion: item.id_promocion,
        orden: item.orden || 0,
        name: item.nombre_promocion || "",
        description: item.descripción || item.descripcion || "",
        backgroundImage: item.banner_url || "",
        status:
          item.activa === true || item.activa === 1 || item.activa === "true",
      }));

      setBanners(mappedBanners);

      // Ajustar índice si es necesario
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
    if (banners.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }
  };

  const prevBanner = () => {
    if (banners.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    }
  };

  // Función para obtener banners activos ordenados
  const getActiveBanners = () => {
    return banners
      .filter((banner) => banner.status && banner.orden > 0)
      .sort((a, b) => a.orden - b.orden);
  };

  // Función para obtener el siguiente orden disponible
  const getNextAvailableOrder = () => {
    const activeBanners = getActiveBanners();
    return activeBanners.length + 1;
  };

  const openEditModal = () => {
    if (!banners[currentIndex]) return;

    const current = banners[currentIndex];
    setEditForm({
      orden:
        current.status && current.orden > 0 ? current.orden.toString() : "",
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

      // Lógica para el orden cuando cambia el estado
      if (field === "status") {
        if (value) {
          // Se activa: asignar el siguiente orden disponible
          const nextOrder = getNextAvailableOrder();
          newForm.orden = nextOrder.toString();
        } else {
          // Se desactiva: limpiar orden
          newForm.orden = "";
        }
      }

      return newForm;
    });
  };

  // Función para validar el formulario
  const validateForm = () => {
    if (!editForm.name.trim()) {
      toast.info("El nombre del banner es obligatorio", { className: "toast-info" });
      return false;
    }

    if (!editForm.description.trim()) {
      toast.info("La descripción del banner es obligatoria", { className: "toast-info" });
      return false;
    }

    if (editForm.status) {
      const orderNum = parseInt(editForm.orden);
      if (isNaN(orderNum) || orderNum < 1) {
        toast.warn("El orden debe ser un número mayor a 0", { className: "toast-warn" });
        return false;
      }

      const activeBanners = getActiveBanners();
      const currentBanner = banners[currentIndex];

      // Filtrar el banner actual si ya está activo
      const otherActiveBanners = activeBanners.filter(
        (banner) => banner.id_promocion !== currentBanner.id_promocion
      );

      const maxAllowedOrder = otherActiveBanners.length + 1;

      if (orderNum > maxAllowedOrder) {
        toast.info(`El orden máximo permitido es ${maxAllowedOrder}`, { className: "toast-info" });
        return false;
      }
    }

    return true;
  };

  // Función para reorganizar todos los banners activos manteniendo secuencia 1,2,3...
  const reorganizeAllBanners = async (newOrder, currentBanner) => {
    const orderNum = parseInt(newOrder);
    const activeBanners = getActiveBanners();

    if (!editForm.status) {
      // Si se está desactivando, no hay reorganización aquí
      return true;
    }

    // Obtener todos los banners activos excluyendo el actual
    let otherActiveBanners = activeBanners.filter(
      (banner) => banner.id_promocion !== currentBanner.id_promocion
    );

    // Crear la nueva secuencia insertando el banner actual en la posición deseada
    const finalSequence = [...otherActiveBanners];
    finalSequence.splice(orderNum - 1, 0, {
      ...currentBanner,
      orden: orderNum,
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      status: editForm.status,
    });

    // Calcular qué banners necesitan moverse
    const changes = [];
    const bannersToUpdate = [];

    finalSequence.forEach((banner, index) => {
      const newOrderValue = index + 1;

      if (banner.id_promocion === currentBanner.id_promocion) {
        // Este es el banner que estamos editando
        const oldOrder = currentBanner.status ? currentBanner.orden : 0;
        if (oldOrder !== newOrderValue) {
          changes.push(
            `• "${banner.name}" (${
              oldOrder > 0 ? oldOrder : "Inactivo"
            } → ${newOrderValue})`
          );
        }
      } else {
        // Otros banners que pueden necesitar moverse
        const currentOrderInDB =
          activeBanners.find((b) => b.id_promocion === banner.id_promocion)
            ?.orden || 0;
        if (currentOrderInDB !== newOrderValue) {
          changes.push(
            `• "${banner.name}" (${currentOrderInDB} → ${newOrderValue})`
          );
          bannersToUpdate.push({
            ...banner,
            newOrder: newOrderValue,
            oldOrder: currentOrderInDB,
          });
        }
      }
    });

    // Mostrar confirmación si hay otros banners que se van a mover
    const otherChanges = changes.filter(
      (change) => !change.includes(currentBanner.name)
    );
    if (otherChanges.length > 0) {
      const confirmMessage = `Para mantener el orden secuencial, se reorganizarán los siguientes banners:

${otherChanges.join("\n")}

¿Deseas continuar?`;

      if (!window.confirm(confirmMessage)) {
        return false;
      }
    }

    // Actualizar todos los banners que necesitan cambio (excepto el actual)
    for (const bannerToUpdate of bannersToUpdate) {
      try {
        await actualizarPromocion(bannerToUpdate.id_promocion, {
          orden: bannerToUpdate.newOrder,
          nombre_promocion: bannerToUpdate.name,
          descripción: bannerToUpdate.description,
          banner_url: bannerToUpdate.backgroundImage,
          activa: bannerToUpdate.status,
        });
        console.log(
          `Banner "${bannerToUpdate.name}" movido de posición ${bannerToUpdate.oldOrder} a ${bannerToUpdate.newOrder}`
        );
      } catch (error) {
        console.error(
          `Error reorganizando banner ${bannerToUpdate.name}:`,
          error
        );
        throw error;
      }
    }

    return true;
  };

  // Reemplaza la función saveChanges actual con esta versión mejorada:

  const saveChanges = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      const currentBanner = banners[currentIndex];
      const newOrder = editForm.status ? parseInt(editForm.orden) : 0;

      // Caso 1: Se está desactivando un banner que estaba activo
      if (!editForm.status && currentBanner.status && currentBanner.orden > 0) {
        // Primero desactivar el banner actual
        const updateData = {
          orden: 0,
          nombre_promocion: editForm.name.trim(),
          descripción: editForm.description.trim(),
          banner_url: currentBanner.backgroundImage,
          activa: false,
        };

        await actualizarPromocion(currentBanner.id_promocion, updateData);

        // Reorganizar banners que estaban después del banner desactivado
        const activeBanners = getActiveBanners();
        const bannersToMove = activeBanners.filter(
          (banner) =>
            banner.id_promocion !== currentBanner.id_promocion &&
            banner.orden > currentBanner.orden
        );

        console.log(`Banners que se moverán hacia adelante:`, bannersToMove);

        // Mover cada banner una posición hacia adelante (decrementar orden en 1)
        for (const banner of bannersToMove) {
          try {
            await actualizarPromocion(banner.id_promocion, {
              orden: banner.orden - 1,
              nombre_promocion: banner.name,
              descripción: banner.description,
              banner_url: banner.backgroundImage,
              activa: banner.status,
            });
            console.log(
              `Banner "${banner.name}" movido de posición ${banner.orden} a ${
                banner.orden - 1
              }`
            );
          } catch (error) {
            console.error(`Error reorganizando banner ${banner.name}:`, error);
            throw error;
          }
        }

        toast.success("Banner desactivado exitosamente.", { className: "toast-success" });
      }
      // Caso 2: Se está activando o cambiando orden de un banner activo
      else if (
        editForm.status &&
        (newOrder !== currentBanner.orden || !currentBanner.status)
      ) {
        const reorganizeResult = await reorganizeAllBanners(
          newOrder,
          currentBanner
        );
        if (!reorganizeResult) {
          setSaving(false);
          return;
        }

        // Actualizar el banner actual
        const updateData = {
          orden: newOrder,
          nombre_promocion: editForm.name.trim(),
          descripción: editForm.description.trim(),
          banner_url: currentBanner.backgroundImage,
          activa: editForm.status,
        };

        await actualizarPromocion(currentBanner.id_promocion, updateData);
        toast.success("Banner actualizado exitosamente", { className: "toast-success" });
      }
      // Caso 3: Solo se están editando nombre/descripción sin cambios de estado u orden
      else {
        const updateData = {
          orden: newOrder,
          nombre_promocion: editForm.name.trim(),
          descripción: editForm.description.trim(),
          banner_url: currentBanner.backgroundImage,
          activa: editForm.status,
        };

        await actualizarPromocion(currentBanner.id_promocion, updateData);
        toast.success("Banner actualizado exitosamente", { className: "toast-success" });
      }

      closeEditModal();
      await fetchBanners();
    } catch (err) {
      console.error("Error completo al guardar:", err);

      let errorMessage = "Error desconocido";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error("Error al guardar cambios" , { className: "toast-error" });
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    fetchBanners();
  };

  // Estados de carga y error
  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 40 }}>
        Cargando banners...
      </div>
    );
  }

  if (error) {
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
  }

  if (banners.length === 0) {
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
  }

  const currentBanner = banners[currentIndex];
  const activeBannersCount = getActiveBanners().length;
  const maxOrder = editForm.status
    ? activeBannersCount + 1
    : activeBannersCount;

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
              disabled={banners.length <= 1}
              onMouseOver={(e) => {
                if (banners.length > 1) {
                  e.target.style.background =
                    styles.navigationArrowHover.background;
                  e.target.style.color = styles.navigationArrowHover.color;
                }
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
                  alt={currentBanner.name || "Banner"}
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
                  {currentBanner.status && currentBanner.orden > 0
                    ? currentBanner.orden
                    : "Inactivo (0)"}
                </div>
                <div style={styles.bannerName}>
                  {currentBanner.name || "Sin nombre"}
                </div>
                <div style={styles.bannerDescription}>
                  {currentBanner.description || "Sin descripción"}
                </div>
                <div style={styles.bannerStatus}>
                  Estado: {currentBanner.status ? "Activa" : "Inactiva"}
                </div>
              </div>
            </div>

            <button
              onClick={nextBanner}
              style={{ ...styles.navigationArrow, ...styles.navRight }}
              disabled={banners.length <= 1}
              onMouseOver={(e) => {
                if (banners.length > 1) {
                  e.target.style.background =
                    styles.navigationArrowHover.background;
                  e.target.style.color = styles.navigationArrowHover.color;
                }
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
              Banner {currentIndex + 1} de {banners.length} | Activos:{" "}
              {activeBannersCount}
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
                        alt={editForm.name || currentBanner.name || "Banner"}
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
                        {editForm.status && editForm.orden
                          ? editForm.orden
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

                {/* Formulario */}
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
                  <label style={styles.label}>Orden del Banner</label>
                  <input
                    type="number"
                    value={editForm.orden}
                    onChange={(e) => handleInputChange("orden", e.target.value)}
                    style={{
                      ...styles.input,
                      backgroundColor: !editForm.status ? "#f3f4f6" : "white",
                      color: !editForm.status ? "#9ca3af" : "#111827",
                    }}
                    placeholder={
                      editForm.status ? `Orden del banner ` : "0 (Inactivo)"
                    }
                    min="1"
                    max={maxOrder}
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
                    placeholder="Ingresa la descripción del banner"
                    maxLength="500"
                    disabled={saving}
                  />
                </div>

                <div style={styles.modalButtons}>
                  <button
                    style={styles.cancelButton}
                    onClick={closeEditModal}
                    disabled={saving}
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
    border: "none",
    backgroundColor: "transparent",
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
    maxWidth: "600px",
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
    height: "200px",
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
