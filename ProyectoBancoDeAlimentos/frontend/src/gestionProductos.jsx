// GestionProductos.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  ListarCategoria,
  CrearCategoria,
  ActualizarCategoria,
  DesactivarProductosDeCategoria,
} from "./api/CategoriaApi";
import {
  listarPorCategoria,
  crearSubcategoria,
  actualizarSubcategoria,
  desactivarSubcategoria,
} from "./api/SubcategoriaApi";
import "./gestionProductos.css";

/* ===================== Iconos y botones reutilizables ===================== */
const IconSquareButton = ({ children, className = "", ...props }) => (
  <button
    {...props}
    type="button"
    className={
      "w-12 h-12 rounded-2xl border border-[#d8dadc] bg-white " +
      "flex items-center justify-center shadow-[0_1px_0_rgba(0,0,0,.03)] " +
      "hover:bg-gray-50 hover:border-gray-400 active:scale-[.98] transition " +
      className
    }
  >
    {children}
  </button>
);

const PencilIcon = ({ className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M16.86 4.49l2.65 2.65M5 19l2.12-.53c.36-.09.69-.28.95-.54l8.4-8.4a1.5 1.5 0 10-2.12-2.12l-8.4 8.4c-.26.26-.45.59-.54.95L5 19z" />
  </svg>
);

const TrashIcon = ({ className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 10v8M14 10v8" />
  </svg>
);

const MagnifierIcon = ({ className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-3.8-3.8" />
  </svg>
);

const PlusIcon = ({ className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const ChevronLeftIcon = ({ className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ChevronRightIcon = ({ className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 6l6 6-6 6" />
  </svg>
);

/* ===================== Uploader 1 imagen (si lo necesitas en modales) ===================== */
function SingleImageUploader({ label = "Imagen", valueUrl = "", onFiles }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(valueUrl || "");
  useEffect(() => setPreview(valueUrl || ""), [valueUrl]);
  const openPicker = () => inputRef.current?.click();
  const handleSelect = (e) => {
    const file = (e.target.files || [])[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onFiles?.(file);
  };
  return (
    <div className="w-full">
      {label && (
        <h3 className="text-sm font-medium text-gray-700 mb-2 text-left">
          {label}
        </h3>
      )}
      <div
        className={
          "rounded-2xl border " +
          (preview
            ? "border-[#d8dadc] p-3"
            : "border-2 border-dashed border-[#d8dadc] p-8")
        }
      >
        {preview ? (
          <div className="relative">
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-gray-100">
              <img
                src={preview}
                alt="preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={openPicker}
                className="px-4 py-2 rounded-xl bg-[#2b6daf] text-white font-semibold hover:brightness-110 shadow-sm"
              >
                Cambiar imagen
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={openPicker}
            className="flex flex-col items-center justify-center text-center gap-3 hover:bg-gray-50 cursor-pointer rounded-xl"
          >
            <MagnifierIcon className="w-10 h-10" />
            <p className="text-gray-500">Haz clic para cargar</p>
            <button
              type="button"
              onClick={openPicker}
              className="px-4 py-2 rounded-xl bg-[#2b6daf] text-white font-semibold hover:brightness-110 shadow-sm"
            >
              Cargar imagen
            </button>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleSelect}
        />
      </div>
    </div>
  );
}

/* ===================== Tarjeta tipo tabla (header azul, filas, paginación) ===================== */
function TableCard({
  title = "Categoría",
  items = [],
  pageSize = 6,
  onSelect,
  onEdit,
  onDelete,
  onClickAdd,
  height = 560, // <--- alto fijo para simetría (px)
}) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);

  // ancho fijo de la columna de iconos (coincide con el header "Opciones")
  const ICON_COL_PX = 132;

  useEffect(() => {
    if (showSearch) setTimeout(() => searchRef.current?.focus(), 0);
  }, [showSearch]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((it) =>
      (it?.name || it?.nombre || "").toString().toLowerCase().includes(s)
    );
  }, [items, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [filtered, page, totalPages]);

  const slice = filtered.slice((page - 1) * pageSize, page * pageSize);
  const label = (it) => it?.name ?? it?.nombre ?? "";

  const PageBtn = ({ active, children, onClick, disabled }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        "w-9 h-9 rounded-full border flex items-center justify-center " +
        (active
          ? "border-[#e96803] text-[#e96803] font-semibold"
          : "border-[#d8dadc] text-gray-700 hover:bg-gray-50") +
        (disabled ? " opacity-50 cursor-not-allowed" : "")
      }
    >
      {children}
    </button>
  );

  return (
    <div
      className="rounded-[22px] overflow-hidden border border-[#d8dadc] bg-white flex flex-col min-h-0 shadow-sm"
      style={{ height }} // <--- mismo alto en ambas tablas
    >
      {/* Header: 2 columnas -> izquierda (título + lupa), derecha (Opciones + +) */}
      <div className="bg-[#2b6daf] text-white rounded-t-[22px]">
        <div
          className="px-4 py-3 grid items-center"
          style={{ gridTemplateColumns: `1fr ${ICON_COL_PX}px` }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{title}</span>
            <button
              type="button"
              title="Buscar"
              onClick={() => setShowSearch((s) => !s)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <MagnifierIcon className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Opciones</span>
            {onClickAdd && (
              <button
                type="button"
                onClick={onClickAdd}
                title={`Agregar ${title.toLowerCase()}`}
                className="ml-2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-[#2b6daf] flex items-center justify-center"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Buscador desplegable (por la lupa) */}
      {showSearch && (
        <div className="px-4 py-2 border-b border-[#e6e8ea] bg-white">
          <input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Buscar ${title.toLowerCase()}…`}
            className="w-full px-3 py-2 rounded-lg border border-[#d8dadc] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Lista */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#e6e8ea]">
        {slice.map((it, i) => (
          <div
            key={it.id ?? it.id_categoria ?? it.id_subcategoria ?? i}
            className="flex items-center justify-between px-4 py-5"
          >
            <button
              type="button"
              onClick={() => onSelect?.(it)}
              className="text-[20px] font-normal text-gray-900 text-left hover:underline" // <--- SIN negrita
            >
              {label(it)}
            </button>

            {/* Columna fija de iconos, alineada bajo “Opciones” */}
            <div
              className="flex gap-3 justify-end"
              style={{ width: ICON_COL_PX }}
            >
              <IconSquareButton title="Editar" onClick={() => onEdit?.(it)}>
                <PencilIcon className="w-6 h-6 text-sky-500" />
              </IconSquareButton>
              <IconSquareButton title="Eliminar" onClick={() => onDelete?.(it)}>
                <TrashIcon className="w-6 h-6 text-red-500" />
              </IconSquareButton>
            </div>
          </div>
        ))}
        {slice.length === 0 && (
          <div className="px-4 py-10 text-center text-gray-500">
            Sin resultados
          </div>
        )}
      </div>

      {/* Paginación */}
      <div className="px-4 py-3 border-t border-[#e6e8ea] flex justify-center gap-2">
        <PageBtn
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </PageBtn>
        {Array.from({ length: totalPages })
          .slice(0, 5)
          .map((_, idx) => {
            const n = idx + 1;
            return (
              <PageBtn key={n} onClick={() => setPage(n)} active={page === n}>
                {n}
              </PageBtn>
            );
          })}
        <PageBtn
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          <ChevronRightIcon className="w-5 h-5" />
        </PageBtn>
      </div>
    </div>
  );
}

/* ===================== Principal ===================== */
function GestionProductos() {
  const { moveButton } = useOutletContext();

  // Selecciones
  const [categoryName, setCategoria] = useState("Granos Basicos");
  const [subName, setSubcategoria] = useState("");

  // Modales
  const [showCat, setShowCat] = useState(false);
  const [showSub, setShowSub] = useState(false);
  const [showEditCat, setShowEditCat] = useState(false);
  const [showEditSub, setShowEditSub] = useState(false);

  // Inputs crear
  const [newCategory, setNew] = useState("");
  const [newCatFile, setNewCatFile] = useState(null);
  const [newSub, setNewSub] = useState("");

  // Inputs editar
  const [editCatName, setEditCatName] = useState("");
  const [editCatId, setEditCatId] = useState(null);
  const [editCatFile, setEditCatFile] = useState(null);
  const [editSubName, setEditSubName] = useState("");
  const [editSubId, setEditSubId] = useState(null);

  // Datos
  const [categories, setCategories] = useState([]);

  /* ---------- Carga inicial ---------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await ListarCategoria();
        const data = Array.isArray(res?.data) ? res.data : [];
        const mapped = data.map((c) => ({
          id_categoria: c.id_categoria,
          name: c.nombre,
          icono_categoria: c.icono_categoria || "",
          subcategories: [],
        }));
        setCategories(mapped);

        const selected =
          mapped.find((c) => c.name === categoryName) || mapped[0];
        if (selected) {
          setCategoria(selected.name);
          await loadSubcategories(selected.id_categoria);
        }
      } catch (e) {
        console.error("Error cargando categorías:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSubcategories(id_categoria) {
    try {
      const res = await listarPorCategoria(id_categoria);
      const subs = Array.isArray(res?.data) ? res.data : [];
      const subsObjs = subs.map((s) => ({
        id_subcategoria: s.id_subcategoria,
        nombre: s.nombre,
      }));

      setCategories((prev) =>
        prev.map((c) =>
          c.id_categoria === id_categoria
            ? { ...c, subcategories: subsObjs }
            : c
        )
      );
      setSubcategoria("");
    } catch (e) {
      console.error("Error cargando subcategorías:", e);
    }
  }

  /* ---------- Helpers locales ---------- */
  function addCategoryLocal(category) {
    if (typeof category === "string") {
      setCategories((prev) => [
        ...prev,
        {
          id_categoria: undefined,
          name: category,
          icono_categoria: "",
          subcategories: [],
        },
      ]);
    } else {
      setCategories((prev) => [
        ...prev,
        {
          id_categoria: category.id_categoria,
          name: category.nombre,
          icono_categoria: category.icono_categoria || "",
          subcategories: [],
        },
      ]);
    }
  }

  function addSubCategoryLocal(newSubObj) {
    setCategories((prevCat) =>
      prevCat.map((cat) =>
        cat.name === categoryName
          ? { ...cat, subcategories: [...(cat.subcategories || []), newSubObj] }
          : cat
      )
    );
  }

  function updateCategoryLocal(id, newName, newIconUrl) {
    setCategories((prev) =>
      prev.map((c) =>
        c.id_categoria === id
          ? {
              ...c,
              name: newName ?? c.name,
              icono_categoria: newIconUrl ?? c.icono_categoria,
            }
          : c
      )
    );
    const wasSelected =
      categories.find((c) => c.id_categoria === id)?.name === categoryName;
    if (wasSelected && newName) setCategoria(newName);
  }

  function removeCategoryLocal(id) {
    setCategories((prev) => prev.filter((c) => c.id_categoria !== id));
    if (categories.find((c) => c.id_categoria === id)?.name === categoryName) {
      const remaining = categories.filter((c) => c.id_categoria !== id);
      if (remaining.length) {
        setCategoria(remaining[0].name);
        loadSubcategories(remaining[0].id_categoria);
      } else {
        setCategoria("");
        setSubcategoria("");
      }
    }
  }

  function updateSubcategoryLocal(catId, subId, newName) {
    setCategories((prev) =>
      prev.map((c) =>
        c.id_categoria === catId
          ? {
              ...c,
              subcategories: c.subcategories.map((s) =>
                s.id_subcategoria === subId ? { ...s, nombre: newName } : s
              ),
            }
          : c
      )
    );
    const current = categories.find((c) => c.id_categoria === catId);
    if (
      subName &&
      subName ===
        current?.subcategories?.find((s) => s.id_subcategoria === subId)?.nombre
    ) {
      setSubcategoria(newName);
    }
  }

  function removeSubcategoryLocal(catId, subId) {
    setCategories((prev) =>
      prev.map((c) =>
        c.id_categoria === catId
          ? {
              ...c,
              subcategories: c.subcategories.filter(
                (s) => s.id_subcategoria !== subId
              ),
            }
          : c
      )
    );
    const currentCat = categories.find((c) => c.id_categoria === catId);
    const removedName = currentCat?.subcategories?.find(
      (s) => s.id_subcategoria === subId
    )?.nombre;
    if (removedName && removedName === subName) setSubcategoria("");
  }

  /* ---------- CRUD llamadas ---------- */
  async function addCat(e) {
    e.preventDefault();
    setShowCat(false);
    if (!newCategory?.trim()) return;
    try {
      const res = await CrearCategoria(newCategory.trim(), "default");
      const created = res?.data;
      if (created) {
        addCategoryLocal(created);
        setCategoria(created.nombre);
        await loadSubcategories(created.id_categoria);
      } else {
        addCategoryLocal(newCategory.trim());
        setCategoria(newCategory.trim());
      }
      setNew("");
      setNewCatFile(null);
    } catch (e) {
      console.error("Error creando categoría:", e);
      alert(
        e?.response?.data?.error ||
          e?.response?.data?.msg ||
          "No se pudo crear la categoría"
      );
    }
  }

  async function addSubcat(e) {
    e.preventDefault();
    setShowSub(false);
    if (!newSub?.trim()) return;
    try {
      const cat = categories.find((c) => c.name === categoryName);
      if (!cat?.id_categoria) {
        addSubCategoryLocal({
          id_subcategoria: Date.now(),
          nombre: newSub.trim(),
        });
        setNewSub("");
        return;
      }
      const res = await crearSubcategoria(newSub.trim(), cat.id_categoria);
      const createdId = res?.data?.id_subcategoria;
      addSubCategoryLocal({
        id_subcategoria: createdId ?? Date.now(),
        nombre: newSub.trim(),
      });
      setNewSub("");
    } catch (e) {
      console.error("Error creando subcategoría:", e);
      alert(
        e?.response?.data?.error ||
          e?.response?.data?.msg ||
          "No se pudo crear la subcategoría"
      );
    }
  }

  function openEditCategory(cat) {
    setEditCatId(cat.id_categoria);
    setEditCatName(cat.name);
    setEditCatFile(null);
    setShowEditCat(true);
  }

  async function submitEditCategory(e) {
    e.preventDefault();
    try {
      const before = categories.find((c) => c.id_categoria === editCatId);
      await ActualizarCategoria(editCatId, editCatName.trim(), "default");
      updateCategoryLocal(
        editCatId,
        editCatName.trim(),
        before?.icono_categoria
      );
      setShowEditCat(false);
    } catch (e) {
      console.error("Error actualizando categoría:", e);
      alert(
        e?.response?.data?.error ||
          e?.response?.data?.msg ||
          "No se pudo actualizar"
      );
    }
  }

  function openEditSubcategory(sub) {
    setEditSubId(sub.id_subcategoria);
    setEditSubName(sub.nombre);
    setShowEditSub(true);
  }

  async function submitEditSubcategory(e) {
    e.preventDefault();
    try {
      const cat = categories.find((c) => c.name === categoryName);
      if (!cat?.id_categoria || !editSubId) return;
      await actualizarSubcategoria(
        editSubId,
        editSubName.trim(),
        cat.id_categoria
      );
      updateSubcategoryLocal(cat.id_categoria, editSubId, editSubName.trim());
      setShowEditSub(false);
    } catch (e) {
      console.error("Error actualizando subcategoría:", e);
      alert(
        e?.response?.data?.error ||
          e?.response?.data?.msg ||
          "No se pudo actualizar"
      );
    }
  }

  async function deleteCategory(cat) {
    if (
      !window.confirm(
        `¿Eliminar la categoría "${cat.name}"? Esto desactivará sus productos.`
      )
    )
      return;
    try {
      await DesactivarProductosDeCategoria(cat.id_categoria);
      removeCategoryLocal(cat.id_categoria);
    } catch (e) {
      console.error("Error eliminando categoría:", e);
      alert(
        e?.response?.data?.error ||
          e?.response?.data?.msg ||
          "No se pudo eliminar"
      );
    }
  }

  async function deleteSubcategory(sub) {
    if (!window.confirm(`¿Eliminar la subcategoría "${sub.nombre}"?`)) return;
    try {
      await desactivarSubcategoria(sub.id_subcategoria);
      const cat = categories.find((c) => c.name === categoryName);
      if (cat?.id_categoria)
        removeSubcategoryLocal(cat.id_categoria, sub.id_subcategoria);
    } catch (e) {
      console.error("Error eliminando subcategoría:", e);
      alert(
        e?.response?.data?.error ||
          e?.response?.data?.msg ||
          "No se pudo eliminar"
      );
    }
  }

  const handleSelectCategory = async (cat) => {
    setCategoria(cat.name);
    if (!cat?.id_categoria) return;
    await loadSubcategories(cat.id_categoria);
  };

  const selectedCategory =
    categories.find((c) => c.name === categoryName) || null;

  /* ---------- Render ---------- */
  return (
    <div
      className="bg-gray-100 w-screen pb-8"
      style={{ position: "absolute", top: "90px", left: 0, right: 0 }}
    >
      <div
        className={`transition-all duration-300 pt-4 ${
          moveButton ? "ml-[270px] mr-[70px]" : "ml-[70px] mr-[70px]"
        }`}
      >
        <h1 className="text-2xl font-semibold text-[#f0833e] text-4xl pb-1 text-left">
          Gestion de Productos
        </h1>
        <hr className="h-[3px] border-0 bg-[#f0833e]" />

        {/* Dos tarjetas lado a lado, como tu diseño */}
        <div className="pt-5 grid grid-cols-2 gap-8">
          <div>
            <TableCard
              title="Categoría"
              items={categories.map((c) => ({
                id: c.id_categoria,
                name: c.name,
              }))}
              onSelect={(it) =>
                handleSelectCategory({ id_categoria: it.id, name: it.name })
              }
              onEdit={(it) => {
                const cat = categories.find((c) => c.id_categoria === it.id);
                if (cat) openEditCategory(cat);
              }}
              onDelete={(it) => {
                const cat = categories.find((c) => c.id_categoria === it.id);
                if (cat) deleteCategory(cat);
              }}
              onClickAdd={() => setShowCat(true)} // <--- el botón "+" abre agregar categoría
              pageSize={6}
            />
          </div>

          <div>
            <TableCard
              title="Subcategoría"
              items={(selectedCategory?.subcategories || []).map((s) => ({
                id: s.id_subcategoria,
                name: s.nombre,
              }))}
              onSelect={(it) => setSubcategoria(it.name)}
              onEdit={(it) =>
                openEditSubcategory({ id_subcategoria: it.id, nombre: it.name })
              }
              onDelete={(it) =>
                deleteSubcategory({ id_subcategoria: it.id, nombre: it.name })
              }
              onClickAdd={() => setShowSub(true)} // <--- el botón "+" abre agregar subcategoría
              pageSize={6}
            />
          </div>
        </div>
      </div>

      {/* ------------------ Modal: Crear Categoría ------------------ */}
      {showCat && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-[680px] overflow-hidden">
            <div className="bg-[#2b6daf] px-5 py-3">
              <h2 className="text-xl font-bold text-white">
                Agregar Categoría
              </h2>
            </div>
            <form className="grid grid-cols-2 gap-6 p-6" onSubmit={addCat}>
              <div className="col-span-2">
                <SingleImageUploader
                  label="Imagen de la categoría (1)"
                  valueUrl=""
                  onFiles={(file) => setNewCatFile(file)}
                />
              </div>
              <div className="col-span-2">
                <label
                  htmlFor="nombreCat"
                  className="block text-sm font-medium text-gray-700 text-left"
                >
                  Nombre
                </label>
                <input
                  id="nombreCat"
                  type="text"
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setNew(e.target.value)}
                  required
                />
              </div>
              <div className="col-span-2 mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCat(false)}
                  className="px-4 py-2 rounded-xl border border-[#d8dadc] text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#e96803] text-white font-semibold hover:brightness-110 shadow-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------ Modal: Crear Subcategoría ------------------ */}
      {showSub && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-[520px] overflow-hidden">
            <div className="bg-[#2b6daf] px-5 py-3">
              <h2 className="text-xl font-bold text-white">
                Agregar Subcategoría
              </h2>
            </div>
            <form className="p-6" onSubmit={addSubcat}>
              <label
                htmlFor="nombreSub"
                className="block text-sm font-medium text-gray-700 text-left"
              >
                Nombre
              </label>
              <input
                id="nombreSub"
                type="text"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setNewSub(e.target.value)}
                required
              />
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSub(false)}
                  className="px-4 py-2 rounded-xl border border-[#d8dadc] text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#e96803] text-white font-semibold hover:brightness-110 shadow-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------ Modal: Editar Categoría ------------------ */}
      {showEditCat && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-[680px] overflow-hidden">
            <div className="bg-[#2b6daf] px-5 py-3">
              <h2 className="text-xl font-bold text-white">Editar Categoria</h2>
            </div>
            <form
              className="grid grid-cols-2 gap-6 p-6"
              onSubmit={submitEditCategory}
            >
              <div className="col-span-2">
                <SingleImageUploader
                  label="Imagen de la categoría (1)"
                  valueUrl={
                    categories.find((c) => c.id_categoria === editCatId)
                      ?.icono_categoria || ""
                  }
                  onFiles={(file) => setEditCatFile(file)}
                />
              </div>
              <div className="col-span-2">
                <label
                  htmlFor="editNombreCat"
                  className="block text-sm font-medium text-gray-700 text-left"
                >
                  Nombre
                </label>
                <input
                  id="editNombreCat"
                  type="text"
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  required
                />
              </div>
              <div className="col-span-2 mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditCat(false)}
                  className="px-4 py-2 rounded-xl border border-[#d8dadc] text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#e96803] text-white font-semibold hover:brightness-110 shadow-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------ Modal: Editar Subcategoría ------------------ */}
      {showEditSub && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-[520px] overflow-hidden">
            <div className="bg-[#2b6daf] px-5 py-3">
              <h2 className="text-xl font-bold text-white">
                Editar Subcategoria
              </h2>
            </div>
            <form className="p-6" onSubmit={submitEditSubcategory}>
              <label
                htmlFor="editNombreSub"
                className="block text-sm font-medium text-gray-700 text-left"
              >
                Nombre
              </label>
              <input
                id="editNombreSub"
                type="text"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editSubName}
                onChange={(e) => setEditSubName(e.target.value)}
                required
              />
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditSub(false)}
                  className="px-4 py-2 rounded-xl border border-[#d8dadc] text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#e96803] text-white font-semibold hover:brightness-110 shadow-sm"
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

export default GestionProductos;
