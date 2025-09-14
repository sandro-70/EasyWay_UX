// ReportesInventario.jsx
import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import FiltroIcon from "../images/filtro.png";
import MonedaIcon from "../images/moneda.png";
import axios from "axios";

export default function ReportesInventario() {
  const [filas, setFilas] = useState([]);
  const [valorInventario, setValorInventario] = useState(0);
  const [filtro, setFiltro] = useState("Todos");
  const [paginaActual, setPaginaActual] = useState(0);
  const filasPorPagina = 7;

  // Traer auditorías según filtro
  const fetchAuditorias = async () => {
    try {
      let url = "/api/auditorias";
      if (filtro === "Más vendidos")
        url = "/api/auditorias/filtrarCantidadMayor";
      if (filtro === "Menos vendidos")
        url = "/api/auditorias/filtrarCantidadMenor";

      const { data } = await axios.get(url);
      setFilas(data);
      setPaginaActual(0); // reset paginación al cambiar filtro
    } catch (error) {
      console.error("Error al traer auditorías:", error);
    }
  };

  // Traer valor total del inventario
  const fetchValorInventario = async () => {
    try {
      const { data } = await axios.get("/api/auditorias/valorTotalInventario");
      setValorInventario(data.valor_total);
    } catch (error) {
      console.error("Error al traer valor de inventario:", error);
    }
  };

  useEffect(() => {
    fetchAuditorias();
    fetchValorInventario();
  }, [filtro]);

  // Paginación
  const paginas = [];
  for (let i = 0; i < filas.length; i += filasPorPagina) {
    paginas.push(filas.slice(i, i + filasPorPagina));
  }
  const filasFiltradas = paginas[paginaActual] || [];

  const handleIzquierda = () => {
    setPaginaActual((prev) => (prev === 0 ? paginas.length - 1 : prev - 1));
  };

  const handleDerecha = () => {
    setPaginaActual((prev) => (prev === paginas.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="px-4 flex flex-col items-center absolute left-0 right-0 w-full">
      <div className="flex flex-col justify-start items-center pt-10 w-full max-w-[900px]">
        {/* Título */}
        <div className="mb-6 w-full">
          <h1 className="text-3xl font-semibold text-orange-500 pb-2 text-left">
            Reportes de Inventario
          </h1>
          <div className="h-0.5 w-[128%] bg-orange-500 mt-1 rounded mx-[-1%]"></div>
        </div>

        {/* Controles */}
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
                <span className="font-semibold text-green-600 ml-1">
                  ${valorInventario.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Flechas de paginación */}
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

        {/* Tabla */}
        <table className="table-auto w-full border border-black rounded-lg border-collapse text-center">
          <thead>
            <tr className="border-b border-black">
              <th className="px-4 py-2 bg-[#2B6DAF] text-white border-r border-white rounded-tl-lg">
                ID de producto
              </th>
              <th className="px-4 py-2 bg-[#2B6DAF] text-white border-r border-white">
                Producto
              </th>
              <th className="px-4 py-2 bg-[#2B6DAF] text-white border-r border-white">
                Categoría
              </th>
              <th className="px-4 py-2 bg-[#2B6DAF] text-white border-r border-white">
                Subcategoría
              </th>
              <th className="px-4 py-2 bg-[#2B6DAF] text-white border-r border-white">
                Cantidad
              </th>
              <th className="px-4 py-2 bg-[#2B6DAF] text-white border-r border-white">
                Entrada/Salida
              </th>
              <th className="px-4 py-2 bg-[#2B6DAF] text-white rounded-tr-lg">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {filasFiltradas.length > 0 ? (
              filasFiltradas.map((r, idx) => (
                <tr key={idx} className="border-b border-black last:border-b-0">
                  <td className="px-4 py-2 text-center border-black rounded-bl-lg">
                    {r.id_producto}
                  </td>
                  <td className="px-4 py-2 text-center border-black">
                    {r.nombre_producto}
                  </td>
                  <td className="px-4 py-2 text-center border-black">
                    {r.categoria}
                  </td>
                  <td className="px-4 py-2 text-center border-black">
                    {r.subcategoria}
                  </td>
                  <td className="px-4 py-2 text-center border-black">
                    {r.cantidad}
                  </td>
                  <td className="px-4 py-2 text-center border-black">
                    {r.operacion}
                  </td>
                  <td className="px-4 py-2 text-center border-black rounded-br-lg">
                    {r.estado_producto}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">
                  No hay registros de auditoría
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
