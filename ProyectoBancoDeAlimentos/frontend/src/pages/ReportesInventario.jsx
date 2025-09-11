// ReportesInventario.jsx
import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const rows = paginas[paginaActual];

  const handleIzquierda = () => {
    setPaginaActual((prev) => (prev === 0 ? paginas.length - 1 : prev - 1));
  };

  const handleDerecha = () => {
    setPaginaActual((prev) => (prev === paginas.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="w-screen min-h-screen bg-gray-50 p-6 flex justify-center">
      <div className="w-full max-w-[1400px] relative">
        {/* Título */}
        <h1 className="text-3xl font-semibold text-orange-500 mb-4 border-b border-orange-500 pb-2 text-left">
          Reportes de Inventario
        </h1>

        {/* Controles superiores */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <select className="appearance-none bg-white border border-gray-200 rounded-md py-2 px-3 pr-8 text-sm shadow-sm">
                <option>Filtro</option>
                <option>Más vendidos</option>
                <option>Menos vendidos</option>
              </select>
            </div>

            <div className="bg-white border border-gray-200 rounded-md px-3 py-2 flex items-center gap-2 shadow-sm">
              <div className="text-sm">
                Valor total de inventario:{" "}
                <span className="font-semibold text-green-600">$110,000.00</span>
              </div>
            </div>
          </div>
        </div>

  {/* Flechas izquierda y derecha, sin fondo, azul */}
<button
  className="absolute left-[-30px] top-[41%] transform -translate-y-1/2"
  onClick={handleIzquierda}
>
  <ChevronLeft size={30} color="#2B6DAF" />
</button>
<button
  className="absolute right-[-30px] top-[41%] transform -translate-y-1/2"
  onClick={handleDerecha}
>
  <ChevronRight size={30} color="#2B6DAF" />
</button>


   {/* Tabla de inventario */}
<div className="w-full overflow-x-auto relative">
  <table className="table-auto w-full border border-black rounded-lg border-collapse">
    <thead>
      <tr>
        <th className="px-6 py-3 text-left bg-[#2B6DAF] text-white relative">
          <span>ID de Producto</span>
          <div className="absolute top-1/4 right-0 h-1/2 w-px bg-white"></div>
        </th>
        <th className="px-6 py-3 text-left bg-[#2B6DAF] text-white relative">
          <span>Producto</span>
          <div className="absolute top-1/4 right-0 h-1/2 w-px bg-white"></div>
        </th>
        <th className="px-6 py-3 text-left bg-[#2B6DAF] text-white relative">
          <span>Categoría</span>
          <div className="absolute top-1/4 right-0 h-1/2 w-px bg-white"></div>
        </th>
        <th className="px-6 py-3 text-left bg-[#2B6DAF] text-white relative">
          <span>Subcategoría</span>
          <div className="absolute top-1/4 right-0 h-1/2 w-px bg-white"></div>
        </th>
        <th className="px-6 py-3 text-left bg-[#2B6DAF] text-white relative">
          <span>Stock</span>
          <div className="absolute top-1/4 right-0 h-1/2 w-px bg-white"></div>
        </th>
        <th className="px-6 py-3 text-left bg-[#2B6DAF] text-white relative">
          <span>Entrada/Salida</span>
          <div className="absolute top-1/4 right-0 h-1/2 w-px bg-white"></div>
        </th>
        <th className="px-6 py-3 text-left bg-[#2B6DAF] text-white">
          Estado
        </th>
      </tr>
    </thead>
    <tbody>
      {rows.map((r, idx) => (
        <tr key={idx} className="text-left border-b border-black last:border-b-0">
          <td className="px-6 py-2 border-r border-black">{r.code}</td>
          <td className="px-6 py-2 border-r border-black">{r.product}</td>
          <td className="px-6 py-2 border-r border-black">{r.category}</td>
          <td className="px-6 py-2 border-r border-black">{r.subcategory}</td>
          <td className="px-6 py-2 border-r border-black">{r.stock}</td>
          <td className="px-6 py-2 border-r border-black">{r.movimiento}</td>
          <td className="px-6 py-2 border-black">{r.estado}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
      </div>
    </div>
  );
}

