import { useState, useMemo } from "react"; // 👈 añade useMemo

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

const pedidosData = [
  { id: "123456", fecha: "12/04/2024", estado: "En curso" },
  { id: "123457", fecha: "08/04/2024", estado: "Entregado" },
  { id: "123458", fecha: "06/04/2024", estado: "Entregado" },
  { id: "123426", fecha: "04/04/2024", estado: "Entregado" },
  { id: "123436", fecha: "02/04/2024", estado: "Entregado" },
  { id: "123437", fecha: "01/04/2024", estado: "Entregado" },
  { id: "123438", fecha: "30/03/2024", estado: "Entregado" },
  { id: "123439", fecha: "28/03/2024", estado: "Entregado" },
  { id: "123440", fecha: "26/03/2024", estado: "En curso" },
];

export default function HistorialPedido() {
  const [filtro, setFiltro] = useState("fecha");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

  const handleOpenModal = (pedidoId) => {
    setPedidoSeleccionado(pedidoId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPedidoSeleccionado(null);
  };

  // Lógica de ordenamiento
  const pedidosOrdenados = useMemo(() => {
    const data = [...pedidosData];

    return data.sort((a, b) => {
      if (filtro === "estado") {
        // Priorizar 'En curso' sobre 'Entregado'
        const estadoA = a.estado === "En curso" ? 0 : 1;
        const estadoB = b.estado === "En curso" ? 0 : 1;
        return estadoA - estadoB;
      } else {
        // dd/mm/yyyy -> Date (más reciente primero)
        const [diaA, mesA, anioA] = a.fecha.split("/");
        const [diaB, mesB, anioB] = b.fecha.split("/");
        const fechaA = new Date(+anioA, +mesA - 1, +diaA);
        const fechaB = new Date(+anioB, +mesB - 1, +diaB);
        return fechaB - fechaA;
      }
    });
  }, [filtro]);

  return (
    <div
      className="w-[90vw] bg-[#f9fafb] min-h-screen"
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
      {/* Título */}
      <div className="mx-auto px-4 mb-8">
        <h1
          className="text-4xl font-bold tracking-wide text-center mb-3"
          style={{ color: "#d8572f" }}
        >
          Historial de pedidos
        </h1>
        <div className="flex items-center gap-3 rounded-t-2xl bg-white p-1">
          <div className="h-1.5 w-full rounded-md bg-[#f0833e]" />
        </div>
      </div>
      {/* Caja de pedidos - Más ancha */}
      <div className="mt-4 overflow-hidden rounded-2xl shadow-lg border border-[#d8dadc] bg-white ">
        {/* Header azul */}
        <div
          className="flex items-center justify-between px-8 py-4 text-white rounded-t-2xl"
          style={{ backgroundColor: "#2b6daf" }}
        >
          <span className="font-semibold text-lg">Historial de pedidos</span>

          <div className="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white text-2xl"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="text-black rounded-lg px-3 py-2 text-sm border-none focus:ring-2 focus:ring-[#ffac77]"
            >
              <option value="fecha">Ordenar por fecha</option>
              <option value="estado">Ordenar por estado</option>
            </select>
          </div>
        </div>

        {/* Lista de pedidos con diseño vertical */}
        <div className="divide-y divide-[#d8dadc]">
          {pedidosOrdenados.map((pedido) => (
            <div
              key={pedido.id}
              className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
              onClick={() => handleOpenModal(pedido.id)}
            >
              <div className="flex flex-col">
                <span className="font-semibold text-gray-800">
                  Pedido #{pedido.id}
                </span>
                <span className="text-sm text-gray-500 mt-1">
                  {pedido.fecha}
                </span>
              </div>
              <div>
                <span
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    pedido.estado === "En curso"
                      ? "bg-[#2ca9e3] text-white"
                      : "bg-gray-300 text-gray-700"
                  }`}
                >
                  {pedido.estado}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Pie de tabla con paginación */}
        <div className="flex justify-between items-center px-8 py-4 bg-gray-100 border-t border-[#d8dadc]">
          <div className="text-sm text-gray-600">
            Mostrando {pedidosOrdenados.length} de {pedidosData.length} pedidos
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 rounded-md bg-white border border-[#d8dadc] text-gray-700 hover:bg-gray-50">
              Anterior
            </button>
            <button className="px-3 py-1 rounded-md bg-[#2b6daf] text-white">
              1
            </button>
            <button className="px-3 py-1 rounded-md bg-white border border-[#d8dadc] text-gray-700 hover:bg-gray-50">
              2
            </button>
            <button className="px-3 py-1 rounded-md bg-white border border-[#d8dadc] text-gray-700 hover:bg-gray-50">
              3
            </button>
            <button className="px-3 py-1 rounded-md bg-white border border-[#d8dadc] text-gray-700 hover:bg-gray-50">
              Siguiente
            </button>
          </div>
        </div>
      </div>
      s{/* Modal - Condicionalmente renderizado */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-2xl overflow-hidden">
            {/* Header del modal */}
            <div className="bg-[#2b6daf] text-white p-4 text-center rounded-t-lg">
              <h2 className="font-semibold text-lg">
                Pedido #{pedidoSeleccionado}
              </h2>
            </div>

            {/* Contenido del modal (la tabla de productos) */}
            <div className="p-6">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-center text-lg font-bold text-black-700 border-r border-gray-200">
                      Código
                    </th>
                    <th className="px-4 py-2 text-center text-lg font-bold text-black-700 border-r border-gray-00">
                      Nombre del producto
                    </th>
                    <th className="px-4 py-2 text-center text-lg font-bold text-black-700">
                      Cantidad
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-2">0001</td>
                    <td className="px-4 py-2">Leche</td>
                    <td className="px-4 py-2">2</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-2">0002</td>
                    <td className="px-4 py-2">Avena</td>
                    <td className="px-4 py-2">5</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-2">0003</td>
                    <td className="px-4 py-2">Miel</td>
                    <td className="px-4 py-2">1</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-2">0004</td>
                    <td className="px-4 py-2">Azúcar</td>
                    <td className="px-4 py-2">2</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer del modal con botones */}
            <div className="flex justify-end p-4 border-t border-gray-200 space-x-3">
              <button
                className="px-4 py-2 rounded-md font-semibold text-white transition-colors duration-200"
                style={{ backgroundColor: "#f0833e" }}
              >
                Reordenar
              </button>
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-md font-semibold text-white transition-colors duration-200"
                style={{ backgroundColor: "#2ca9e3" }}
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
