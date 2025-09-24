// src/pages/Inventario.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import frutas from "./images/frutas_asignarDescuento.png";
import { Switch, Slider } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import { createPortal } from "react-dom";
import axiosInstance from "./api/axiosInstance";
import {
  aplicarDescuentoGeneral,
  aplicarPreciosEscalonados,
  aplicarDescuentoseleccionados,
} from "./api/PromocionesApi";
import {
  getAllProducts,
  getAllSucursales,
  abastecerPorSucursalProducto,
  getImagenesProducto,
  actualizarProducto,
  desactivarProducto,
  crearProducto,
  getProductoById,
  getMarcas,
  listarProductosporsucursal,
} from "./api/InventarioApi";
import { ListarCategoria } from "./api/CategoriaApi";
import { listarSubcategoria } from "./api/SubcategoriaApi";
import { crearPromocion } from "./api/PromocionesApi";
/**
 * Paleta:
 * #d8572f (naranja primario)
 * #f0833e (naranja claro)
 * #2ca9e3 (azul claro)
 * #2b6daf (azul header)
 * #ffac77 (acento claro)
 * #f9fafb (gris fondo)
 * #d8dadc (gris bordes)
 */
const PageSize = 5;
function emptyDraft() {
  return {
    id: "",
    producto: "",
    descripcion: "",
    marca: "",
    marcaId: "",
    categoria: "",
    categoriaId: "",
    subcategoria: "",
    subcategoriaId: "",
    stockKg: 0,
    precioBase: 0,
    precioVenta: 0,
    porcentajeGanancia: 0,
    etiquetasText: "",
    etiquetas: [],
    unidadMedida: "unidad",
    activo: true,
    imagePreviews: [],
    imageFiles: [],

    descuentoGeneral: false,
    tipoDescuento: "", // "porcentaje" | "monto"
    valorDescuento: "",
    fechaDesde: "", // "YYYY-MM-DD"
    fechaHasta: "",
    preciosEscalonados: false,
    escalones: [],
  };
}

const DISCOUNT_TYPES = [
  { id: "PORCENTAJE", label: "% Porcentaje" },
  { id: "FIJO", label: "Monto fijo" },
];

const Icon = {
  Search: (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={"w-4 h-4 " + (props.className || "")}
    >
      <path
        d="M11 19a8 8 0 1 1 5.29-14.03A8 8 0 0 1 11 19Zm10 2-5.4-5.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Sort: ({ active, dir }) => (
    <svg
      viewBox="0 0 24 24"
      className={"w-4 h-4 " + (active ? "text-white" : "text-white/70")}
    >
      <path
        d="M12 6l3 3H9l3-3z"
        fill="currentColor"
        opacity={dir === "asc" ? 1 : 0.35}
      />
      <path
        d="M12 18l-3-3h6l-3 3z"
        fill="currentColor"
        opacity={dir === "desc" ? 1 : 0.35}
      />
    </svg>
  ),
  Plus: (props) => (
    <svg viewBox="0 0 24 24" className={"w-5 h-5 " + (props.className || "")}>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  ChevronLeft: (props) => (
    <svg viewBox="0 0 24 24" className={"w-6 h-6 " + (props.className || "")}>
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  ),
  ChevronRight: (props) => (
    <svg viewBox="0 0 24 24" className={"w-6 h-6 " + (props.className || "")}>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  ),
};

/* ============== Modal (portal + bloqueo scroll body) ============== */
function Modal({ open, onClose, children, panelClassName = "" }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        className={
          "relative w-full max-w-2xl md:max-w-3xl rounded-2xl bg-white shadow-2xl border border-[#d8dadc] max-h-[90vh] overflow-y-auto " +
          panelClassName
        }
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export default function AsignarDescuentos() {
  const { moveButton } = useOutletContext();
  const [discount, setDiscount] = useState(0);

  const [activeSelect, setActive] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [monto, setMonto] = useState(0);
  const handleCheck = (item) => {
    setSelectedItems(
      (prev) =>
        prev.some((i) => i.id === item.id)
          ? prev.filter((i) => i.id !== item.id) // remove if already selected
          : [...prev, item] // add if not selected
    );
  };

  async function onApplyGeneral() {
    // Validaciones UI
    const v = Number(genValor);
    if (genTipo === "PORCENTAJE" && (isNaN(v) || v < 1 || v > 100)) {
      alert("El porcentaje debe estar entre 1% y 100%.");
      return;
    }
    if (genTipo === "FIJO" && (isNaN(v) || v < 0)) {
      alert("El monto fijo no puede ser negativo.");
      return;
    }
    if (!selectedItems.length) {
      alert("Selecciona al menos un producto.");
      return;
    }

    // Mapea al contrato del backend
    const payload = {
      selectedProductIds: selectedItems.map((p) => Number(p.id)),
      discountType: genTipo === "PORCENTAJE" ? "percent" : "fixed",
      discountValue: v,
      // (Tu controller NO usa fechas; si las quieres persistir, habría que extender el endpoint)
    };

    try {
      setSavingGeneral(true);
      await aplicarDescuentoseleccionados(payload);
      alert("Descuentos aplicados correctamente ✔");
      // Limpia UI
      setMode(null);
      setSelectedItems([]);
      setGenValor("");
      // refresca tabla (si tu API ya calcula precio_venta, volverá actualizado)
      await refreshProductsBySucursal(selectedSucursalId);
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "No se pudo aplicar el descuento.";
      alert(msg);
    } finally {
      setSavingGeneral(false);
    }
  }

  async function onApplyTiered() {
    const productos = selectedItems.map((p) => Number(p.id));
    const escalones = tiers.map((t) => ({
      cantidad_min: Number(t.cantidad),
      precio: Number(t.precio),
    }));
    try {
      await aplicarPreciosEscalonados({ productos, escalones });
      alert("Precios escalonados aplicados ✔");
      setMode(null);
      setSelectedItems([]);
      refreshProductsBySucursal(selectedSucursalId);
    } catch (e) {
      console.error(e);
      alert("No se pudieron aplicar los escalonados.");
    }
  }

  // Funciones
  function toggleSort(key) {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }

  // === NUEVO ESTADO PARA MODOS ===
  const [mode, setMode] = useState(null); // 'general' | 'tiered' | null

  // General
  const [savingGeneral, setSavingGeneral] = useState(false);

  const [genTipo, setGenTipo] = useState("PORCENTAJE");
  const [genValor, setGenValor] = useState("");
  const [genDesde, setGenDesde] = useState("");
  const [genHasta, setGenHasta] = useState("");

  // Escalonados
  const [tiers, setTiers] = useState([{ cantidad: "", precio: "" }]);

  function addTier() {
    setTiers((t) => [...t, { cantidad: "", precio: "" }]);
  }
  function rmTier(i) {
    setTiers((t) => t.filter((_, idx) => idx !== i));
  }
  function setTier(i, field, val) {
    setTiers((t) =>
      t.map((r, idx) => (idx === i ? { ...r, [field]: val } : r))
    );
  }

  const [selectedDiscount, setSelectedDisc] = useState("Monto Fijo");
  const [cantidad, setCantidad] = useState(0);
  const [showFecha, setShowFecha] = useState(false);
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const handleDiscChange = (event) => {
    setSelectedDisc(event.target.value);
  };
  const handleGuardar = async (e) => {
    e.preventDefault();
    console.log("descripcion", selectedDiscount);
    console.log("valor_fijo", monto);
    console.log("valor_porcentaje", discount);
    const data = {
      nombre_promocion: "descuento",
      descripcion: selectedDiscount,
      valor_fijo: monto,
      valor_porcentaje: discount,
      cantidad_min: cantidad,
      fecha_inicio: inicio,
      fecha_termina: fin,
      id_tipo_promo: 1,
      banner_url: null,
      productos: selectedItems,
    };
    try {
      const res = await crearPromocion(data);
    } catch (err) {
      console.error("Error creando Promocion:", err);
    }
  };
  const [checked, setChecked] = useState(false);
  {
    //Cosas de la tabla
  }

  // Tabla
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros / orden / paginación
  const [filters, setFilters] = useState({
    id: "",
    producto: "",
    marca: "",
    categoria: "",
    subcategoria: "",
  });
  const [sort, setSort] = useState({ key: "", dir: "asc" });
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState({
    open: false,
    mode: "add",
    draft: emptyDraft(),
  });
  const isEdit = modal.mode === "edit";

  const [sucursales, setSucursales] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState("");

  // Filtro por sucursal
  const [selectedSucursalId, setSelectedSucursalId] = useState("");
  const [sucursalMenuOpen, setSucursalMenuOpen] = useState(false);
  const sucursalMenuRef = useRef(null);
  const [selectedSucursalName, setSelectedSucursalName] = useState("");
  //const sucMenuRef = useRef(null);
  const [showSucursalPicker, setShowSucursalPicker] = useState(false);
  const [sucursalFiltro, setSucursalFiltro] = useState("");

  // Abastecer
  const [savingSupply, setSavingSupply] = useState(false);
  const [supplyModal, setSupplyModal] = useState({
    open: false,
    product: null,
    images: [],
    draft: {
      id: "",
      producto: "",
      marca: "",
      cantidad: "",
      sucursalId: "",
      etiquetas: [],
    },
  });

  // Otros estados
  const [deletingId, setDeletingId] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);

  // ===== CARGA INICIAL =====
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [prodRes, sucRes, marcasRes, categoriasRes] = await Promise.all([
          getAllProducts(),
          getAllSucursales(),
          getMarcas(),
          ListarCategoria(),
        ]);

        const productsRaw = pickArrayPayload(prodRes, [
          "productos",
          "data",
          "results",
          "items",
        ]);
        const sucursalesRaw = pickArrayPayload(sucRes, [
          "sucursales",
          "data",
          "results",
          "items",
        ]);
        const marcasRaw = pickArrayPayload(marcasRes, [
          "marcas",
          "data",
          "results",
          "items",
        ]);
        const categoriasRaw = pickArrayPayload(categoriasRes, [
          "categorias",
          "data",
          "results",
          "items",
        ]);

        const mappedProducts = productsRaw.map(mapApiProduct);
        const mappedSuc = sucursalesRaw.map(mapApiSucursal);
        const mappedMarcas = marcasRaw.map((m, idx) => ({
          id: String(m.id_marca_producto ?? m.id ?? idx),
          nombre: m.nombre ?? m.marca ?? `Marca ${idx + 1}`,
        }));
        const mappedCategorias = categoriasRaw.map((c, idx) => ({
          id: String(c.id_categoria ?? c.id ?? idx),
          nombre: c.nombre ?? `Categoría ${idx + 1}`,
        }));

        if (!mounted) return;
        setRows(mappedProducts);
        setSucursales(mappedSuc);
        setMarcas(mappedMarcas);
        setCategorias(mappedCategorias);
      } catch (err) {
        console.error("Error cargando inventario:", err);
        alert("No se pudo cargar el inventario. Revisa la conexión.");
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (
        sucursalMenuOpen &&
        sucursalMenuRef.current &&
        !sucursalMenuRef.current.contains(e.target)
      ) {
        setSucursalMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [sucursalMenuOpen]);

  // ===== DERIVADOS =====
  const filtered = useMemo(() => {
    const f = (t) =>
      (t === null || t === undefined ? "" : String(t)).toLowerCase();
    return rows
      .filter((r) => r.activo) // ⬅️ SOLO activos
      .filter(
        (r) =>
          f(r.id).includes(f(filters.id)) &&
          f(r.producto).includes(f(filters.producto)) &&
          f(r.marca).includes(f(filters.marca)) &&
          f(r.categoria).includes(f(filters.categoria)) &&
          f(r.subcategoria).includes(f(filters.subcategoria))
      );
  }, [rows, filters]);

  const sorted = useMemo(() => {
    if (!sort.key) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const va = a[sort.key];
      const vb = b[sort.key];
      if (typeof va === "number" && typeof vb === "number")
        return sort.dir === "asc" ? va - vb : vb - va;
      return sort.dir === "asc"
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
    return copy;
  }, [filtered, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PageSize));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PageSize;
    return sorted.slice(start, start + PageSize);
  }, [sorted, page]);

  // ===== HELPERS =====

  async function refreshProductsBySucursal(sucursalId = "") {
    setLoading(true);
    try {
      const res = sucursalId
        ? await listarProductosporsucursal(Number(sucursalId))
        : await getAllProducts();
      console.log(
        "➡️ Endpoint usado:",
        sucursalId
          ? `/api/producto/sucursal/${Number(sucursalId)}`
          : "/api/Inventario/"
      );
      console.log("RAW sucursal:", res?.data);

      const productsRaw = pickArrayPayload(res, [
        "productos",
        "data",
        "results",
        "items",
        "rows",
        "content",
      ]);
      const mapped = (productsRaw || []).map(mapApiProduct);
      console.log("mapped length:", mapped.length);
      setRows(mapped);
      setPage(1); // vuelve a la primera página al filtrar
    } catch (e) {
      console.error("Error cargando productos:", e);
      alert(
        "No se pudo cargar productos. Verifica la conexión o la URL del API."
      );
    } finally {
      setLoading(false);
    }
  }

  // Devuelve el .nombre del item cuyo .id coincide (o undefined)
  function nameById(list, maybeId) {
    if (maybeId === undefined || maybeId === null || maybeId === "")
      return undefined;
    return list.find((x) => String(x.id) === String(maybeId))?.nombre;
  }

  function mapApiProduct(p, { preferSucursalStock = false } = {}) {
    const activo = p.activo ?? p.is_active ?? p.enabled ?? p.estado ?? true;

    // IDs (para selects)
    const marcaId =
      p.id_marca ??
      p.marca?.id_marca_producto ??
      p.marca?.id ??
      p.marca_id ??
      "";
    const categoriaId =
      p.id_categoria ??
      p.categoria?.id_categoria ??
      p.categoria?.id ??
      p.categoria_id ??
      "";
    const subcategoriaId =
      p.id_subcategoria ??
      p.subcategoria?.id_subcategoria ??
      p.subcategoria?.id ??
      p.subcategoria_id ??
      "";

    // STOCK: si viene de sucursal, usa el campo expuesto por el controller
    // (stock_en_sucursal) y si no, usa los totales.
    const stockSucursal =
      p.stock_en_sucursal ??
      p.stockSucursal ??
      p.stock_sucursal ??
      p.stock_suc ??
      null;

    const stockTotal = p.stock_total ?? p.stock ?? p.existencia ?? null;

    const stock = preferSucursalStock
      ? stockSucursal ?? stockTotal ?? 0
      : stockTotal ?? stockSucursal ?? 0;

    return {
      id: String(p.id ?? p.id_producto ?? p.producto_id ?? ""),
      producto: p.producto ?? p.nombre ?? "",

      // nombres (para la tabla)
      marca: p.marca?.nombre ?? p.marca ?? "",
      categoria:
        p.categoria?.nombre ??
        p.categoria?.nombre_categoria ??
        p.categoria ??
        "",
      subcategoria: p.subcategoria?.nombre ?? p.subcategoria ?? "",
      descripcion: p.descripcion ?? "", // ← añade esto
      unidadMedida: p.unidad_medida ?? p.unidadMedida ?? "unidad", // ← y esto

      // ids (para selects)
      marcaId: String(marcaId || ""),
      categoriaId: String(categoriaId || ""),
      subcategoriaId: String(subcategoriaId || ""),

      stockKg: Number(stock || 0),
      precioBase: Number(p.precioBase ?? p.precio_base ?? 0),
      // tu controller ya envía 'precio_venta' calculado
      precioVenta: Number(p.precioVenta ?? p.precio_venta ?? 0),
      activo,
    };
  }

  function pickArrayPayload(
    res,
    keys = ["sucursales", "results", "data", "items", "content", "rows"]
  ) {
    const d = res?.data ?? res;
    if (Array.isArray(d)) return d;
    for (const k of keys) if (Array.isArray(d?.[k])) return d[k];
    return [];
  }
  function mapApiSucursal(s, idx) {
    const idCandidates = [
      "id",
      "id_sucursal",
      "sucursal_id",
      "codigo",
      "Id",
      "idSucursal",
      "IDSucursal",
    ];
    let idVal = undefined;
    for (const k of idCandidates)
      if (s?.[k] !== undefined && s?.[k] !== null) {
        idVal = s[k];
        break;
      }
    if (idVal === undefined) idVal = idx;

    const nameCandidates = [
      "nombre",
      "nombre_sucursal",
      "sucursal",
      "sucursal_nombre",
      "name",
      "descripcion",
      "descripcion_sucursal",
      "Nombre",
      "NombreSucursal",
      "Sucursal",
    ];
    let nom = undefined;
    for (const k of nameCandidates) {
      const v = s?.[k];
      if (typeof v === "string" && v.trim()) {
        nom = v;
        break;
      }
    }
    if (!nom) {
      const firstString = Object.values(s || {}).find(
        (v) => typeof v === "string" && v.trim()
      );
      nom = firstString || `Sucursal ${idx + 1}`;
    }
    return { id: String(idVal), nombre: nom };
  }

  function toggleSort(key) {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }

  // ===== CRUD / Acciones =====
  return (
    <div
      className="bg-gray-100 w-screen flex flex-col px-16"
      style={{ ...styles.fixedShell, backgroundColor: "#f3f4f6" }}
    >
      <div
        className={`flex flex-col w-full pt-4 transition-all duration-300 w-full p-6 ${
          moveButton ? "ml-44" : "ml-0"
        }`}
      >
        <h1
          className="text-4xl font-semibold tracking-wide flex  justify-between "
          style={{ color: "#d8572f" }}
        >
          Asignar Descuentos
        </h1>
        <hr className="h-1 mt-2 w-full rounded-md bg-[#f0833e]" />

        {/* === Layout 2 columnas: IZQ tabla | DER panel === */}
        <div className="mt-4">
          <div className="grid gap-6 items-start lg:grid-cols-[minmax(0,1fr)_380px]">
            {/* ===== IZQUIERDA: TABLA ===== */}
            <section className="min-w-0">
              <div className="overflow-hidden rounded-2xl shadow-neutral-600 shadow-sm border border-[#d8dadc] bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm table-auto min-w-[900px]">
                    <thead>
                      <tr>
                        <Th
                          label="ID de Producto"
                          sortKey="id"
                          sort={sort}
                          onSort={toggleSort}
                        />
                        <ThFilter
                          label="Producto"
                          filterKey="producto"
                          value={filters.producto}
                          onChange={setFilters}
                        />
                        <ThFilter
                          label="Marca"
                          filterKey="marca"
                          value={filters.marca}
                          onChange={setFilters}
                        />
                        <ThFilter
                          label="Categoría"
                          filterKey="categoria"
                          value={filters.categoria}
                          onChange={setFilters}
                        />
                        <ThFilter
                          label="Subcategoría"
                          filterKey="subcategoria"
                          value={filters.subcategoria}
                          onChange={setFilters}
                        />
                        <Th
                          label="Precio Base"
                          sortKey="precioBase"
                          sort={sort}
                          onSort={toggleSort}
                        />
                        <Th
                          label="Precio Venta"
                          sortKey="precioVenta"
                          sort={sort}
                          onSort={toggleSort}
                        />
                        <th className="w-36 bg-[#2B6DAF] text-white">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => {
                                if (activeSelect) setSelectedItems([]);
                                setActive(!activeSelect);
                              }}
                              className={`p-2 px-6 rounded-lg ${
                                activeSelect
                                  ? "bg-red-500 text-white hover:bg-red-600"
                                  : "bg-[#2ca9e3] hover:bg-white hover:text-[#2ca9e3]"
                              }`}
                            >
                              {activeSelect ? "Unselect" : "Select"}
                            </button>
                          </div>
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading && (
                        <tr>
                          <td
                            colSpan={10}
                            className="px-3 py-8 text-center text-gray-500"
                          >
                            Cargando inventario…
                          </td>
                        </tr>
                      )}

                      {!loading &&
                        pageItems.map((r, idx) => (
                          <tr
                            key={r.id + idx}
                            className="border-b last:border-0 border-[#d8dadc]"
                          >
                            <td className="px-3 py-3 text-center">{r.id}</td>
                            <td className="px-3 py-3 text-center">
                              {r.producto}
                            </td>

                            <td className="px-3 py-3 text-center">{r.marca}</td>
                            <td className="px-3 py-3 text-center">
                              {r.categoria}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {r.subcategoria}
                            </td>

                            <td className="px-3 py-3 text-center">
                              L. {r.precioBase}
                            </td>
                            <td className="px-3 py-3 text-center">
                              L. {r.precioVenta}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-center">
                                {activeSelect && (
                                  <Checkbox
                                    checked={selectedItems.some(
                                      (i) => i.id === r.id
                                    )}
                                    onChange={() => handleCheck(r)}
                                    color="secondary"
                                    size="medium"
                                    sx={{
                                      "&.Mui-checked": { color: "#114C87" },
                                    }}
                                  />
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}

                      {!loading && pageItems.length === 0 && (
                        <tr>
                          <td
                            colSpan={10}
                            className="px-3 py-8 text-center text-gray-500"
                          >
                            Sin resultados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-center px-4 py-3 bg-white">
                  <Pagination
                    page={page}
                    pageCount={pageCount}
                    onPage={(p) => setPage(Math.min(Math.max(1, p), pageCount))}
                  />
                </div>
              </div>
            </section>

            {/* ===== DERECHA: PANEL (alineado y siempre completo) ===== */}
            <aside className="min-w-0">
              {/* top debe coincidir con tu header fijo (~90px). Ajusta 88–96 si hiciera falta */}
              <div
                className="lg:sticky top-[90px] self-start"
                style={{ maxHeight: "calc(100vh - 100px)" }} // garantiza que quepa en viewport
              >
                <div className="rounded-2xl border border-[#d8dadc] bg-white shadow-sm p-4">
                  <h3 className="text-center text-lg font-semibold text-[#2b6daf]">
                    Panel de Descuentos
                  </h3>

                  {/* selector de modo */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setMode(mode === "general" ? null : "general")
                      }
                      className={`px-3 py-2 rounded-xl border text-sm ${
                        mode === "general"
                          ? "bg-[#2b6daf] text-white border-[#2b6daf]"
                          : "bg-white text-gray-800 border-[#d8dadc] hover:bg-gray-50"
                      }`}
                    >
                      Descuento general
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setMode(mode === "tiered" ? null : "tiered")
                      }
                      className={`px-3 py-2 rounded-xl border text-sm ${
                        mode === "tiered"
                          ? "bg-[#2b6daf] text-white border-[#2b6daf]"
                          : "bg-white text-gray-800 border-[#d8dadc] hover:bg-gray-50"
                      }`}
                    >
                      Precios escalonados
                    </button>
                  </div>

                  {/* contenido dinámico */}
                  <div className="mt-4">
                    {/* ====== DESCUENTO GENERAL ====== */}
                    {mode === "general" && (
                      <div className="space-y-3">
                        <label className="flex flex-col gap-1">
                          <span className="text-sm text-gray-700">
                            Tipo de descuento
                          </span>
                          <select
                            value={genTipo}
                            onChange={(e) => setGenTipo(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-[#d8dadc] text-gray-900"
                          >
                            <option value="PORCENTAJE">% Porcentaje</option>
                            <option value="FIJO">Monto fijo</option>
                          </select>
                        </label>

                        <label className="flex flex-col gap-1">
                          <span className="text-sm text-gray-700">Valor</span>
                          <input
                            type="number"
                            value={genValor}
                            onChange={(e) => setGenValor(e.target.value)}
                            min={genTipo === "PORCENTAJE" ? 1 : 0}
                            max={genTipo === "PORCENTAJE" ? 100 : undefined}
                            step={genTipo === "PORCENTAJE" ? 1 : 0.01}
                            className="px-3 py-2 rounded-xl border border-[#d8dadc] text-gray-900"
                            placeholder={
                              genTipo === "PORCENTAJE" ? "1 a 100" : "≥ 0"
                            }
                          />
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex flex-col gap-1">
                            <span className="text-sm text-gray-700">Desde</span>
                            <input
                              type="date"
                              value={genDesde}
                              onChange={(e) => setGenDesde(e.target.value)}
                              className="px-3 py-2 rounded-xl border border-[#d8dadc] text-gray-900"
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-sm text-gray-700">Hasta</span>
                            <input
                              type="date"
                              value={genHasta}
                              onChange={(e) => setGenHasta(e.target.value)}
                              className="px-3 py-2 rounded-xl border border-[#d8dadc] text-gray-900"
                            />
                          </label>
                        </div>

                        <button
                          onClick={onApplyGeneral}
                          disabled={
                            savingGeneral ||
                            !selectedItems.length ||
                            !genValor ||
                            !genDesde ||
                            !genHasta
                          }
                          className={`w-full mt-2 px-4 py-2 rounded-xl text-white ${
                            !savingGeneral &&
                            selectedItems.length &&
                            genValor &&
                            genDesde &&
                            genHasta
                              ? "bg-[#f0833e] hover:bg-[#e67830]"
                              : "bg-gray-300 cursor-not-allowed"
                          }`}
                        >
                          {savingGeneral
                            ? "Aplicando..."
                            : `Aplicar a seleccionados (${selectedItems.length})`}
                        </button>

                        <p className="text-[12px] text-gray-500 text-center">
                          El valor admite{" "}
                          {genTipo === "PORCENTAJE" ? "1–100%" : "monto ≥ 0"}.
                        </p>
                      </div>
                    )}

                    {/* ====== PRECIOS ESCALONADOS ====== */}
                    {mode === "tiered" && (
                      <div>
                        <div className="rounded-2xl border border-[#d8dadc] overflow-hidden">
                          <div className="bg-[#2B6DAF] text-white px-3 py-2 grid grid-cols-[1fr_1fr_32px] gap-2">
                            <div className="text-sm">Cantidad</div>
                            <div className="text-sm">Precio</div>
                            <div />
                          </div>

                          {/* solo scrollea esta área si hay > 2 filas, el panel completo no scrollea */}
                          <div
                            className={
                              tiers.length > 2
                                ? "max-h-[150px] overflow-y-auto divide-y"
                                : "divide-y"
                            }
                          >
                            {tiers.map((t, i) => (
                              <div
                                key={i}
                                className="px-3 py-2 grid grid-cols-[1fr_1fr_32px] gap-2 items-center"
                              >
                                <input
                                  type="number"
                                  min="1"
                                  value={t.cantidad}
                                  onChange={(e) =>
                                    setTier(i, "cantidad", e.target.value)
                                  }
                                  className="h-8 text-sm text-center px-2 rounded-lg border border-[#d8dadc] outline-none focus:ring-2"
                                />
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={t.precio}
                                  onChange={(e) =>
                                    setTier(i, "precio", e.target.value)
                                  }
                                  className="h-8 text-sm text-center px-2 rounded-lg border border-[#d8dadc] outline-none focus:ring-2"
                                />
                                <button
                                  onClick={() => rmTier(i)}
                                  className="mx-auto text-gray-500 hover:text-red-600"
                                  title="Eliminar"
                                >
                                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                                    <path
                                      d="M9 3h6m-9 4h12M9 7v12m6-12v12M4 7h16l-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 7Z"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      fill="none"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={addTier}
                              className="w-full text-left px-3 py-2 text-gray-500 hover:bg-gray-50"
                            >
                              + Agregar
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={onApplyTiered}
                          disabled={
                            !selectedItems.length ||
                            tiers.some((t) => !t.cantidad || !t.precio)
                          }
                          className={`w-full mt-3 px-4 py-2 rounded-xl text-white ${
                            selectedItems.length &&
                            tiers.every((t) => t.cantidad && t.precio)
                              ? "bg-[#f0833e] hover:bg-[#e67830]"
                              : "bg-gray-300 cursor-not-allowed"
                          }`}
                        >
                          Aplicar a seleccionados ({selectedItems.length})
                        </button>

                        <p className="text-[12px] text-gray-500 text-center mt-1">
                          Define cantidades mínimas con su precio. Se usa en el
                          checkout según la cantidad comprada.
                        </p>
                      </div>
                    )}

                    {/* mensaje cuando no hay modo seleccionado */}
                    {!mode && (
                      <p className="text-sm text-gray-500 text-center">
                        Elige un modo para configurar los descuentos.
                      </p>
                    )}
                  </div>

                  {/* Pie de ayuda */}
                  <div className="mt-4 border-t border-[#eee] pt-3">
                    <div className="flex items-start gap-2">
                      <svg
                        viewBox="0 0 24 24"
                        className="w-5 h-5 text-[#2b6daf]"
                      >
                        <path
                          d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4Z"
                          fill="currentColor"
                          opacity=".15"
                        />
                        <path
                          d="M12 6v6m0 4h.01"
                          stroke="#2b6daf"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                      </svg>
                      <p className="text-[12px] text-gray-600 leading-snug">
                        Los cambios afectan solo a los{" "}
                        <b>{selectedItems.length}</b> productos seleccionados en
                        la tabla.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {showFecha && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-96 relative animate-fadeIn">
            <h2 className="bg-[#2b6daf] text-xl rounded-t-lg font-bold p-2 text-center text-white mb-6">
              Periodo del descuento
            </h2>

            <form
              className="flex flex-col space-y-4 pr-6 pl-6 pb-8"
              onSubmit={handleGuardar}
            >
              <div>
                <p className="text-[18px]">Valido desde</p>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setInicio(e.target.value)}
                  required
                />
              </div>
              <div>
                <p className="text-[18px]">Hasta</p>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setFin(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-8">
                <button
                  onClick={() => setShowFecha(false)}
                  className="text-white py-2 w-1/2 bg-red-600 rounded-lg"
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white py-2 w-1/2 rounded-lg hover:bg-blue-700 transition"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Subcomponentes ---------------- */
function Th({ label, className = "", sortKey, sort, onSort }) {
  const active = sort.key === sortKey;
  return (
    <th className={"px-3 py-2 text-left bg-[#2B6DAF] " + className}>
      <button
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-2 text-white"
        title="Ordenar"
      >
        <span className="font-medium">{label}</span>
        <Icon.Sort active={active} dir={active ? sort.dir : "asc"} />
      </button>
    </th>
  );
}

// Encabezado con lupa y popover de filtros
function ThFilter({ label, filterKey, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState(value || "");
  const popRef = useRef(null);

  // cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (open && popRef.current && !popRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // sincroniza estado local si cambian filtros desde fuera
  useEffect(() => setLocal(value || ""), [value]);

  const apply = () => {
    onChange((prev) => ({ ...prev, [filterKey]: local }));
    setOpen(false);
  };
  const clear = () => {
    setLocal("");
    onChange((prev) => ({ ...prev, [filterKey]: "" }));
    setOpen(false);
  };

  return (
    <th className="px-3 py-2 text-left relative bg-[#2B6DAF]">
      <div className="flex items-center gap-2">
        <span className="font-medium text-white">{label}</span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="p-1 rounded-md hover:bg-white/15"
          title="Filtrar"
        >
          <Icon.Search className="text-white" />
        </button>
      </div>

      {open && (
        <div
          ref={popRef}
          className="absolute left-0 mt-2 z-20 w-64 rounded-xl border border-[#d8dadc] bg-white shadow-lg p-3"
        >
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-600">Contiene</label>
            <input
              autoFocus
              className="px-3 py-2 rounded-xl border border-[#d8dadc] focus:outline-none focus:ring-2"
              style={{ outlineColor: "#2ca9e3" }}
              placeholder={`Filtrar ${label.toLowerCase()}...`}
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") apply();
                if (e.key === "Escape") setOpen(false);
              }}
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={clear}
                className="px-3 py-1.5 rounded-xl border border-[#d8dadc] text-black text-sm"
              >
                Limpiar
              </button>
              <button
                onClick={apply}
                className="px-3 py-1.5 rounded-xl text-black text-sm"
                style={{ backgroundColor: "#f0833e" }}
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </th>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-gray-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-xl border border-[#d8dadc] focus:outline-none focus:ring-2"
        style={{ outlineColor: "#2ca9e3" }}
      />
    </label>
  );
}

function Pagination({ page, pageCount, onPage }) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onPage(page - 1)}
        className="p-1.5 rounded-full border border-[#d8dadc] hover:bg-gray-50"
        disabled={page === 1}
        title="Anterior"
      >
        <Icon.ChevronLeft />
      </button>

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className={`w-8 h-8 rounded-full border border-[#d8dadc] ${
            p === page ? "ring-2" : ""
          }`}
          style={p === page ? { ringColor: "#d8572f", color: "#d8572f" } : {}}
          title={`Página ${p}`}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onPage(page + 1)}
        className="p-1.5 rounded-full border border-[#d8dadc] hover:bg-gray-50"
        disabled={page === pageCount}
        title="Siguiente"
      >
        <Icon.ChevronRight />
      </button>
    </div>
  );
}

const styles = {
  fixedShell: {
    position: "absolute",
    top: "90px",
    left: 0,
    right: 0,
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
};
function StatusBadge({ active }) {
  const isActive = active !== false;
  return (
    <span
      className={
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium " +
        (isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600")
      }
      title={isActive ? "Activo" : "Inactivo"}
    >
      {isActive ? "Activo" : "Inactivo"}
    </span>
  );
}
function ImageCarousel({ images = [] }) {
  const [idx, setIdx] = React.useState(0);
  const safe = (images || []).filter(Boolean);
  if (safe.length === 0) return null;

  const prev = () => setIdx((i) => (i - 1 + safe.length) % safe.length);
  const next = () => setIdx((i) => (i + 1) % safe.length);

  return (
    <div className="w-full">
      <div className="relative rounded-2xl border border-dashed border-[#d8dadc] p-3">
        <img
          src={safe[idx]}
          alt={`img-${idx + 1}`}
          className="w-full h-56 md:h-64 object-contain rounded-xl"
        />

        {/* Flechas */}
        <button
          type="button"
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-[#d8dadc] shadow flex items-center justify-center"
          title="Anterior"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700">
            <path
              d="M15 6l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-[#d8dadc] shadow flex items-center justify-center"
          title="Siguiente"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700">
            <path
              d="M9 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Miniaturas */}
      {safe.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
          {safe.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              className={`rounded-lg border ${
                i === idx
                  ? "ring-2 ring-[#2b6daf] border-[#2b6daf]"
                  : "border-[#d8dadc]"
              }`}
              title={`Imagen ${i + 1}`}
            >
              <img
                src={src}
                alt={`thumb-${i + 1}`}
                className="w-16 h-12 object-cover rounded-md"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
