import React from "react";
import "./misDirecciones.css";

export default function EditarDireccionModal({
  show,
  onClose,
  form,
  handleChange,
  handleSave,
}) {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Encabezado */}
        <div className="modal-header">
          <h2>Editar Dirección</h2>
          <button className="modal-close" onClick={onClose}>
            ✖
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSave}>
          <div className="fila">
            <div className="campo">
              <input
                type="text"
                name="codigoPostal"
                placeholder="Código postal*"
                value={form.codigoPostal}
                onChange={handleChange}
              />
            </div>
            <div className="campo">
              <select
                name="departamento"
                value={form.departamento}
                onChange={handleChange}
              >
                <option value="">Departamento</option>
                <option>Cortés</option>
                <option>Atlántida</option>
                <option>Yoro</option>
              </select>
            </div>
          </div>

          <div className="fila">
            <div className="campo">
              <input
                type="text"
                name="ciudad"
                placeholder="Ciudad*"
                value={form.ciudad}
                onChange={handleChange}
              />
            </div>
            <div className="campo">
              <input
                type="text"
                name="calle"
                placeholder="Calle, casa/apartamento*"
                value={form.calle}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="check">
            <input
              type="checkbox"
              id="predeterminado-edit"
              name="predeterminada"
              checked={form.predeterminada}
              onChange={handleChange}
            />
            <label htmlFor="predeterminado-edit">
              Establecer como dirección de envío predeterminada
            </label>
          </div>

          <button type="submit" className="btn-guardar">
            Guardar
          </button>
        </form>
      </div>
    </div>
  );
}
