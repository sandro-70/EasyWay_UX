// ReportesInventario.jsx
import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import FiltroIcon from "../images/filtro.png";
import MonedaIcon from "../images/moneda.png";
import NotiIcon from "../images/noti.png";

export default function ReportesInventario() {
  const paginas = [
    [
      { code: "001", product: "Bananas", category: "Fruta", subcategory: "Dulce", stock: 12, movimiento: "Entrada", estado: "Activo" },
      { code: "002", product: "Manzanas", category: "Fruta", subcategory: "Ácida", stock: 20, movimiento: "Salida", estado: "Activo" },
      { code: "003", product: "Leche", category: "Lácteos", subcategory: "Entera", stock: 15, movimiento: "Entrada", estado: "Activo" },
      { code: "004", product: "Pan", category: "Panadería", subcategory: "Integral", stock: 25, movimiento: "Salida", estado: "Activo" },
      { code: "005", product: "Arroz", category: "Cereales", subcategory: "Blanco", stock: 50, movimiento: "Entrada", estado: "Activo" },
      { code: "006", product: "Pollo", category: "Carnes", subcategory: "Fresco", stock: 10, movimiento: "Salida", estado: "Activo" },
      { code: "007", product: "Queso", category: "Lácteos", subcategory: "Mozzarella", stock: 8, movimiento: "Entrada", estado: "Activo" },
    ],
    [
      { code: "008", product: "Tomate", category: "Verdura", subcategory: "Rojo", stock: 18, movimiento: "Entrada", estado: "Activo" },
      { code: "009", product: "Pepino", category: "Verdura", subcategory: "Verde", stock: 22, movimiento: "Salida", estado: "Activo" },
      { code: "010", product: "Yogurt", category: "Lácteos", subcategory: "Natural", stock: 30, movimiento: "Entrada", estado: "Activo" },
      { code: "011", product: "Huevos", category: "Lácteos", subcategory: "Blanco", stock: 60, movimiento: "Entrada", estado: "Activo" },
      { code: "012", product: "Cereal", category: "Cereales", subcategory: "Integral", stock: 40, movimiento: "Salida", estado: "Activo" },
      { code: "013", product: "Carne de Res", category: "Carnes", subcategory: "Molida", stock: 12, movimiento: "Entrada", estado: "Activo" },
      { code: "014", product: "Jamon", category: "Carnes", subcategory: "Ahumado", stock: 10, movimiento: "Salida", estado: "Activo" },
    ],
    [
      { code: "015", product: "Lechuga", category: "Verdura", subcategory: "Hoja", stock: 35, movimiento: "Entrada", estado: "Activo" },
      { code: "016", product: "Zanahoria", category: "Verdura", subcategory: "Naranja", stock: 28, movimiento: "Salida", estado: "Activo" },
      { code: "017", product: "Pasta", category: "Cereales", subcategory: "Espagueti", stock: 45, movimiento: "Entrada", estado: "Activo" },
      { code: "018", product: "Mantequilla", category: "Lácteos", subcategory: "Salada", stock: 20, movimiento: "Entrada", estado: "Activo" },
      { code: "019", product: "Pechuga de Pollo", category: "Carnes", subcategory: "Fresco", stock: 14, movimiento: "Salida", estado: "Activo" },
      { code: "020", product: "Pan de Molde", category: "Panadería", subcategory: "Blanco", stock: 30, movimiento: "Entrada", estado: "Activo" },
      { code: "021", product: "Mango", category: "Fruta", subcategory: "Dulce", stock: 25, movimiento: "Entrada", estado: "Activo" },
    ],
  ];

  const [paginaActual, setPaginaActual] = useState(0);
  const [filtro, setFiltro] = useState("Todos"); 
  const rows = paginas[paginaActual];

  const filasFiltradas = [...rows].sort((a, b) => {
    if (filtro === "Más vendidos") return b.stock - a.stock;
    if (filtro === "Menos vendidos") return a.stock - b.stock;
    return 0; 
  });

  const handleIzquierda = () => {
    setPaginaActual((prev) => (prev === 0 ? paginas.length - 1 : prev - 1));
  };

  const handleDerecha = () => {
    setPaginaActual((prev) => (prev === paginas.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex flex-col justify-start items-center pt-10">
      {/* Icono notificaciones */}
      <img
        src={NotiIcon}
        alt="Notificaciones"
        className="absolute top-4 right-10 w-8 h-8 cursor-pointer hover:scale-110 transition-transform duration-200"
        onClick={() => alert("No hay notificaciones de momento")}
      />

      {/* Contenedor principal */}
      <div className="relative w-full max-w-[900px] mx-auto">
        {/* Título con línea decorativa igual al ancho de la tabla */}
        <div className="mb-6 w-full">
          <h1 className="text-3xl font-semibold text-orange-500 pb-2 text-left">
            Reportes de Inventario
          </h1>
<div className="h-0.5 w-[128%] bg-orange-500 mt-1 rounded mx-[-1%]"></div>
        </div>

        {/* Controles superiores */}
<div className="flex items-center justify-between mt-6 mb-6 flex-wrap gap-4">
  <div className="flex items-center gap-4">
    <div className="bg-white border border-gray-200 rounded-md px-2 py-2 flex items-center gap-2 shadow-sm">
      <img src={FiltroIcon} alt="Filtro" className="w-5 h-5" />
      <span className="font-bold text-sm">Filtro</span>
      <select
        className="appearance-none border-l border-gray-200 pl-2 pr-4 py-1 text-sm bg-white"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      >
        <option>Todos</option>
        <option>Más vendidos</option>
        <option>Menos vendidos</option>
      </select>
    </div>

    <div className="bg-white border border-gray-200 rounded-md px-3 py-3 flex items-center gap-2 shadow-sm h-full">
  <img src={MonedaIcon} alt="Moneda" className="w-5 h-5" />
  <div className="text-sm flex-1 flex items-center">
    Valor total de inventario:{" "}
    <span className="font-semibold text-green-600 ml-1">$110,000.00</span>
  </div>
</div>
  </div>
</div>

        {/* Flechas */}
        <button
          className="absolute left-[-40px] top-[315px] transform -translate-y-1/2"
          onClick={handleIzquierda}
        >
          <ChevronLeft size={30} color="#2B6DAF" />
        </button>
        <button
          className="absolute right-[-200px] top-[315px] transform -translate-y-1/2"
          onClick={handleDerecha}
        >
          <ChevronRight size={30} color="#2B6DAF" />
        </button>

      {/* Tabla centralizada */}
<table className="table-auto w-full border border-black rounded-lg border-collapse text-center">
  <thead>
    <tr className="border-b border-black">
      <th className="px-4 py-2 bg-[#2B6DAF] text-white text-center border-r border-white rounded-tl-lg">ID de producto</th>
      <th className="px-4 py-2 bg-[#2B6DAF] text-white text-center border-r border-white">Producto</th>
      <th className="px-4 py-2 bg-[#2B6DAF] text-white text-center border-r border-white">Categoría</th>
      <th className="px-4 py-2 bg-[#2B6DAF] text-white text-center border-r border-white">Subcategoría</th>
      <th className="px-4 py-2 bg-[#2B6DAF] text-white text-center border-r border-white">Stock</th>
      <th className="px-4 py-2 bg-[#2B6DAF] text-white text-center border-r border-white">Entrada/Salida</th>
      <th className="px-4 py-2 bg-[#2B6DAF] text-white text-center rounded-tr-lg">Estado</th>
    </tr>
  </thead>
  <tbody>
    {filasFiltradas.map((r, idx) => (
      <tr key={idx} className="border-b border-black last:border-b-0">
        <td className="px-4 py-2 text-center border-black rounded-bl-lg">{r.code}</td>
        <td className="px-4 py-2 text-center border-black">{r.product}</td>
        <td className="px-4 py-2 text-center border-black">{r.category}</td>
        <td className="px-4 py-2 text-center border-black">{r.subcategory}</td>
        <td className="px-4 py-2 text-center border-black">{r.stock}</td>
        <td className="px-4 py-2 text-center border-black">{r.movimiento}</td>
        <td className="px-4 py-2 text-center border-black rounded-br-lg">{r.estado}</td>
      </tr>
    ))}
  </tbody>
</table>

      </div>
    </div>
  );
}
