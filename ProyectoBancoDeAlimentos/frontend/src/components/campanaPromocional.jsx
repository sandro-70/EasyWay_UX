import React, { useEffect, useRef, useState } from "react";
import { Upload, Calendar, ChevronDown, X, Check } from "lucide-react";
import "./campanaPromocional.css";

const allProducts = [
  { id: "SKU-001", name: "Café molido premium 500g" },
  { id: "SKU-002", name: "Té verde orgánico 20 bolsitas" },
  { id: "SKU-003", name: "Chocolate amargo 70%" },
  { id: "SKU-004", name: "Leche deslactosada 1L" },
  { id: "SKU-005", name: "Galletas integrales 300g" },
  { id: "SKU-006", name: "Miel de abeja 250g" },
  { id: "SKU-007", name: "Cereal multigrano 400g" },
];

const initialForm = {
  nombre: "",
  descripcion: "",
  validoDesde: "",
  hasta: "",
  // Condiciones
  tipo: "", // porcentaje | fijo | envio
  valorFijo: "",
  valorPorcentual: "",
  aplicaA: "todos", // todos | lista
  productos: [], // [{id,name}]
  // Banner
  bannerFile: null,
  bannerPreview: "",
};

const CampanaPromocional = () => {
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});

  // Combo productos
  const [queryProd, setQueryProd] = useState("");
  const [openList, setOpenList] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const comboRef = useRef(null);
  const inputRef = useRef(null);

  // Banner
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined })); // limpia error del campo
  };

  // Opciones filtradas (excluye ya seleccionados)
  const filtered = allProducts
    .filter(
      (p) =>
        (p.id.toLowerCase().includes(queryProd.toLowerCase()) ||
          p.name.toLowerCase().includes(queryProd.toLowerCase())) &&
        !formData.productos.some((sp) => sp.id === p.id)
    )
    .slice(0, 8);

  const addProducto = (prod) => {
    if (!prod) return;
    if (formData.productos.some((p) => p.id === prod.id)) return;
    setFormData((s) => ({ ...s, productos: [...s.productos, prod] }));
    setQueryProd("");
    setOpenList(false);
    setActiveIndex(0);
    setErrors((prev) => ({ ...prev, productos: undefined }));
    inputRef.current?.focus();
  };

  const removeProducto = (id) => {
    setFormData((s) => ({
      ...s,
      productos: s.productos.filter((p) => p.id !== id),
    }));
  };

  const handleComboKeyDown = (e) => {
    if (!openList && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpenList(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      addProducto(filtered[activeIndex]);
    } else if (e.key === "Escape") {
      setOpenList(false);
    }
  };

  // Cerrar lista al hacer clic fuera
  useEffect(() => {
    const onDocClick = (e) => {
      if (!comboRef.current) return;
      if (!comboRef.current.contains(e.target)) setOpenList(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Banner
  const openFileDialog = () => fileInputRef.current?.click();

  const setBannerFromFile = (file) => {
    const reader = new FileReader();
    reader.onload = () =>
      setFormData((s) => ({
        ...s,
        bannerFile: file,
        bannerPreview: reader.result,
      }));
    reader.readAsDataURL(file);
    setErrors((prev) => ({ ...prev, banner: undefined }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setBannerFromFile(file);
  };

  const onDrop = (ev) => {
    ev.preventDefault();
    const file = ev.dataTransfer.files?.[0];
    if (file) setBannerFromFile(file);
  };

  // Validaciones
  const validate = () => {
    const nextErr = {};
    if (!formData.nombre.trim()) nextErr.nombre = "Ingresa el nombre.";
    if (!formData.descripcion.trim()) nextErr.descripcion = "Ingresa la descripción.";
    if (!formData.validoDesde) nextErr.validoDesde = "Selecciona la fecha de inicio.";
    if (!formData.hasta) nextErr.hasta = "Selecciona la fecha de fin.";
    if (formData.validoDesde && formData.hasta && formData.hasta < formData.validoDesde) {
      nextErr.hasta = "La fecha fin debe ser posterior a la de inicio.";
    }

    if (!formData.tipo) nextErr.tipo = "Selecciona el tipo de campaña.";
    if (formData.tipo === "porcentaje") {
      const v = Number(formData.valorPorcentual);
      if (!v || v <= 0 || v > 100) nextErr.valorPorcentual = "Ingresa un % válido (1-100).";
    }
    if (formData.tipo === "fijo") {
      const v = Number(formData.valorFijo);
      if (!v || v <= 0) nextErr.valorFijo = "Ingresa un valor fijo mayor que 0.";
    }

    if (formData.aplicaA === "lista" && formData.productos.length === 0) {
      nextErr.productos = "Agrega al menos un producto.";
    }

    // Si también quieres forzar banner obligatorio, descomenta:
    // if (!formData.bannerFile) nextErr.banner = "Sube una imagen de banner.";

    setErrors(nextErr);
    return Object.keys(nextErr).length === 0;
  };

  const limpiarFormulario = () => {
    setFormData(initialForm);
    setQueryProd("");
    setOpenList(false);
    setActiveIndex(0);
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const guardar = () => {
    if (!validate()) return;

    // Aquí armarías tu payload real
    console.log("Payload:", formData);

    alert("Campaña guardada.");
    limpiarFormulario();
  };

  return (
    <div className="pageWrapper">
      <div className="container">
        {/* Encabezado */}
        <div className="headerWrapper">
          <h1 className="header">Crear Campaña Promocional</h1>
        </div>
        <div className="headerLine" />

        {/* Datos campaña (2 columnas) */}
        <div className="formGrid2">
          <div className="ui-field">
            <label className="ui-label" htmlFor="nombre">Nombre de Campaña</label>
            <input
              id="nombre"
              name="nombre"
              className={`ui-input ${errors.nombre ? "input-error" : ""}`}
              value={formData.nombre}
              onChange={handleInputChange}
              type="text"
            />
            {errors.nombre && <p className="errorMsg">{errors.nombre}</p>}
          </div>

          <div className="ui-field">
            <label className="ui-label" htmlFor="descripcion">Descripción</label>
            <input
              id="descripcion"
              name="descripcion"
              className={`ui-input ${errors.descripcion ? "input-error" : ""}`}
              value={formData.descripcion}
              onChange={handleInputChange}
              type="text"
            />
            {errors.descripcion && <p className="errorMsg">{errors.descripcion}</p>}
          </div>

          <div className="ui-field">
            <label className="ui-label" htmlFor="validoDesde">Válido desde</label>
            <div className="selectContainer">
              <input
                id="validoDesde"
                name="validoDesde"
                className={`ui-input ${errors.validoDesde ? "input-error" : ""}`}
                value={formData.validoDesde}
                onChange={handleInputChange}
                type="date"
              />
              <Calendar size={16} className="selectIcon" />
            </div>
            {errors.validoDesde && <p className="errorMsg">{errors.validoDesde}</p>}
          </div>

          <div className="ui-field">
            <label className="ui-label" htmlFor="hasta">Hasta</label>
            <div className="selectContainer">
              <input
                id="hasta"
                name="hasta"
                className={`ui-input ${errors.hasta ? "input-error" : ""}`}
                value={formData.hasta}
                onChange={handleInputChange}
                type="date"
              />
              <Calendar size={16} className="selectIcon" />
            </div>
            {errors.hasta && <p className="errorMsg">{errors.hasta}</p>}
          </div>
        </div>

        {/* Condiciones */}
        <div className="condSection">
          <h3 className="condTitle">Condiciones</h3>

          <div className="formGrid2">
            <div className="ui-field">
              <label className="ui-label" htmlFor="tipo">Tipo de Campaña</label>
              <div className="selectContainer">
                <select
                  id="tipo"
                  name="tipo"
                  className={`ui-select ${errors.tipo ? "input-error" : ""}`}
                  value={formData.tipo}
                  onChange={handleInputChange}
                >
                  <option value="">Seleccionar</option>
                  <option value="porcentaje">Descuento porcentual</option>
                  <option value="fijo">Descuento fijo</option>
                  <option value="envio">Envío gratis</option>
                </select>
                <ChevronDown size={16} className="selectIcon" />
              </div>
              {errors.tipo && <p className="errorMsg">{errors.tipo}</p>}
            </div>

            {formData.tipo === "porcentaje" && (
              <div className="ui-field">
                <label className="ui-label" htmlFor="valorPorcentual">% Descuento</label>
                <input
                  id="valorPorcentual"
                  name="valorPorcentual"
                  className={`ui-input ${errors.valorPorcentual ? "input-error" : ""}`}
                  value={formData.valorPorcentual}
                  onChange={handleInputChange}
                  type="number"
                  min="0"
                  max="100"
                  placeholder="%"
                />
                {errors.valorPorcentual && <p className="errorMsg">{errors.valorPorcentual}</p>}
              </div>
            )}

            {formData.tipo === "fijo" && (
              <div className="ui-field">
                <label className="ui-label" htmlFor="valorFijo">Valor Fijo</label>
                <input
                  id="valorFijo"
                  name="valorFijo"
                  className={`ui-input ${errors.valorFijo ? "input-error" : ""}`}
                  value={formData.valorFijo}
                  onChange={handleInputChange}
                  type="number"
                  min="0"
                  placeholder="Lps"
                />
                {errors.valorFijo && <p className="errorMsg">{errors.valorFijo}</p>}
              </div>
            )}

            <div className="ui-field">
              <label className="ui-label" htmlFor="aplicaA">Aplica a</label>
              <div className="selectContainer">
                <select
                  id="aplicaA"
                  name="aplicaA"
                  className="ui-select"
                  value={formData.aplicaA}
                  onChange={handleInputChange}
                >
                  <option value="todos">Todos los productos</option>
                  <option value="lista">Lista de productos</option>
                </select>
                <ChevronDown size={16} className="selectIcon" />
              </div>
            </div>

            {formData.aplicaA === "lista" && (
              <div className="ui-field ui-field--full">
                <label className="ui-label" htmlFor="combo">Producto(s)</label>

                <div className={`comboRoot ${openList ? "is-open" : ""}`} ref={comboRef}>
                  <input
                    id="combo"
                    ref={inputRef}
                    className={`ui-input comboInput ${errors.productos ? "input-error" : ""}`}
                    type="text"
                    placeholder="Escribe para buscar…"
                    value={queryProd}
                    onChange={(e) => {
                      setQueryProd(e.target.value);
                      setOpenList(true);
                      setActiveIndex(0);
                    }}
                    onKeyDown={handleComboKeyDown}
                    onFocus={() => setOpenList(true)}
                    aria-autocomplete="list"
                    aria-expanded={openList}
                    aria-controls="combo-listbox"
                    role="combobox"
                  />

                  {openList && filtered.length > 0 && (
                    <ul id="combo-listbox" role="listbox" className="comboList">
                      {filtered.map((p, i) => (
                        <li
                          key={p.id}
                          role="option"
                          aria-selected={i === activeIndex}
                          className={`comboItem ${i === activeIndex ? "active" : ""}`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => addProducto(p)}
                        >
                          <span className="comboItemName">{p.name}</span>
                          <span className="comboItemId">{p.id}</span>
                          <Check className="comboCheck" size={16} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {errors.productos && <p className="errorMsg">{errors.productos}</p>}

                {formData.productos.length > 0 && (
                  <div className="chips">
                    {formData.productos.map((p) => (
                      <span key={p.id} className="chip chip--green">
                        {p.name} <em className="chip-id">({p.id})</em>
                        <button
                          type="button"
                          className="chip-x"
                          onClick={() => removeProducto(p.id)}
                          aria-label={`Quitar ${p.name}`}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Banner al final */}
        <div className="bannerFull">
          <h3 className="bannerTitle">Añadir Banner</h3>
          <div
            className={`uploadArea ${errors.banner ? "input-error" : ""}`}
            onClick={openFileDialog}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            role="button"
            tabIndex={0}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            {formData.bannerPreview ? (
              <img
                src={formData.bannerPreview}
                alt="Vista previa del banner"
                className="bannerPreview"
              />
            ) : (
              <div className="uploadContent">
                <Upload size={48} color="#9ca3af" />
                <p className="uploadText">Arrastra y suelta o haz clic</p>
                <p className="recommendation">Tamaño recomendado: 1222 px de ancho</p>
              </div>
            )}
          </div>
          {errors.banner && <p className="errorMsg">{errors.banner}</p>}
        </div>

        {/* Acción */}
        <div className="buttonRow">
          <button type="button" className="saveButton" onClick={guardar}>
            Guardar Campaña
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampanaPromocional;
