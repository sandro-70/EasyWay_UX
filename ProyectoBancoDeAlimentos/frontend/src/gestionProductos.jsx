// GestionProductos.jsx
import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  ListarCategoria,
  CrearCategoria,
  ActualizarCategoria,
  DesactivarProductosDeCategoria, // usar como "eliminar" categoría (desactiva productos y la quitamos del UI)
} from "./api/CategoriaApi";
import {
  listarPorCategoria,
  crearSubcategoria,
  actualizarSubcategoria,
  desactivarSubcategoria,
} from "./api/SubcategoriaApi";
import "./gestionProductos.css";
import Sidebar from "./sidebar";

function GestionProductos() {
  //Sidebar
  const { moveButton, setMoveButton } = useOutletContext();
  const [showSidebar, setShowSidebar] = useState(false);

  //Info del producto a agregar (placeholder)
  const [producto, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [marca, setMarca] = useState("");
  const [count, setCantidad] = useState(0);

  //Categoria y subcategorias seleccionadas
  const [categoryName, setCategoria] = useState("Granos Basicos");
  const [subName, setSubcategoria] = useState("");

  //Modales (crear)
  const [showCat, setShowCat] = useState(false);
  const [showSub, setShowSub] = useState(false);

  //Modales (editar)
  const [showEditCat, setShowEditCat] = useState(false);
  const [showEditSub, setShowEditSub] = useState(false);

  //Inputs modal (crear)
  const [newCategory, setNew] = useState("");
  const [newSub, setNewSub] = useState("");

  //Inputs modal (editar)
  const [editCatName, setEditCatName] = useState("");
  const [editCatId, setEditCatId] = useState(null);
  const [editCatIcon, setEditCatIcon] = useState("default");

  const [editSubName, setEditSubName] = useState("");
  const [editSubId, setEditSubId] = useState(null);

  // Estructura interna: [{ id_categoria, name, icono_categoria, subcategories: [{id_subcategoria, nombre}] }]
  const [categories, setCategories] = useState([]);

  // ==========================
  // Carga inicial de categorías
  // ==========================
  useEffect(() => {
    (async () => {
      try {
        const res = await ListarCategoria();
        const data = Array.isArray(res?.data) ? res.data : [];
        const mapped = data.map((c) => ({
          id_categoria: c.id_categoria,
          name: c.nombre,
          icono_categoria: c.icono_categoria,
          subcategories: [], // se carga aparte
        }));
        setCategories(mapped);

        // Selección por defecto
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

  // Cargar subcategorías para una categoría
  async function loadSubcategories(id_categoria) {
    try {
      const res = await listarPorCategoria(id_categoria);
      const subs = Array.isArray(res?.data) ? res.data : [];
      // Guardamos objetos (id + nombre) para poder editar/eliminar
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

  // ==========================
  // Helpers locales
  // ==========================
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
    // Si se elimina la seleccionada, seleccionar otra
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

  // ==========================
  // Crear categoría / subcategoría
  // ==========================
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
        // fallback local
        addCategoryLocal(newCategory.trim());
        setCategoria(newCategory.trim());
      }
      setNew("");
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
      // Algunas APIs devuelven el objeto creado; si no, reconsultamos.
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

  // ==========================
  // Editar categoría / subcategoría
  // ==========================
  function openEditCategory(cat) {
    setEditCatId(cat.id_categoria);
    setEditCatName(cat.name);
    setEditCatIcon(cat.icono_categoria || "default");
    setShowEditCat(true);
  }

  async function submitEditCategory(e) {
    e.preventDefault();
    try {
      await ActualizarCategoria(
        editCatId,
        editCatName.trim(),
        editCatIcon || "default"
      );
      updateCategoryLocal(
        editCatId,
        editCatName.trim(),
        editCatIcon || "default"
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

  // ==========================
  // Eliminar categoría / subcategoría
  // ==========================
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

  // Util para click en categoría (set + cargar subcategorías)
  const handleSelectCategory = async (cat) => {
    setCategoria(cat.name);
    if (!cat?.id_categoria) return;
    await loadSubcategories(cat.id_categoria);
  };

  // Placeholder (producto)
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

  // ==========================
  // UI (diseño intacto)
  // ==========================
  return (
    <div
      className="bg-gray-100 w-screen pb-8 "
      style={{ ...styles.fixedShell, backgroundColor: "#f3f4f6" }}
    >
      <div
        className={` transition-all duration-300 pt-4 ${
          moveButton ? "ml-[270px] mr-[70px]" : "ml-[70px] mr-[70px]"
        }`}
      >
        <h1 className="font-roboto text-[#f0833e] text-5xl justify-center pb-1 text-left">
          Gestion de Productos
        </h1>
        <hr className="bg-[#f0833e] h-[2px]"></hr>
        <div className="">
          <div className=" pt-5 grid grid-cols-2 grid-rows-2 h-[620px] items-stretch gap-4">
            {/* Categorías */}
            <div className=" col-span-1 row-span-2 bg-white w-full rounded-md items-center text-xl overflow-y-auto p-2">
              <h1 className="relative px-2 font-roboto text-gray-500 text-4xl pb-1 text-left">
                Categorias
                <button
                  onClick={() => setShowCat(true)}
                  className="absolute right-0"
                >
                  <span class="material-symbols-outlined text-5xl">add</span>
                </button>
              </h1>
              <hr className="bg-gray-500 h-[2px]"></hr>
              <ul className="flex flex-col mt-4">
                {categories.map((cat, i) => (
                  <li key={cat.id_categoria ?? i}>
                    <div className="flex">
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
                      <button
                        className="border-2 hover:bg-orange-100 hover:border-orange-500 rounded-md p-1"
                        onClick={() => openEditCategory(cat)}
                        title="Editar categoría"
                      >
                        <span class="material-symbols-outlined text-3xl">
                          edit_square
                        </span>
                      </button>
                      <button
                        className="border-2 hover:bg-orange-100 hover:border-orange-500 rounded-md p-1"
                        onClick={() => deleteCategory(cat)}
                        title="Eliminar categoría"
                      >
                        <span class="material-symbols-outlined text-3xl">
                          delete
                        </span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Subcategorías */}
            <div className="grid grid-cols-1 grid-rows-2 h-[600px] items-stretch gap-8">
              <div className=" col-span-1 row-span-2 bg-white w-full rounded-md items-center text-xl overflow-y-auto p-2">
                <h1 className="relative px-2 font-roboto text-gray-500 text-4xl pb-1 text-left">
                  Subcategorias
                  <button
                    onClick={() => setShowSub(true)}
                    className="absolute right-0"
                  >
                    <span class="material-symbols-outlined text-5xl">add</span>
                  </button>
                </h1>
                <hr className="bg-gray-500 h-[2px]"></hr>
                <ul className="flex flex-col mt-4">
                  {(
                    categories.find((c) => c.name === categoryName)
                      ?.subcategories || []
                  ).map((sub, i) => (
                    <li key={sub.id_subcategoria ?? i}>
                      <div className="flex">
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
                        <button
                          className="border-2 hover:bg-orange-100 hover:border-orange-500 rounded-md p-1"
                          onClick={() => openEditSubcategory(sub)}
                          title="Editar subcategoría"
                        >
                          <span class="material-symbols-outlined text-3xl">
                            edit_square
                          </span>
                        </button>
                        <button
                          className="border-2 hover:bg-orange-100 hover:border-orange-500 rounded-md p-1"
                          onClick={() => deleteSubcategory(sub)}
                          title="Eliminar subcategoría"
                        >
                          <span class="material-symbols-outlined text-3xl">
                            delete
                          </span>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales Crear */}
      <div className=" flex items-center justify-center bg-gray-100">
        {showCat && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-md shadow-lg w-96  relative animate-fadeIn">
              <h2 className="bg-[#2b6daf] text-xl rounded-md font-bold p-2 text-center text-white mb-6">
                Agregar Categoria
              </h2>

              <form
                className="flex flex-col space-y-4 pr-6 pl-6 pb-8"
                onSubmit={addCat}
              >
                <div>
                  <p className="text-[18px]">Nombre</p>
                  <input
                    type="text"
                    placeholder=""
                    className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setNew(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-8">
                  <button
                    onClick={() => setShowCat(false)}
                    className="text-white py-2 w-1/2 bg-red-600 rounded-lg"
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className=" bg-blue-600 text-white py-2 w-1/2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Agregar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showSub && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-md shadow-lg w-96  relative animate-fadeIn">
              <h2 className="bg-[#2b6daf] text-xl rounded-md font-bold p-2 text-center text-white mb-6">
                Agregar Subcategoria
              </h2>

              <form
                className="flex flex-col space-y-4 pr-6 pl-6 pb-8"
                onSubmit={addSubcat}
              >
                <div>
                  <p className="text-[18px]">Nombre</p>
                  <input
                    type="text"
                    placeholder=""
                    className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setNewSub(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-8">
                  <button
                    onClick={() => setShowSub(false)}
                    className="text-white py-2 w-1/2 bg-red-600 rounded-lg"
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className=" bg-blue-600 text-white py-2 w-1/2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Agregar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Modales Editar */}
      {showEditCat && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-md shadow-lg w-96  relative animate-fadeIn">
            <h2 className="bg-[#2b6daf] text-xl rounded-md font-bold p-2 text-center text-white mb-6">
              Editar Categoria
            </h2>
            <form
              className="flex flex-col space-y-4 pr-6 pl-6 pb-8"
              onSubmit={submitEditCategory}
            >
              <div>
                <p className="text-[18px]">Nombre</p>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  required
                />
              </div>
              <div>
                <p className="text-[18px]">Icono (opcional)</p>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editCatIcon}
                  onChange={(e) => setEditCatIcon(e.target.value)}
                />
              </div>
              <div className="flex gap-8">
                <button
                  onClick={() => setShowEditCat(false)}
                  className="text-white py-2 w-1/2 bg-red-600 rounded-lg"
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className=" bg-blue-600 text-white py-2 w-1/2 rounded-lg hover:bg-blue-700 transition"
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
          <div className="bg-white rounded-md shadow-lg w-96  relative animate-fadeIn">
            <h2 className="bg-[#2b6daf] text-xl rounded-md font-bold p-2 text-center text-white mb-6">
              Editar Subcategoria
            </h2>
            <form
              className="flex flex-col space-y-4 pr-6 pl-6 pb-8"
              onSubmit={submitEditSubcategory}
            >
              <div>
                <p className="text-[18px]">Nombre</p>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editSubName}
                  onChange={(e) => setEditSubName(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-8">
                <button
                  onClick={() => setShowEditSub(false)}
                  className="text-white py-2 w-1/2 bg-red-600 rounded-lg"
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className=" bg-blue-600 text-white py-2 w-1/2 rounded-lg hover:bg-blue-700 transition"
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
