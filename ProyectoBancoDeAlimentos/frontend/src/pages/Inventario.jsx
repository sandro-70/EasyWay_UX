// src/pages/Inventario.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Sidebar from "../sidebar";
import axiosInstance from "../api/axiosInstance";
import {
  getAllProducts,
  getAllSucursales,
  abastecerPorSucursalProducto,
  getImagenesProducto,
  actualizarProducto,
  desactivarProducto,
  crearProducto,
  getMarcas,
  listarProductosporsucursal,
} from "../api/InventarioApi";
import { ListarCategoria } from "../api/CategoriaApi";
import { listarSubcategoria } from "../api/SubcategoriaApi";

/* ===================== Helpers / Const ===================== */
const PageSize = 10;

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
  Edit: (props) => (
    <svg viewBox="0 0 24 24" className={"w-5 h-5 " + (props.className || "")}>
      <path
        d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  ),
  Trash: (props) => (
    <svg viewBox="0 0 24 24" className={"w-5 h-5 " + (props.className || "")}>
      <path
        d="M6 7h12M9 7V5h6v2m-8 0 1 12h8l1-12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
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

/* ===================== PAGINA INVENTARIO ===================== */
export default function Inventario() {
  // Sidebar

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

  // Modal editar/crear
  const [modal, setModal] = useState({
    open: false,
    mode: "add",
    draft: emptyDraft(),
  });
  const isEdit = modal.mode === "edit";

  // Catálogos
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
    return rows.filter(
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

  async function loadProductsBySucursal(sucursalId = "") {
    try {
      setLoading(true);

      const useAll = !sucursalId;
      const res = useAll
        ? await getAllProducts()
        : await listarProductosporsucursal(sucursalId);

      const raw = pickArrayPayload(res, [
        "productos",
        "data",
        "results",
        "items",
      ]);
      // 👇 pasa el flag para que el mapper lea el campo de stock correcto
      const mapped = raw.map((x) =>
        mapApiProduct(x, { fromSucursal: !useAll })
      );

      setRows(mapped);
      setPage(1);
      // Limpia filtros de texto para no ocultar nada por accidente
      setFilters({
        id: "",
        producto: "",
        marca: "",
        categoria: "",
        subcategoria: "",
      });
    } catch (e) {
      console.error("Error cargando productos por sucursal:", e);
      alert("No se pudo cargar productos. Revisa la conexión.");
    } finally {
      setLoading(false);
    }
  }

  // Usa este helper para cargar según la sucursal seleccionada
  async function handleSelectSucursal(id) {
    try {
      setSelectedSucursalId(id || "");
      setLoading(true);

      // Elegimos endpoint
      const useAll = !id;
      console.log(
        "➡️  Endpoint usado:",
        useAll ? "/api/Inventario/" : `/api/producto/sucursal/${id}`
      );

      const res = useAll
        ? await getAllProducts()
        : await listarProductosporsucursal(id);

      // Normaliza el payload
      const raw = pickArrayPayload(res, [
        "productos",
        "data",
        "results",
        "items",
      ]);
      console.log("RAW sucursal:", raw);
      const mapped = raw.map(mapApiProduct);
      console.log("mapped length:", mapped.length);

      // 🚀 Actualiza la tabla y RESETEA PAGINACIÓN
      setRows(mapped);
      setPage(1); // <<<<<< CLAVE: evita que la tabla quede vacía
      // (opcional) limpia filtros de texto si quieres evitar que “coman” resultados
      // setFilters({ id:"", producto:"", marca:"", categoria:"", subcategoria:"" });
    } catch (e) {
      console.error(e);
      alert("No se pudo cargar productos para la sucursal seleccionada.");
    } finally {
      setLoading(false);
      setShowSucursalPicker(false);
    }
  }

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

  // Cuando seleccionas en el menú de sucursal
  function handleSucursalPick(id, nombre) {
    setSelectedSucursalId(id);
    setSelectedSucursalName(nombre);
    setSucursalMenuOpen(false);
    refreshProductsBySucursal(id);
  }

  // Devuelve el .nombre del item cuyo .id coincide (o undefined)
  function nameById(list, maybeId) {
    if (maybeId === undefined || maybeId === null || maybeId === "")
      return undefined;
    return list.find((x) => String(x.id) === String(maybeId))?.nombre;
  }

  // 👇 acepta un flag fromSucursal para mapear el stock correcto
  function mapApiProduct(p, { fromSucursal = false } = {}) {
    // Muchos endpoints de sucursal devuelven { producto: {...}, stock: N }
    const prod = p.producto ?? p.Producto ?? p.item ?? p;

    const activo =
      prod.activo ?? prod.is_active ?? prod.enabled ?? prod.estado ?? true;

    // ids para selects
    const marcaId = prod.id_marca ?? prod.marca?.id ?? prod.marca_id ?? "";
    const categoriaId =
      prod.id_categoria ?? prod.categoria?.id ?? prod.categoria_id ?? "";
    const subcatId =
      prod.id_subcategoria ??
      prod.subcategoria?.id ??
      prod.subcategoria_id ??
      "";

    // 🔥 stock: si viene de sucursal, prioriza campos típicos de stock-por-sucursal,
    // si no, toma los del total del producto.
    let stock = 0;
    if (fromSucursal) {
      stock = Number(
        // campos típicos en respuestas por sucursal:
        p.stock_sucursal ??
          p.stockSucursal ??
          p.sucursal_stock ??
          p.cantidad ??
          p.cantidad_stock ??
          p.existencias ??
          p.stock ?? // a veces ya se llama "stock"
          prod.stock_sucursal ??
          prod.stockSucursal ??
          0
      );
    } else {
      stock = Number(
        prod.stock_total ?? prod.stock ?? prod.existencia ?? prod.stockKg ?? 0
      );
    }

    return {
      id: String(prod.id ?? prod.id_producto ?? prod.producto_id ?? ""),
      producto: prod.producto ?? prod.nombre ?? "",

      // nombres para la tabla
      marca: prod.marca?.nombre ?? prod.marca ?? "",
      categoria: prod.categoria?.nombre ?? prod.categoria ?? "",
      subcategoria: prod.subcategoria?.nombre ?? prod.subcategoria ?? "",

      // ids para selects
      marcaId: String(marcaId || ""),
      categoriaId: String(categoriaId || ""),
      subcategoriaId: String(subcatId || ""),

      stockKg: stock,
      precioBase: Number(prod.precioBase ?? prod.precio_base ?? 0),
      precioVenta: Number(prod.precioVenta ?? prod.precio_venta ?? 0),
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

  function toAbsoluteUrl(u) {
    if (!u) return "";
    // ¿ya es absoluta?
    if (/^https?:\/\//i.test(u)) return u;
    // base del backend (usa la de axios si existe, o el origen actual)
    const base =
      (typeof axiosInstance !== "undefined" &&
        axiosInstance?.defaults?.baseURL) ||
      window.location.origin;
    const b = String(base).replace(/\/$/, "");
    if (u.startsWith("/")) return b + u;
    return `${b}/${u}`;
  }

  function mapApiImagen(i) {
    if (!i) return "";
    if (typeof i === "string") return toAbsoluteUrl(i.trim());

    const raw =
      i.url_imagen || // 👈 ESTE es el que devuelve tu API
      i.imagen_url ||
      i.image_url ||
      i.url ||
      i.src ||
      i.path ||
      i.ruta ||
      i.link ||
      i.ubicacion ||
      "";

    return toAbsoluteUrl(String(raw).trim());
  }

  function toggleSort(key) {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }

  async function listarSubcategoriaPorCategoria(categoriaId) {
    if (!categoriaId) {
      setSubcategorias([]);
      return;
    }
    try {
      const res = await listarSubcategoria();
      const subcategoriasRaw = pickArrayPayload(res, [
        "subcategorias",
        "data",
        "results",
        "items",
      ]);
      const mapped = subcategoriasRaw
        .filter((sc) => String(sc.id_categoria_padre) === String(categoriaId))
        .map((sc, idx) => ({
          id: String(sc.id_subcategoria ?? sc.id ?? idx),
          nombre: sc.nombre ?? `Subcategoría ${idx + 1}`,
        }));
      setSubcategorias(mapped);
    } catch (err) {
      console.error("Error cargando subcategorías", err);
      alert("No se pudo cargar las subcategorías.");
    }
  }

  function addEscalon() {
    setModal((m) => ({
      ...m,
      draft: {
        ...m.draft,
        escalones: [...(m.draft.escalones || []), { cantidad: "", precio: "" }],
      },
    }));
  }

  function updateEscalon(index, key, value) {
    setModal((m) => {
      const next = [...(m.draft.escalones || [])];
      next[index] = { ...next[index], [key]: value };
      return { ...m, draft: { ...m.draft, escalones: next } };
    });
  }

  function removeEscalon(index) {
    setModal((m) => {
      const next = [...(m.draft.escalones || [])];
      next.splice(index, 1);
      return { ...m, draft: { ...m.draft, escalones: next } };
    });
  }

  // === IMÁGENES ===
  const imgInputRef = useRef(null);
  function triggerImagePicker() {
    imgInputRef.current?.click();
  }
  function readAsDataURL(file) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
  }
  async function handleImagesSelected(ev) {
    const files = Array.from(ev.target.files || []);
    if (!files.length) return;
    const previews = await Promise.all(files.map(readAsDataURL));
    setModal((m) => {
      const prevFiles = m.draft.imageFiles || [];
      const prevPreviews = m.draft.imagePreviews || [];
      return {
        ...m,
        draft: {
          ...m.draft,
          imageFiles: [...prevFiles, ...files],
          imagePreviews: [...prevPreviews, ...previews],
        },
      };
    });
    ev.target.value = "";
  }
  function removePreview(idx) {
    setModal((m) => {
      const nextPreviews = [...(m.draft.imagePreviews || [])];
      const nextFiles = [...(m.draft.imageFiles || [])];
      nextPreviews.splice(idx, 1);
      nextFiles.splice(idx, 1);
      return {
        ...m,
        draft: {
          ...m.draft,
          imagePreviews: nextPreviews,
          imageFiles: nextFiles,
        },
      };
    });
  }

  // ===== CRUD / Acciones =====
  function openAdd() {
    setSelectedCategoria("");
    setSubcategorias([]);
    setModal({ open: true, mode: "add", draft: emptyDraft() });
  }
  async function openEdit(row) {
    setSelectedCategoria("");
    setModal({
      open: true,
      mode: "edit",
      draft: { ...emptyDraft(), ...row, imagePreviews: [], imageFiles: [] },
    });
    try {
      const res = await getImagenesProducto(row.id);
      const urls = (
        Array.isArray(res?.data) ? res.data : (res?.data ?? res) || []
      )
        .map(mapApiImagen)
        .filter(Boolean);
      setModal((m) => ({
        ...m,
        draft: { ...m.draft, imagePreviews: urls, imageFiles: [] },
      }));
    } catch (e) {
      console.warn("No se pudieron cargar imágenes del producto", e);
    }
  }
  function closeModal() {
    setModal((m) => ({ ...m, open: false }));
  }
  async function saveModal() {
    const d = modal.draft;

    // Validaciones mínimas
    if (!d.producto?.trim())
      return alert("El nombre del producto es obligatorio.");
    if (!d.marcaId && !d.marca) return alert("Selecciona una marca.");
    if (!d.subcategoriaId && !d.subcategoria)
      return alert("Selecciona una subcategoría.");

    try {
      setSavingProduct(true);

      // Preparar etiquetas
      const etiquetas = (d.etiquetasText || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (modal.mode === "edit") {
        // --- 1) Llamada al backend ---
        await actualizarProducto(
          d.id,
          d.producto,
          d.descripcion ?? "",
          Number(d.precioBase ?? 0),
          Number(d.subcategoriaId ?? d.subcategoria ?? 0),
          Number(d.porcentajeGanancia ?? 0),
          Number(d.marcaId ?? d.marca ?? 0),
          etiquetas,
          d.unidadMedida ?? "unidad",
          !!d.activo
        );

        // --- 2) Actualización optimista en la tabla (sin volver a pedir) ---
        setRows((prev) =>
          prev.map((row) => {
            if (String(row.id) !== String(d.id)) return row;

            const marcaNombre =
              nameById(marcas, d.marcaId ?? d.marca) ?? row.marca;
            const categoriaNombre =
              nameById(categorias, d.categoriaId ?? d.categoria) ??
              row.categoria;
            const subcatNombre =
              nameById(subcategorias, d.subcategoriaId ?? d.subcategoria) ??
              row.subcategoria;

            return {
              ...row,
              producto: d.producto ?? row.producto,
              marca: marcaNombre,
              categoria: categoriaNombre,
              subcategoria: subcatNombre,
              precioBase: Number(
                d.precioBase !== undefined && d.precioBase !== null
                  ? d.precioBase
                  : row.precioBase
              ),
              activo: d.activo ?? row.activo,
            };
          })
        );
      } else {
        // CREAR producto
        const etiquetas = ["Nuevo"];
        await crearProducto(
          d.producto,
          d.descripcion ?? "",
          Number(d.precioBase ?? 0),
          Number(d.subcategoriaId ?? d.subcategoria ?? 0),
          Number(d.porcentajeGanancia ?? 0),
          Number(d.marcaId ?? d.marca ?? 0),
          etiquetas,
          d.unidadMedida ?? "unidad"
        );

        // Recargar productos después de crear
        const prodRes = await getAllProducts();
        const mapped = ((prodRes?.data ?? prodRes) || []).map(mapApiProduct);
        setRows(mapped);
      }

      closeModal();
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      alert(
        `Error ${status ?? ""}: ${
          data?.message || data?.detail || data?.error || err.message
        }`
      );
    } finally {
      setSavingProduct(false);
    }
  }

  async function removeRow(id) {
    if (!window.confirm("¿Desactivar este producto?")) return;
    const prodId = Number(String(id).trim());
    if (!Number.isFinite(prodId) || prodId <= 0) {
      alert("ID de producto inválido.");
      return;
    }
    try {
      setDeletingId(prodId);
      await desactivarProducto(prodId);
      setRows((prev) =>
        prev.map((x) => (x.id === String(prodId) ? { ...x, activo: false } : x))
      );
    } catch (err) {
      const s = err?.response?.status;
      const d = err?.response?.data;
      alert(
        "No se pudo desactivar. " +
          (s ? `HTTP ${s}. ` : "") +
          (typeof d === "string" ? d : d?.message || d?.detail || "Error")
      );
    } finally {
      setDeletingId(null);
    }
  }

  // Abastecer
  async function openSupply(productToSupply) {
    setSupplyModal({
      open: true,
      product: productToSupply,
      images: [],
      draft: {
        id: productToSupply.id,
        producto: productToSupply.producto,
        marca: productToSupply.marca,
        cantidad: "",
        sucursalId: "",
        etiquetas: [],
      },
    });
    try {
      const res = await getImagenesProducto(productToSupply.id);
      // extrae el array aunque venga anidado
      const imgsRaw = pickArrayPayload(res, [
        "imagenes",
        "images",
        "fotos",
        "data",
        "items",
        "results",
      ]);
      const imgs = (imgsRaw || []).map(mapApiImagen).filter(Boolean);

      // si no hay imágenes del backend, deja vacío (o pon un placeholder si quieres)
      setSupplyModal((m) => ({ ...m, images: imgs }));
    } catch (e) {
      console.warn("No se pudieron cargar imágenes del producto", e);
      setSupplyModal((m) => ({ ...m, images: [] }));
    }
  }
  function closeSupply() {
    setSupplyModal((m) => ({ ...m, open: false }));
  }
  async function saveSupply() {
    const { id, cantidad, sucursalId } = supplyModal.draft;
    const prodId = Number(String(id).trim());
    const sucId = Number(String(sucursalId).trim());
    const qty = Number(String(cantidad).trim());
    if (!Number.isFinite(prodId) || prodId <= 0)
      return alert("ID de producto inválido.");
    if (!Number.isFinite(sucId) || sucId <= 0)
      return alert("Selecciona una sucursal válida.");
    if (!Number.isFinite(qty) || qty <= 0)
      return alert("Ingresa una cantidad válida (> 0).");

    try {
      setSavingSupply(true);
      await abastecerPorSucursalProducto(sucId, prodId, qty);
      const prodRes = await getAllProducts();
      const mapped = ((prodRes?.data ?? prodRes) || []).map(mapApiProduct);
      setRows(mapped);
      closeSupply();
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      alert(
        "No se pudo abastecer. " +
          (status ? `HTTP ${status}. ` : "") +
          (typeof data === "string"
            ? data
            : data?.message || data?.detalle || "Error")
      );
    } finally {
      setSavingSupply(false);
    }
  }

  /* ===================== UI ===================== */
  return (
    <div className="w-full px-4 bg-[#f9fafb]">
      {/* Sidebar */}

      <div className="mx-auto py-6 max-w-[1100px]">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-semibold tracking-wide text-[#d8572f]">
            Inventario
          </h1>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white shadow hover:shadow-md"
            style={{ backgroundColor: "#d8572f" }}
            title="Agregar producto"
          >
            <Icon.Plus className="w-5 h-5" />
            Agregar producto
          </button>
        </div>
        <div className="h-1 w-full rounded-md bg-[#f0833e] mt-2" />

        {/* Barra de acciones encima de la tabla */}
        <div className="mt-3 flex items-center justify-end">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSucursalPicker((s) => !s)}
              className="px-3 py-2 rounded-xl border border-[#d8dadc] bg-gray-100 hover:bg-gray-200 text-gray-700"
              title="Filtrar stock por sucursal"
            >
              Stock por sucursal
            </button>

            {showSucursalPicker && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[#d8dadc] bg-white shadow-lg p-3 z-20">
                <label className="text-sm text-gray-700 block mb-1">
                  Sucursal
                </label>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-[#d8dadc] focus:outline-none focus:ring-2"
                  style={{ outlineColor: "#2ca9e3" }}
                  value={selectedSucursalId}
                  onChange={async (e) => {
                    const id = e.target.value;
                    setSelectedSucursalId(id);
                    await loadProductsBySucursal(id); // 🔥 carga según selección
                    setShowSucursalPicker(false);
                  }}
                >
                  <option value="">Todas las sucursales</option>
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl shadow-sm border border-[#d8dadc] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto min-w-[900px]">
              <thead>
                <tr className="text-white">
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
                  <Th
                    label="Estado"
                    sortKey="activo"
                    sort={sort}
                    onSort={toggleSort}
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
                    label="Total en Stock"
                    sortKey="stockKg"
                    sort={sort}
                    onSort={toggleSort}
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
                  <th className="px-3 py-2 text-left bg-[#2B6DAF]">Opciones</th>
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
                      <td className="px-3 py-3">{r.id}</td>
                      <td className="px-3 py-3">{r.producto}</td>
                      <td className="px-3 py-3">
                        <StatusBadge active={r.activo} />
                      </td>
                      <td className="px-3 py-3">{r.marca}</td>
                      <td className="px-3 py-3">{r.categoria}</td>
                      <td className="px-3 py-3">{r.subcategoria}</td>
                      <td className="px-3 py-3">{r.stockKg} kg.</td>
                      <td className="px-3 py-3">L. {r.precioBase}</td>
                      <td className="px-3 py-3">L. {r.precioVenta}</td>

                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openSupply(r)}
                            className="p-2 rounded-xl border border-[#d8dadc] hover:bg-[#ffac77]/30"
                            title="Abastecer"
                          >
                            <Icon.Plus className="text-[#2b6daf]" />
                          </button>

                          <button
                            onClick={() => openEdit(r)}
                            className="p-2 rounded-xl border border-[#d8dadc] hover:bg-[#2ca9e3]/20"
                            title="Editar"
                          >
                            <Icon.Edit className="text-[#2ca9e3]" />
                          </button>

                          <button
                            onClick={() => removeRow(r.id)}
                            disabled={deletingId === Number(r.id)}
                            className="p-2 rounded-xl border border-[#d8dadc] hover:bg-red-50 disabled:opacity-60"
                            title={
                              deletingId === Number(r.id)
                                ? "Desactivando..."
                                : "Desactivar"
                            }
                          >
                            <Icon.Trash className="text-red-500" />
                          </button>
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
      </div>

      {/* ========== Modal Agregar / Editar ========== */}
      <Modal open={modal.open} onClose={closeModal}>
        <div
          className="px-5 py-3 rounded-t-2xl sticky top-0"
          style={{ backgroundColor: "#2b6daf" }}
        >
          <h3 className="text-white font-medium">
            {modal.mode === "add" ? "Agregar producto" : "Editar producto"}
          </h3>
        </div>

        <div className="p-5 grid grid-cols-2 gap-4">
          {/* input file oculto (compartido) */}
          <input
            ref={imgInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImagesSelected}
          />

          {/* Uploader vs Grid */}
          {(modal.draft.imagePreviews?.length ?? 0) === 0 ? (
            <div
              className="col-span-2 w-full border border-dashed border-[#d8dadc] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer"
              onClick={triggerImagePicker}
            >
              <svg
                className="w-12 h-12 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M19 11.5V12.5C19 16.9183 15.4183 20.5 11 20.5C6.58172 20.5 3 8.08172 3 12.5C3 8.08172 6.58172 4.5 11 4.5H12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M17.5 7.5L14.5 10.5C13.8016 11.1984 12.6053 11.1984 11.9069 10.5L11.5 10.1L9.5 8.1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15.5 4.5L19.5 8.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14.5 4.5H19.5V9.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-gray-500 mt-2">Haz clic para cargar</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerImagePicker();
                }}
                className="mt-3 px-4 py-2 rounded-xl text-white font-medium"
                style={{ backgroundColor: "#2b6daf" }}
              >
                Cargar imágenes
              </button>
            </div>
          ) : (
            <>
              <div className="col-span-2 grid grid-cols-3 gap-3">
                {modal.draft.imagePreviews.map((src, i) => (
                  <div key={i} className="relative">
                    <img
                      src={src}
                      alt={`preview-${i}`}
                      className="w-full h-32 object-cover rounded-lg border border-[#d8dadc]"
                    />
                    <button
                      type="button"
                      title="Quitar"
                      onClick={() => removePreview(i)}
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border border-[#d8dadc] shadow text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {/* Tile para añadir más */}
                <button
                  type="button"
                  onClick={triggerImagePicker}
                  className="aspect-[4/3] w-full rounded-lg border border-dashed border-[#d8dadc] flex flex-col items-center justify-center hover:bg-gray-50"
                  title="Añadir más imágenes"
                >
                  <Icon.Plus />
                  <span className="text-sm text-gray-600 mt-1">Añadir</span>
                </button>
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={triggerImagePicker}
                  className="mt-2 px-3 py-2 rounded-lg border border-[#d8dadc] hover:bg-gray-50"
                >
                  + Añadir imágenes
                </button>
              </div>
            </>
          )}

          {/* Campos */}
          <Input
            label="Producto"
            value={modal.draft.producto}
            onChange={(v) =>
              setModal((m) => ({ ...m, draft: { ...m.draft, producto: v } }))
            }
          />

          <Input
            label="Descripción"
            value={modal.draft.descripcion}
            onChange={(v) =>
              setModal((m) => ({ ...m, draft: { ...m.draft, descripcion: v } }))
            }
          />

          {/* Marca */}
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">Marca</span>
            <div className="relative">
              <select
                className="w-full px-3 py-2 rounded-xl border border-[#d8dadc] focus:outline-none focus:ring-2 appearance-none pr-10"
                style={{ outlineColor: "#2ca9e3" }}
                value={modal.draft.marcaId || modal.draft.marca}
                onChange={(e) =>
                  setModal((m) => ({
                    ...m,
                    draft: {
                      ...m.draft,
                      marcaId: e.target.value,
                      marca: nameById(marcas, e.target.value) || "",
                    },
                  }))
                }
              >
                <option value="">Selecciona…</option>
                {(marcas || []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                viewBox="0 0 24 24"
              >
                <path d="M7 10l5 5 5-5" fill="currentColor" />
              </svg>
            </div>
          </label>

          {/* Categoría */}
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">Categoría</span>
            <div className="relative">
              <select
                className="w-full px-3 py-2 rounded-xl border border-[#d8dadc] focus:outline-none focus:ring-2 appearance-none pr-10"
                style={{ outlineColor: "#2ca9e3" }}
                value={selectedCategoria}
                onChange={(e) => {
                  const categoriaId = e.target.value;
                  setSelectedCategoria(categoriaId);
                  setModal((m) => ({
                    ...m,
                    draft: {
                      ...m.draft,
                      categoriaId: categoriaId,
                      categoria: nameById(categorias, categoriaId) || "",
                    },
                  }));
                  listarSubcategoriaPorCategoria(categoriaId);
                }}
              >
                <option value="">Selecciona…</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                viewBox="0 0 24 24"
              >
                <path d="M7 10l5 5 5-5" fill="currentColor" />
              </svg>
            </div>
          </label>

          {/* Subcategoría */}
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">Subcategoría</span>
            <div className="relative">
              <select
                className="w-full px-3 py-2 rounded-xl border border-[#d8dadc] focus:outline-none focus:ring-2 appearance-none pr-10"
                style={{ outlineColor: "#2ca9e3" }}
                value={modal.draft.subcategoriaId || modal.draft.subcategoria}
                onChange={(e) =>
                  setModal((m) => ({
                    ...m,
                    draft: {
                      ...m.draft,
                      subcategoriaId: e.target.value,
                      subcategoria:
                        nameById(subcategorias, e.target.value) || "",
                    },
                  }))
                }
              >
                <option value="">Selecciona…</option>
                {subcategorias.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.nombre}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                viewBox="0 0 24 24"
              >
                <path d="M7 10l5 5 5-5" fill="currentColor" />
              </svg>
            </div>
          </label>
          <Input
            type="number"
            label="Precio Base (L.)"
            value={modal.draft.precioBase}
            onChange={(v) =>
              setModal((m) => ({ ...m, draft: { ...m.draft, precioBase: v } }))
            }
          />
          <Input
            label="Unidad de Medida"
            value={modal.draft.unidadMedida}
            onChange={(v) =>
              setModal((m) => ({
                ...m,
                draft: { ...m.draft, unidadMedida: v },
              }))
            }
          />
          {isEdit && (
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-700">Etiqueta</span>
              <input
                list="etiquetas_sugeridas"
                className="px-3 py-2 rounded-xl border border-[#d8dadc] focus:outline-none focus:ring-2"
                style={{ outlineColor: "#2ca9e3" }}
                value={modal.draft.etiquetasText || ""}
                onChange={(e) =>
                  setModal((m) => ({
                    ...m,
                    draft: { ...m.draft, etiquetasText: e.target.value },
                  }))
                }
                placeholder="Escribe o elige…"
              />
              <datalist id="etiquetas_sugeridas">
                <option value="Nuevo" />
                <option value="En oferta" />
              </datalist>
            </label>
          )}

          <label className="col-span-2 inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="w-5 h-5 accent-[#2b6daf]"
              checked={!!modal.draft.activo}
              onChange={(e) =>
                setModal((m) => ({
                  ...m,
                  draft: { ...m.draft, activo: e.target.checked },
                }))
              }
            />
            <span className="text-sm text-gray-700">Activo</span>
          </label>

          {/* ===== Descuentos (solo en EDITAR) ===== */}
          {/* ==================== DESCUENTOS / ESCALONADOS ==================== */}
          {/* Toggle (mutuamente excluyentes) */}
          <div className="col-span-2 border-t mt-4 pt-4">
            <div className="flex items-center gap-10">
              <label className="inline-flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-[#2b6daf]"
                  checked={!!modal.draft.descuentoGeneral}
                  onChange={(e) =>
                    setModal((m) => ({
                      ...m,
                      draft: {
                        ...m.draft,
                        descuentoGeneral: e.target.checked,
                        // si activo descuento general, apago escalonados
                        preciosEscalonados: e.target.checked
                          ? false
                          : m.draft.preciosEscalonados,
                      },
                    }))
                  }
                />
                <span className="text-sm text-gray-700">Descuento general</span>
              </label>

              <label className="inline-flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-[#2b6daf]"
                  checked={!!modal.draft.preciosEscalonados}
                  onChange={(e) =>
                    setModal((m) => ({
                      ...m,
                      draft: {
                        ...m.draft,
                        preciosEscalonados: e.target.checked,
                        // si activo escalonados, apago descuento general
                        descuentoGeneral: e.target.checked
                          ? false
                          : m.draft.descuentoGeneral,
                      },
                    }))
                  }
                />
                <span className="text-sm text-gray-700">
                  Precios escalonados
                </span>
              </label>
            </div>
          </div>

          {/* --------- Sección: Descuento general --------- */}
          {modal.draft.descuentoGeneral && (
            <div className="col-span-2 mt-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Tipo de descuento */}
                <label className="flex flex-col gap-1">
                  <span className="text-sm text-gray-700">
                    Tipo de descuento
                  </span>
                  <div className="relative">
                    <select
                      className="w-full px-3 py-2 rounded-xl border border-[#d8dadc] focus:outline-none focus:ring-2 appearance-none pr-10"
                      style={{ outlineColor: "#2ca9e3" }}
                      value={modal.draft.descuentoTipo}
                      onChange={(e) =>
                        setModal((m) => ({
                          ...m,
                          draft: { ...m.draft, descuentoTipo: e.target.value },
                        }))
                      }
                    >
                      <option value="">Selecciona...</option>
                      {DISCOUNT_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                      viewBox="0 0 24 24"
                    >
                      <path d="M7 10l5 5 5-5" fill="currentColor" />
                    </svg>
                  </div>
                </label>

                {/* Valor */}
                <label className="flex flex-col gap-1">
                  <span className="text-sm text-gray-700">Valor</span>
                  <input
                    type="number"
                    className="px-3 py-2 rounded-xl border border-[#d8dadc] focus:outline-none focus:ring-2"
                    style={{ outlineColor: "#2ca9e3" }}
                    value={modal.draft.descuentoValor}
                    onChange={(e) =>
                      setModal((m) => ({
                        ...m,
                        draft: { ...m.draft, descuentoValor: e.target.value },
                      }))
                    }
                    placeholder="Ej: 10 (o 150)"
                  />
                </label>

                {/* Válido desde */}
                <label className="flex flex-col gap-1">
                  <span className="text-sm text-gray-700">Válido desde</span>
                  <input
                    type="date"
                    className="px-3 py-2 rounded-xl border border-[#d8dadc] focus:outline-none focus:ring-2"
                    style={{ outlineColor: "#2ca9e3" }}
                    value={modal.draft.descuentoDesde}
                    onChange={(e) =>
                      setModal((m) => ({
                        ...m,
                        draft: { ...m.draft, descuentoDesde: e.target.value },
                      }))
                    }
                  />
                </label>

                {/* Hasta */}
                <label className="flex flex-col gap-1">
                  <span className="text-sm text-gray-700">Hasta</span>
                  <input
                    type="date"
                    className="px-3 py-2 rounded-xl border border-[#d8dadc] focus:outline-none focus:ring-2"
                    style={{ outlineColor: "#2ca9e3" }}
                    value={modal.draft.descuentoHasta}
                    onChange={(e) =>
                      setModal((m) => ({
                        ...m,
                        draft: { ...m.draft, descuentoHasta: e.target.value },
                      }))
                    }
                  />
                </label>
              </div>
            </div>
          )}

          {/* --------- Sección: Precios escalonados --------- */}
          {modal.draft.preciosEscalonados && (
            <div className="col-span-2 mt-4">
              {/* cabecera */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Cantidad</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Precio</span>
                </div>
              </div>

              {/* filas */}
              <div className="mt-2 space-y-2">
                {(modal.draft.escalones || []).map((row, i) => (
                  <div key={i} className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      className="px-3 py-2 rounded-xl border border-[#d8dadc] focus:outline-none focus:ring-2"
                      style={{ outlineColor: "#2ca9e3" }}
                      placeholder="Ej: 3"
                      value={row.cantidad}
                      onChange={(e) =>
                        updateEscalon(i, "cantidad", e.target.value)
                      }
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        className="flex-1 px-3 py-2 rounded-xl border border-[#d8dadc] focus:outline-none focus:ring-2"
                        style={{ outlineColor: "#2ca9e3" }}
                        placeholder="Ej: 100"
                        value={row.precio}
                        onChange={(e) =>
                          updateEscalon(i, "precio", e.target.value)
                        }
                      />
                      <button
                        type="button"
                        onClick={() => removeEscalon(i)}
                        className="px-3 rounded-xl border border-[#d8dadc] hover:bg-red-50"
                        title="Eliminar fila"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* botón agregar */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={addEscalon}
                  className="px-3 py-2 rounded-xl border border-[#d8dadc] hover:bg-gray-50 text-sm"
                >
                  + Agregar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 pt-0 flex items-center justify-end gap-2 sticky bottom-0 bg-white">
          <button
            onClick={closeModal}
            className="px-4 py-2 rounded-xl border border-[#d8dadc]"
          >
            Cancelar
          </button>
          <button
            onClick={saveModal}
            disabled={savingProduct}
            className="px-4 py-2 rounded-xl text-white disabled:opacity-60"
            style={{ backgroundColor: "#f0833e" }}
          >
            {savingProduct ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </Modal>

      {/* ========== Modal Abastecer ========== */}
      <Modal
        open={supplyModal.open}
        onClose={closeSupply}
        panelClassName="max-w-2xl"
      >
        <div
          className="px-5 py-3 rounded-t-2xl sticky top-0"
          style={{ backgroundColor: "#2b6daf" }}
        >
          <h3 className="text-white font-medium">Abastecer producto</h3>
        </div>
        {/* Galería de imágenes del producto */}
        <div className="col-span-2">
          {supplyModal.images && supplyModal.images.length > 0 ? (
            <ImageCarousel images={supplyModal.images} />
          ) : (
            <div className="w-full border border-dashed border-[#d8dadc] rounded-xl p-6 text-center text-gray-500">
              Sin imágenes para este producto
            </div>
          )}
        </div>

        <div className="px-5 pb-5 grid grid-cols-2 gap-4">
          <Input label="ID" value={supplyModal.draft.id} onChange={() => {}} />
          <Input
            label="Producto"
            value={supplyModal.draft.producto}
            onChange={() => {}}
          />

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">Marca</span>
            <div className="relative">
              <select
                className="w-full px-3 py-2 rounded-xl border border-[#d8dadc] focus:outline-none focus:ring-2 appearance-none pr-10"
                style={{ outlineColor: "#2ca9e3" }}
                value={supplyModal.draft.marca}
                onChange={(e) =>
                  setSupplyModal((m) => ({
                    ...m,
                    draft: { ...m.draft, marca: e.target.value },
                  }))
                }
              >
                <option value="">Selecciona…</option>
                {(marcas || []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                viewBox="0 0 24 24"
              >
                <path d="M7 10l5 5 5-5" fill="currentColor" />
              </svg>
            </div>
          </label>

          <Input
            type="number"
            label="Cantidad"
            value={supplyModal.draft.cantidad}
            onChange={(v) =>
              setSupplyModal((m) => ({
                ...m,
                draft: { ...m.draft, cantidad: v },
              }))
            }
          />

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">Sucursal</span>
            <div className="relative">
              <select
                className="w-full px-3 py-2 rounded-xl border border-[#d8dadc] focus:outline-none focus:ring-2 appearance-none pr-10"
                style={{ outlineColor: "#2ca9e3" }}
                value={supplyModal.draft.sucursalId}
                onChange={(e) =>
                  setSupplyModal((m) => ({
                    ...m,
                    draft: { ...m.draft, sucursalId: e.target.value },
                  }))
                }
              >
                <option value="">Selecciona…</option>
                {(sucursales || []).map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.nombre}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                viewBox="0 0 24 24"
              >
                <path d="M7 10l5 5 5-5" fill="currentColor" />
              </svg>
            </div>
          </label>
        </div>

        <div className="p-5 pt-0 flex items-center justify-end gap-2 sticky bottom-0 bg-white">
          <button
            onClick={closeSupply}
            className="px-4 py-2 rounded-xl border border-[#d8dadc]"
          >
            Cancelar
          </button>
          <button
            onClick={saveSupply}
            disabled={savingSupply}
            className="px-4 py-2 rounded-xl text-white disabled:opacity-60"
            style={{ backgroundColor: "#f0833e" }}
          >
            {savingSupply ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ---------------- Subcomponentes ---------------- */
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

function ThFilter({ label, filterKey, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState(value || "");
  const popRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (open && popRef.current && !popRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

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
                className="px-3 py-1.5 rounded-xl border border-[#d8dadc] text-sm"
              >
                Limpiar
              </button>
              <button
                onClick={apply}
                className="px-3 py-1.5 rounded-xl text-white text-sm"
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

function Input({ label, value, onChange, type = "text", disabled = false }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-gray-700">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`px-3 py-2 rounded-xl border border-[#d8dadc] focus:outline-none focus:ring-2 ${
          disabled ? "bg-gray-50 text-gray-500" : ""
        }`}
        style={{ outlineColor: "#2ca9e3" }}
      />
    </label>
  );
}

function Pagination({ page, pageCount, onPage }) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPage(page - 1)}
        className="p-2 rounded-full border border-[#d8dadc] hover:bg-gray-50"
        disabled={page === 1}
        title="Anterior"
      >
        <Icon.ChevronLeft />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className={`w-9 h-9 rounded-full border border-[#d8dadc] ${
            p === page ? "ring-2 ring-[#d8572f] text-[#d8572f]" : ""
          }`}
          title={`Página ${p}`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPage(page + 1)}
        className="p-2 rounded-full border border-[#d8dadc] hover:bg-gray-50"
        disabled={page === pageCount}
        title="Siguiente"
      >
        <Icon.ChevronRight />
      </button>
    </div>
  );
}

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
