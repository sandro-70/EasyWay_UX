import React, { useState } from "react";
import { Upload, ChevronDown, Calendar } from "lucide-react";

const CampanaPromocional = () => {
  const [moveButton, setMoveButton] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showCondicion, setShowCondicion] = useState(false); // 👈 estado para  condBox

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    tipo: "",
    validoDesde: "",
    hasta: "",
  });

  const handleClick = () => {
    setMoveButton(!moveButton);
    setShowSidebar(!showSidebar);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.headerWrapper}>
          <h1 style={styles.header}>Crear Campaña Promocional</h1>
          <div style={styles.headerLineWrapper}>
            <div style={styles.headerLine}></div>
          </div>
        </div>

        {/* Formulario */}
        <div>
          {/* Fila de inputs */}
          <div style={styles.formRow}>
            <div>
              <label style={styles.label}>Nombre de Campaña</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Descripción</label>
              <input
                type="text"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Tipo de Campaña</label>
              <div style={styles.selectContainer}>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  style={styles.select}
                >
                  <option value="">Seleccionar</option>
                </select>
                <ChevronDown size={16} style={styles.icon} />
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div style={styles.dateRow}>
            <div>
              <label style={styles.label}>Válido desde</label>
              <div style={styles.selectContainer}>
                <input
                  type="date"
                  name="validoDesde"
                  value={formData.validoDesde}
                  onChange={handleInputChange}
                  style={styles.input}
                />
                <Calendar size={16} style={styles.icon} />
              </div>
            </div>

            <div>
              <label style={styles.label}>Hasta</label>
              <div style={styles.selectContainer}>
                <input
                  type="date"
                  name="hasta"
                  value={formData.hasta}
                  onChange={handleInputChange}
                  style={styles.input}
                />
                <Calendar size={16} style={styles.icon} />
              </div>
            </div>
          </div>

          {/* Banner */}
          <div style={styles.bannerSection}>
            <h3 style={styles.bannerTitle}>Añadir Banner</h3>
            <div style={styles.uploadArea}>
              <button
                style={styles.uploadContent}
                //agregar locgica de subir imagen
              >
                <Upload
                  size={48}
                  color="#9ca3af"
                  style={{ marginBottom: "16px" }}
                />
                <p style={styles.uploadText}>Arrastra y suelta</p>
                <p style={styles.uploadText}>el banner aquí</p>
                <p style={styles.recommendation}>
                  El banner recomendado es de 1222 px
                </p>
              </button>
            </div>
          </div>

          {/* Botones */}
          <div style={styles.buttonRow}>
            <button
              style={styles.addButton}
              onClick={() => setShowCondicion(true)}
            >
              Agregar Condición
            </button>
            <button style={styles.saveButton}>Guardar Campaña</button>
          </div>
        </div>
      </div>

      {/*  condBox */}
      {showCondicion && (
        <div style={styles.condBoxOverlay}>
          <div style={styles.condBox}>
            <div style={styles.condBoxHeader}>Condiciones</div>

            <div style={styles.condBoxBody}>
              <label style={styles.label}>Mínimo De Compra</label>
              <input type="text" placeholder="Lps" style={styles.input} />

              <label style={styles.label}>Subcategoría</label>
              <select style={styles.select}>
                <option>seleccione</option>
              </select>

              <label style={styles.label}>Producto</label>
              <input type="text" style={styles.input} />

              <div style={styles.formRow}>
                <div>
                  <label style={styles.label}>Valor Fijo</label>
                  <input type="text" placeholder="Lps" style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>Valor Porcentual</label>
                  <input type="text" placeholder="%" style={styles.input} />
                </div>
              </div>
            </div>

            <div style={styles.condBoxFooter}>
              <button
                style={styles.cancelButton}
                onClick={() => setShowCondicion(false)}
              >
                Cancelar
              </button>
              <button
                style={styles.addButton}
                onClick={() => setShowCondicion(false)}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
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
  container: {
    margin: "0 180px",
    padding: "24px",
  },
  headerWrapper: {
    marginBottom: "20px",
  },
  header: {
    fontSize: "24px",
    fontWeight: "600",
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
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "16px",
    marginBottom: "24px",
    width: "800px",
  },
  dateRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    maxWidth: "384px",
    marginBottom: "24px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    color: "#374151",
    marginBottom: "8px",
    textAlign: "left",
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none",
  },
  selectContainer: {
    position: "relative",
  },
  select: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    appearance: "none",
    backgroundColor: "white",
    paddingRight: "32px",
    textAlign: "left",
  },
  icon: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    color: "#9ca3af",
  },
  bannerSection: {
    marginBottom: "24px",
    textAlign: "left",
    width: "300px",
  },
  bannerTitle: {
    fontSize: "18px",
    fontWeight: "500",
    color: "#1f2937",
    marginBottom: "16px",
  },
  uploadArea: {
    border: "2px dashed #d1d5db",
    borderRadius: "8px",
    padding: "32px",
    textAlign: "center",
    backgroundColor: "#f9fafb",
  },
  uploadContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  uploadText: {
    color: "#6b7280",
    marginBottom: "8px",
  },
  recommendation: {
    fontSize: "12px",
    color: "#9ca3af",
  },
  buttonRow: {
    display: "flex",
    justifyContent: "space-between",
    paddingTop: "16px",
  },
  addButton: {
    padding: "8px 24px",
    backgroundColor: "#1976d2",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  saveButton: {
    padding: "8px 32px",
    backgroundColor: "#f97316",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },

  condBoxOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  condBox: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    width: "560px",
    maxWidth: "95%",
    boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column",
  },
  condBoxHeader: {
    backgroundColor: "#1976d2",
    color: "#fff",
    padding: "12px",
    fontSize: "18px",
    fontWeight: "600",
    borderTopLeftRadius: "8px",
    borderTopRightRadius: "8px",
  },
  condBoxBody: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  condBoxFooter: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 16px",
  },
  cancelButton: {
    backgroundColor: "#f97316",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "8px 16px",
    cursor: "pointer",
  },
};

export default CampanaPromocional;
