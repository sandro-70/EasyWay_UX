// campanaPromocional.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Calendar, ChevronDown, X, Check } from "lucide-react";
import "./campanaPromocional.css";

/** ==== API ==== */
import { getAllProducts, uploadProfilePhoto1 } from "../api/InventarioApi";
import { crearPromocion } from "../api/PromocionesApi";


const initialForm = {
  nombre: "",
  descripcion: "",
  validoDesde: "",
  hasta: "",
  // Tipo de campaña (agregamos compra mínima como tipo)
  tipo: "", // 'porcentaje' | 'fijo' | 'compra_min'
  // Campos asociados (solo se envía el del tipo elegido)
  valorFijo: "",
  valorPorcentual: "",
  compraMin: "",
  // Alcance
  aplicaA: "todos", // 'todos' | 'lista'
  productos: [], // [{id, name}]
  // Banner
  bannerFile: null,
  bannerPreview: "",
  orden : 0,
};

const CampanaPromocional = () => {
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loadingSave, setLoadingSave] = useState(false);

  // Catálogo productos
  const [catalogo, setCatalogo] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);

  // Combo productos
  const [queryProd, setQueryProd] = useState("");
  const [openList, setOpenList] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const comboRef = useRef(null);
  const inputRef = useRef(null);

  // Banner
  const fileInputRef = useRef(null);

  // ===== Cargar productos (id y nombre) =====
  useEffect(() => {
    (async () => {
      try {
        setCargandoProductos(true);
        const { data } = await getAllProducts();
        const mapped = Array.isArray(data)
          ? data.map((p) => ({
              id: String(p.id_producto),
              name: String(p.nombre),
            }))
          : [];
        setCatalogo(mapped);
      } catch (e) {
        console.error("Error cargando productos:", e);
      } finally {
        setCargandoProductos(false);
      }
    })();
  }, []);

  // ===== Handlers =====
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const filtered = useMemo(() => {
    const q = queryProd.toLowerCase();
    return catalogo
      .filter(
        (p) =>
          (p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)) &&
          !formData.productos.some((sp) => sp.id === p.id)
      )
      .slice(0, 8);
  }, [catalogo, queryProd, formData.productos]);

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

  useEffect(() => {
    const onDocClick = (e) => {
      if (!comboRef.current) return;
      if (!comboRef.current.contains(e.target)) setOpenList(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ===== Banner =====
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

  // ===== Validación =====
  const validate = () => {
    const nextErr = {};

    if (!formData.nombre.trim()) nextErr.nombre = "Ingresa el nombre.";
    if (!formData.descripcion.trim()) nextErr.descripcion = "Ingresa la descripción.";

    if (!formData.validoDesde) nextErr.validoDesde = "Selecciona la fecha de inicio.";
    if (!formData.hasta) nextErr.hasta = "Selecciona la fecha de fin.";
    if (formData.validoDesde && formData.hasta && formData.hasta < formData.validoDesde) {
      nextErr.hasta = "La fecha fin debe ser posterior a la de inicio.";
    }

    if (!formData.tipo) {
      nextErr.tipo = "Selecciona el tipo de campaña.";
    } else if (formData.tipo === "porcentaje") {
      const v = Number(formData.valorPorcentual);
      if (!v || v <= 0 || v > 100) nextErr.valorPorcentual = "Ingresa un % válido (1-100).";
    } else if (formData.tipo === "fijo") {
      const v = Number(formData.valorFijo);
      if (!v || v <= 0) nextErr.valorFijo = "Ingresa un valor fijo mayor que 0.";
    } else if (formData.tipo === "compra_min") {
      const v = Number(formData.compraMin);
      if (!v || v <= 0) nextErr.compraMin = "Ingresa una compra mínima mayor que 0.";
    }

    if (formData.aplicaA === "lista" && formData.productos.length === 0) {
      nextErr.productos = "Agrega al menos un producto.";
    }

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

  // ===== Guardar =====
  const guardar = async () => {
    if (!validate()) return;

    setLoadingSave(true);
    try {
      // 1) Subir banner (opcional)
      let banner_url = null;
      if (formData.bannerFile) {
        const desiredName = `B_${Date.now()}_${formData.bannerFile.name}`;
        const up = await uploadProfilePhoto1(formData.bannerFile, desiredName);
        banner_url =
          up?.data?.url ||
          up?.data?.url_foto ||
          up?.data?.filePath ||
          up?.data?.path ||
          up?.data?.filename ||
          null;
      }

    // ...dentro de guardar(), antes de armar payload
const esFijo = formData.tipo === "fijo";
const esPct = formData.tipo === "porcentaje";
const esCompraMin = formData.tipo === "compra_min";

// Mapeo local: % => 1, fijo => 2, compra mínima => 3
const id_tipo_promo =
  esPct ? 1 :
  esFijo ? 2 :
  esCompraMin ? 3 : null;

const payload = {
  nombre_promocion: String(formData.nombre).trim(),
  descripción: String(formData.descripcion).trim(),
  valor_fijo: esFijo ? Number(formData.valorFijo) : null,
  valor_porcentaje: esPct ? Number(formData.valorPorcentual) : null,
  compra_min: esCompraMin ? Number(formData.compraMin) : null,
  fecha_inicio: formData.validoDesde,
  fecha_termina: formData.hasta,
  id_tipo_promo, 
  banner_url: banner_url || null,
  orden: Number.isFinite(Number(formData.orden)) ? Number(formData.orden) : 0,

  productos: formData.aplicaA === "lista"
    ? formData.productos.map((p) => Number(p.id)).filter(Number.isInteger)
    : [],
  
};


      console.log("Payload a enviar:", payload);
      const resp = await crearPromocion(payload);
      console.log("Respuesta servidor:", resp?.data);
      alert("Campaña guardada correctamente.");
      limpiarFormulario();
    } catch (e) {
      console.error("Error guardando campaña:", e);
      console.log("Server said:", e?.response?.data);
      alert(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "No se pudo guardar la campaña."
      );
    } finally {
      setLoadingSave(false);
    }
  };

  // ===== UI =====
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
            {/* Tipo de campaña */}
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
                  <option value="compra_min">Compra mínima</option>
                </select>
                <ChevronDown size={16} className="selectIcon" />
              </div>
              {errors.tipo && <p className="errorMsg">{errors.tipo}</p>}
            </div>

            {/* Campo según tipo */}
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

            {formData.tipo === "compra_min" && (
              <div className="ui-field">
                <label className="ui-label" htmlFor="compraMin">Compra mínima</label>
                <input
                  id="compraMin"
                  name="compraMin"
                  className={`ui-input ${errors.compraMin ? "input-error" : ""}`}
                  value={formData.compraMin}
                  onChange={handleInputChange}
                  type="number"
                  min="0"
                  placeholder="Lps"
                />
                {errors.compraMin && <p className="errorMsg">{errors.compraMin}</p>}
              </div>
            )}

            {/* Aplica a */}
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
                <label className="ui-label" htmlFor="combo">
                  Producto(s) {cargandoProductos && <small>(cargando…)</small>}
                </label>

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

        {/* Banner */}
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
          <button
            type="button"
            className="saveButton"
            onClick={guardar}
            disabled={loadingSave}
          >
            {loadingSave ? "Guardando..." : "Guardar Campaña"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampanaPromocional;
