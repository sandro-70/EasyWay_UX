// src/pages/Inventario.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import Sidebar from "./sidebar";
import frutas from "./images/frutas_asignarDescuento.png";
import { Switch, Slider } from "@mui/material";
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

const PageSize = 8;

const initialData = [
  {
    id: "001",
    producto: "Bananas",
    marca: "Fruta",
    categoria: "Dulce",
    subcategoria: "Dulce",
    stockKg: 107,
    precioBase: 80,
    precioVenta: 98,
  },
  {
    id: "002",
    producto: "Manzanas",
    marca: "Fruta",
    categoria: "Ácida",
    subcategoria: "Roja",
    stockKg: 65,
    precioBase: 120,
    precioVenta: 145,
  },
  {
    id: "003",
    producto: "Peras",
    marca: "Fruta",
    categoria: "Dulce",
    subcategoria: "Verde",
    stockKg: 50,
    precioBase: 110,
    precioVenta: 135,
  },
  {
    id: "004",
    producto: "Bananas",
    marca: "Fruta",
    categoria: "Dulce",
    subcategoria: "Dulce",
    stockKg: 107,
    precioBase: 80,
    precioVenta: 98,
  },
  {
    id: "005",
    producto: "Bananas",
    marca: "Fruta",
    categoria: "Dulce",
    subcategoria: "Dulce",
    stockKg: 107,
    precioBase: 80,
    precioVenta: 98,
  },
  {
    id: "006",
    producto: "Bananas",
    marca: "Fruta",
    categoria: "Dulce",
    subcategoria: "Dulce",
    stockKg: 107,
    precioBase: 80,
    precioVenta: 98,
  },
  {
    id: "007",
    producto: "Bananas",
    marca: "Fruta",
    categoria: "Dulce",
    subcategoria: "Dulce",
    stockKg: 107,
    precioBase: 80,
    precioVenta: 98,
  },
  {
    id: "008",
    producto: "Bananas",
    marca: "Fruta",
    categoria: "Dulce",
    subcategoria: "Dulce",
    stockKg: 107,
    precioBase: 80,
    precioVenta: 98,
  },
  {
    id: "009",
    producto: "Bananas",
    marca: "Fruta",
    categoria: "Dulce",
    subcategoria: "Dulce",
    stockKg: 107,
    precioBase: 80,
    precioVenta: 98,
  },
  {
    id: "010",
    producto: "Bananas",
    marca: "Fruta",
    categoria: "Dulce",
    subcategoria: "Dulce",
    stockKg: 107,
    precioBase: 80,
    precioVenta: 98,
  },
  {
    id: "011",
    producto: "Bananas",
    marca: "Fruta",
    categoria: "Dulce",
    subcategoria: "Dulce",
    stockKg: 107,
    precioBase: 80,
    precioVenta: 98,
  },
];

function emptyDraft() {
  return {
    id: "",
    producto: "",
    marca: "",
    categoria: "",
    subcategoria: "",
    stockKg: 0,
    precioBase: 0,
    precioVenta: 0,
  };
}

// Íconos SVG
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

export default function AsignarDescuentos() {
  const handleClick = () => {
    setLeft(!moveButton);
    setShowSidebar(!showSidebar);
  };

  const [moveButton, setLeft] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const [rows, setRows] = useState(initialData);

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

  // Filtros
  const filtered = useMemo(() => {
    const f = (t) => t.toString().toLowerCase();
    return rows.filter(
      (r) =>
        f(r.id).includes(f(filters.id)) &&
        f(r.producto).includes(f(filters.producto)) &&
        f(r.marca).includes(f(filters.marca)) &&
        f(r.categoria).includes(f(filters.categoria)) &&
        f(r.subcategoria).includes(f(filters.subcategoria))
    );
  }, [rows, filters]);

  // Ordenamiento
  const sorted = useMemo(() => {
    if (!sort.key) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const va = a[sort.key];
      const vb = b[sort.key];
      if (typeof va === "number" && typeof vb === "number") {
        return sort.dir === "asc" ? va - vb : vb - va;
      }
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

  // Funciones
  function toggleSort(key) {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }

  function openAdd() {
    setModal({ open: true, mode: "add", draft: emptyDraft() });
  }
  function openEdit(row) {
    setModal({ open: true, mode: "edit", draft: { ...row } });
  }
  function closeModal() {
    setModal((m) => ({ ...m, open: false }));
  }
  function saveModal() {
    const d = modal.draft;
    if (!d.id || !d.producto) return;
    if (modal.mode === "add") {
      setRows((r) => [
        {
          ...d,
          stockKg: +d.stockKg,
          precioBase: +d.precioBase,
          precioVenta: +d.precioVenta,
        },
        ...r,
      ]);
    } else {
      setRows((r) =>
        r.map((x) =>
          x.id === d.id
            ? {
                ...d,
                stockKg: +d.stockKg,
                precioBase: +d.precioBase,
                precioVenta: +d.precioVenta,
              }
            : x
        )
      );
    }
    closeModal();
  }
  function removeRow(id) {
    if (window.confirm("¿Eliminar este registro?")) {
      setRows((r) => r.filter((x) => x.id !== id));
    }
  }
  const [checked, setChecked] = useState(false);

  return (
    <div
      className="bg-gray-100 w-screen flex flex-col px-12"
      style={{
        position: "absolute",
        top: "145px",
        left: 0,
        right: 0,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div className="flex flex-row gap-4">
        <div className="">
          {showSidebar && <Sidebar />}
          <button
            onClick={handleClick}
            className={`btn_sidebar ${moveButton ? "left-[186px]" : "left-2"}`}
          >
            <span className="material-symbols-outlined text-[42px] text-white">
              menu
            </span>
          </button>
        </div>
        <div
          className={`flex flex-col w-full pt-4 transition-all duration-300 w-full p-6 ${
            showSidebar ? "ml-48" : "ml-0"
          }`}
        >
          <h1
            className="text-4xl font-semibold tracking-wide flex  justify-between "
            style={{ color: "#d8572f" }}
          >
            Asignar Descuentos
          </h1>
          <hr className="h-1 mt-2 w-full rounded-md bg-[#f0833e]"></hr>
          <div className="w-full flex flex-row gap-8  mt-4">
            {/* ancho completo sin max-w para visualizar toda la tabla */}

            <div className=" ">
              <div className=" overflow-hidden rounded-2xl shadow-sm border border-[#d8dadc] bg-white">
                <div className="overflow-x-auto">
                  <table className=" text-sm table-auto w-[400px]">
                    <thead className="">
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
                          className="w-32"
                        />
                        <Th
                          label="Precio Base"
                          sortKey="precioBase"
                          sort={sort}
                          onSort={toggleSort}
                          className="w-28"
                        />
                        <Th
                          label="Precio Venta"
                          sortKey="precioVenta"
                          sort={sort}
                          onSort={toggleSort}
                          className="w-28"
                        />
                        <th className="px-3 py-2 text-left w-36 bg-[#2B6DAF]">
                          Opciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((r, idx) => (
                        <tr
                          key={r.id + idx}
                          className="border-b last:border-0 border-[#d8dadc]"
                        >
                          <td className="px-3 py-3">{r.id}</td>
                          <td className="px-3 py-3">{r.producto}</td>
                          <td className="px-3 py-3">{r.marca}</td>
                          <td className="px-3 py-3">{r.categoria}</td>
                          <td className="px-3 py-3">{r.subcategoria}</td>
                          <td className="px-3 py-3">{r.stockKg} kg.</td>
                          <td className="px-3 py-3">L. {r.precioBase}</td>
                          <td className="px-3 py-3">L. {r.precioVenta}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={openAdd}
                                className="p-2 rounded-xl border border-[#d8dadc] hover:bg-[#ffac77]/30"
                                title="Agregar"
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
                                className="p-2 rounded-xl border border-[#d8dadc] hover:bg-red-50"
                                title="Eliminar"
                              >
                                <Icon.Trash className="text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {pageItems.length === 0 && (
                        <tr>
                          <td
                            colSpan={9}
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

            {/* Modal */}
            {modal.open && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-black/40"
                  onClick={closeModal}
                />
                <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl border border-[#d8dadc]">
                  <div
                    className="px-5 py-3 rounded-t-2xl"
                    style={{ backgroundColor: "#2b6daf" }}
                  >
                    <h3 className="text-white font-medium">
                      {modal.mode === "add"
                        ? "Agregar producto"
                        : "Editar producto"}
                    </h3>
                  </div>

                  <div className="p-5 grid grid-cols-2 gap-4">
                    <Input
                      label="ID"
                      value={modal.draft.id}
                      onChange={(v) =>
                        setModal((m) => ({
                          ...m,
                          draft: { ...m.draft, id: v },
                        }))
                      }
                    />
                    <Input
                      label="Producto"
                      value={modal.draft.producto}
                      onChange={(v) =>
                        setModal((m) => ({
                          ...m,
                          draft: { ...m.draft, producto: v },
                        }))
                      }
                    />
                    <Input
                      label="Marca"
                      value={modal.draft.marca}
                      onChange={(v) =>
                        setModal((m) => ({
                          ...m,
                          draft: { ...m.draft, marca: v },
                        }))
                      }
                    />
                    <Input
                      label="Categoría"
                      value={modal.draft.categoria}
                      onChange={(v) =>
                        setModal((m) => ({
                          ...m,
                          draft: { ...m.draft, categoria: v },
                        }))
                      }
                    />
                    <Input
                      label="Subcategoría"
                      value={modal.draft.subcategoria}
                      onChange={(v) =>
                        setModal((m) => ({
                          ...m,
                          draft: { ...m.draft, subcategoria: v },
                        }))
                      }
                    />
                    <Input
                      type="number"
                      label="Stock (kg)"
                      value={modal.draft.stockKg}
                      onChange={(v) =>
                        setModal((m) => ({
                          ...m,
                          draft: { ...m.draft, stockKg: v },
                        }))
                      }
                    />
                    <Input
                      type="number"
                      label="Precio Base (L.)"
                      value={modal.draft.precioBase}
                      onChange={(v) =>
                        setModal((m) => ({
                          ...m,
                          draft: { ...m.draft, precioBase: v },
                        }))
                      }
                    />
                    <Input
                      type="number"
                      label="Precio Venta (L.)"
                      value={modal.draft.precioVenta}
                      onChange={(v) =>
                        setModal((m) => ({
                          ...m,
                          draft: { ...m.draft, precioVenta: v },
                        }))
                      }
                    />
                  </div>

                  <div className="p-5 pt-0 flex items-center justify-end gap-2">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 rounded-xl border border-[#d8dadc]"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveModal}
                      className="px-4 py-2 rounded-xl text-white"
                      style={{ backgroundColor: "#f0833e" }}
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col bg-white shadow-2xl w-[300px] h-[630px] rounded-3xl px-2 py-4 text-left space-y-2">
              <h1 className="font-bold text-2xl text-center">Vista Previa</h1>
              <img src={frutas}></img>
              <p className="text-[#80838A] text-xl">Nombre producto</p>
              <p className="text-[#80838A] line-through text-xl">$35.00</p>
              <div className="flex flex-row gap-4">
                <p className="text-2xl text-[#009900] font-extrabold">$24.50</p>{" "}
                <p className="bg-red-500 p-1 rounded-full text-white font-bold text-lg">
                  30% OFF
                </p>
              </div>
              <div className="flex flex-row gap-4 pt-4">
                <p className="text-xl">Tipo de descuento</p>
                <Switch
                  checked={checked}
                  onChange={() => setChecked(!checked)}
                  sx={{
                    "& .Mui-checked": {
                      color: "orange", // circle color
                    },
                    "& .Mui-checked + .MuiSwitch-track": {
                      backgroundColor: "orange", // track color
                      opacity: 1,
                    },
                  }}
                />
              </div>
              <div className="flex flex-row gap-10 pt-4 ">
                <p className="text-xl">Porcentaje</p>{" "}
                <p className="text-xl">Monto Fijo</p>
              </div>
              <div className="flex flex-row gap-8 pt-4">
                <p className="text-md">Ajustar %</p>
                <Slider
                  defaultValue={50}
                  min={10}
                  max={100}
                  step={5}
                  valueLabelDisplay="auto"
                  className=""
                  sx={{
                    width: 130,
                    color: "green", // color of the active track
                    "& .MuiSlider-thumb": {
                      backgroundColor: "white",
                    },
                    "& .MuiSlider-rail": {
                      opacity: 1,
                      backgroundColor: "#D4D3D2",
                    },
                    "& .MuiSlider-track": {
                      backgroundColor: "blue",
                      border: "#D4D3D2",
                    },
                  }}
                />
              </div>
              <button className="mt-auto p-2 bg-orange-500 rounded-full text-white font-bold">
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
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
        className="p-2 rounded-full border border-[#d8dadc] hover:bg-gray-50"
        disabled={page === pageCount}
        title="Siguiente"
      >
        <Icon.ChevronRight />
      </button>
    </div>
  );
}
