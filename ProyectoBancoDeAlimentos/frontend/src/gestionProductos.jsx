// GestionProductos.jsx
import React, { useEffect, useState, useRef } from "react";
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
import Sidebar from "./sidebar";

/* ------------------ Botón cuadrado con borde gris ------------------ */
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

/* ------------------ Iconos SVG: lápiz y bote ------------------ */
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

/* ------------------ Uploader reutilizable ------------------ */
function ImageUploader({ label = "Imágenes", value = [], onChange }) {
  const inputRef = useRef(null);
  const [files, setFiles] = useState(value);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    return () => previews.forEach((u) => URL.revokeObjectURL(u));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPicker = () => inputRef.current?.click();

  const handleSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    const next = [...files, ...selected];
    setFiles(next);
    const nextPreviews = next.map((f) => URL.createObjectURL(f));
    setPreviews(nextPreviews);
    onChange?.(next); // entrega File[] al padre
  };

  return (
    <div className="w-full">
      {label && (
        <h3 className="text-sm font-medium text-gray-700 mb-2 text-left">
          {label}
        </h3>
      )}

      <div
        onClick={openPicker}
        className="border-2 border-dashed border-[#d8dadc] rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 hover:bg-gray-50 cursor-pointer"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
        >
          <path
            d="M12 16V8m0 0l-3 3m3-3l3 3M4 17a4 4 0 01-4-4V7a4 4 0 014-4h12a4 4 0 014 4v6a4 4 0 01-4 4H4z"
            strokeWidth="1.5"
          />
        </svg>
        <p className="text-gray-500">Haz clic para cargar</p>
        <button
          type="button"
          onClick={openPicker}
          className="px-4 py-2 rounded-xl bg-[#2b6daf] text-white font-semibold hover:brightness-110 active:scale-[.99] shadow-sm"
        >
          Cargar imágenes
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleSelect}
        />
      </div>

      {previews.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {previews.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`preview-${i}`}
              className="w-full h-20 object-cover rounded-lg border"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GestionProductos() {
  // Sidebar
  const { moveButton } = useOutletContext();
  const [showSidebar, setShowSidebar] = useState(false);

  // Producto (placeholder)
  const [producto, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [marca, setMarca] = useState("");
  const [count, setCantidad] = useState(0);

  // Categoría / Subcategoría seleccionadas
  const [categoryName, setCategoria] = useState("Granos Basicos");
  const [subName, setSubcategoria] = useState("");

  // Modales
  const [showCat, setShowCat] = useState(false);
  const [showSub, setShowSub] = useState(false);
  const [showEditCat, setShowEditCat] = useState(false);
  const [showEditSub, setShowEditSub] = useState(false);

  // Inputs crear
  const [newCategory, setNew] = useState("");
  const [newSub, setNewSub] = useState("");
  const [newCatImages, setNewCatImages] = useState([]); // File[]

  // Inputs editar
  const [editCatName, setEditCatName] = useState("");
  const [editCatId, setEditCatId] = useState(null);
  const [editCatImages, setEditCatImages] = useState([]); // File[]
  const [editSubName, setEditSubName] = useState("");
  const [editSubId, setEditSubId] = useState(null);

  // Estructura
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
          icono_categoria: c.icono_categoria,
          subcategories: [],
        }));
        setCategories(mapped);

        const selected =
          mapped.find((c) => c.name === categoryName) ||
          (mapped.length ? mapped[0] : null);

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
          icono_categoria: "default",
          subcategories: [],
        },
      ]);
    } else {
      setCategories((prev) => [
        ...prev,
        {
          id_categoria: category.id_categoria,
          name: category.nombre,
          icono_categoria: category.icono_categoria,
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

  function updateCategoryLocal(id, newName, newIcon) {
    setCategories((prev) =>
      prev.map((c) =>
        c.id_categoria === id
          ? {
              ...c,
              name: newName,
              icono_categoria: newIcon ?? c.icono_categoria,
            }
          : c
      )
    );
    if (
      categoryName &&
      categories.find((c) => c.id_categoria === id)?.name === categoryName
    ) {
      setCategoria(newName);
    }
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
    if (
      subName &&
      subName ===
        categories
          .find((c) => c.id_categoria === catId)
          ?.subcategories?.find((s) => s.id_subcategoria === subId)?.nombre
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

  /* ---------- Crear ---------- */
  async function addCat(e) {
    e.preventDefault();
    setShowCat(false);
    if (!newCategory?.trim()) return;
    try {
      // Ejemplo si luego conectas imágenes:
      // const fd = new FormData();
      // fd.append("nombre", newCategory.trim());
      // newCatImages.forEach(f => fd.append("imagenes", f));
      // await axios.post("/api/categoria", fd, { headers: {'Content-Type':'multipart/form-data'} });

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
      setNewCatImages([]);
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

  /* ---------- Editar ---------- */
  function openEditCategory(cat) {
    setEditCatId(cat.id_categoria);
    setEditCatName(cat.name);
    setEditCatImages([]);
    setShowEditCat(true);
  }

  async function submitEditCategory(e) {
    e.preventDefault();
    try {
      // Para subir imágenes: construir FormData como en addCat()
      await ActualizarCategoria(editCatId, editCatName.trim(), "default");
      updateCategoryLocal(editCatId, editCatName.trim(), "default");
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

  /* ---------- Eliminar ---------- */
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

  const addProducto = (e) => {
    e?.preventDefault?.();
    console.log("Agregar producto:", {
      producto,
      precio,
      marca,
      count,
      categoria: categoryName,
      subcategoria: subName,
    });
  };

  /* ---------- UI ---------- */
  return (
    <div
      className="bg-gray-100 w-screen pb-8"
      style={{ ...styles.fixedShell, backgroundColor: "#f3f4f6" }}
    >
      <div
        className={`transition-all duration-300 pt-4 ${
          moveButton ? "ml-[270px] mr-[70px]" : "ml-[70px] mr-[70px]"
        }`}
      >
        <h1 className="font-roboto text-[#f0833e] text-5xl pb-1 text-left">
          Gestion de Productos
        </h1>
        <hr className="h-[2px] border-0 bg-[#f0833e]" />

        <div className="pt-5 grid grid-cols-2 grid-rows-2 h-[620px] items-stretch gap-4">
          {/* Categorías */}
          <div className="col-span-1 row-span-2 bg-white w-full rounded-md items-center text-xl overflow-y-auto p-2">
            <h1 className="relative px-2 font-roboto text-black text-4xl pb-1 text-left">
              Categorias
              <button
                onClick={() => setShowCat(true)}
                className="absolute right-0"
                title="Agregar categoría"
              >
                <span className="material-symbols-outlined text-5xl">add</span>
              </button>
            </h1>
            <hr className="border-0 h-[2px] bg-black" />
            <ul className="flex flex-col mt-4">
              {categories.map((cat, i) => (
                <li key={cat.id_categoria ?? i}>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSelectCategory(cat)}
                      className={`list-item ${
                        categoryName === cat.name
                          ? "bg-orange-100 border-orange-500"
                          : "hover:bg-orange-100 hover:border-orange-500"
                      }`}
                    >
                      {cat.name}
                    </button>

                    <IconSquareButton
                      onClick={() => openEditCategory(cat)}
                      title="Editar categoría"
                      aria-label="Editar categoría"
                    >
                      <PencilIcon className="w-6 h-6 text-sky-500" />
                    </IconSquareButton>

                    <IconSquareButton
                      onClick={() => deleteCategory(cat)}
                      title="Eliminar categoría"
                      aria-label="Eliminar categoría"
                    >
                      <TrashIcon className="w-6 h-6 text-red-500" />
                    </IconSquareButton>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Subcategorías */}
          <div className="grid grid-cols-1 grid-rows-2 h-[600px] items-stretch gap-8">
            <div className="col-span-1 row-span-2 bg-white w-full rounded-md items-center text-xl overflow-y-auto p-2">
              <h1 className="relative px-2 font-roboto text-black text-4xl pb-1 text-left">
                Subcategorias
                <button
                  onClick={() => setShowSub(true)}
                  className="absolute right-0"
                  title="Agregar subcategoría"
                >
                  <span className="material-symbols-outlined text-5xl">
                    add
                  </span>
                </button>
              </h1>
              <hr className="border-0 h-[2px] bg-black" />
              <ul className="flex flex-col mt-4">
                {(
                  categories.find((c) => c.name === categoryName)
                    ?.subcategories || []
                ).map((sub, i) => (
                  <li key={sub.id_subcategoria ?? i}>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSubcategoria(sub.nombre)}
                        className={`list-item ${
                          subName === sub.nombre
                            ? "bg-orange-100 border-orange-500"
                            : "hover:bg-orange-100 hover:border-orange-500"
                        }`}
                      >
                        {sub.nombre}
                      </button>

                      <IconSquareButton
                        onClick={() => openEditSubcategory(sub)}
                        title="Editar subcategoría"
                        aria-label="Editar subcategoría"
                      >
                        <PencilIcon className="w-6 h-6 text-sky-500" />
                      </IconSquareButton>

                      <IconSquareButton
                        onClick={() => deleteSubcategory(sub)}
                        title="Eliminar subcategoría"
                        aria-label="Eliminar subcategoría"
                      >
                        <TrashIcon className="w-6 h-6 text-red-500" />
                      </IconSquareButton>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------ Modales: Crear ------------------ */}
      <div className="flex items-center justify-center">
        {showCat && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-[680px] relative animate-fadeIn overflow-hidden">
              <div className="bg-[#2b6daf] px-5 py-3">
                <h2 className="text-xl font-bold text-white">
                  Agregar Categoria
                </h2>
              </div>

              <form className="grid grid-cols-2 gap-6 p-6" onSubmit={addCat}>
                {/* Uploader (reemplaza Icono) */}
                <div className="col-span-2">
                  <ImageUploader
                    label="Imágenes / Icono de la categoría"
                    value={[]}
                    onChange={setNewCatImages}
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
                    className="px-4 py-2 rounded-xl bg-[#e96803] text-white font-semibold hover:brightness-110 active:scale-[.99] shadow-sm"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showSub && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-[520px] relative animate-fadeIn overflow-hidden">
              <div className="bg-[#2b6daf] px-5 py-3">
                <h2 className="text-xl font-bold text-white">
                  Agregar Subcategoria
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
                    className="px-4 py-2 rounded-xl bg-[#e96803] text-white font-semibold hover:brightness-110 active:scale-[.99] shadow-sm"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ------------------ Modales: Editar ------------------ */}
      {showEditCat && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-[680px] relative animate-fadeIn overflow-hidden">
            <div className="bg-[#2b6daf] px-5 py-3">
              <h2 className="text-xl font-bold text-white">Editar Categoria</h2>
            </div>

            <form
              className="grid grid-cols-2 gap-6 p-6"
              onSubmit={submitEditCategory}
            >
              <div className="col-span-2">
                <ImageUploader
                  label="Imágenes / Icono de la categoría"
                  value={[]}
                  onChange={setEditCatImages}
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
                  className="px-4 py-2 rounded-xl bg-[#e96803] text-white font-semibold hover:brightness-110 active:scale-[.99] shadow-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditSub && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-[520px] relative animate-fadeIn overflow-hidden">
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
                  className="px-4 py-2 rounded-xl bg-[#e96803] text-white font-semibold hover:brightness-110 active:scale-[.99] shadow-sm"
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

export default GestionProductos;
