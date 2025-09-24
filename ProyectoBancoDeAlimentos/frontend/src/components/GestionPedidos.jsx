import React, { useEffect, useMemo, useState } from "react";
import {
  getPedidosConDetalles,
  getEstados,
  actualizarEstadoPedido,
  } from '../api/PedidoApi'; 

// Iconitos inline para no depender de librerías
const IconEye = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconEdit = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
  </svg>
);
const IconChevron = ({ open }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    {open ? <path d="M18 15l-6-6-6 6" /> : <path d="M6 9l6 6 6-6" />}
  </svg>
);

export default function AdminPedidosTable({
  moveButton = false,
  onVerPedido,   // (pedido) => void  (opcional: para abrir modal/sidepanel externo)
  onVerFactura,  // (factura) => void
  onEditarPedido // (pedido) => void
}) {
  // ---------- estado UI ----------
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [pedidos, setPedidos] = useState([]);          // data cruda de la API
  const [estados, setEstados] = useState([]);          // [{id_estado_pedido, nombre_pedido}]
  const [openRows, setOpenRows] = useState({});        // {id_pedido: bool}
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // ---------- cargar datos ----------
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [resPedidos, resEstados] = await Promise.all([
          getPedidosConDetalles(),
          getEstados(),
        ]);
        if (!alive) return;
        setPedidos(resPedidos.data || []);
        setEstados(resEstados.data || []);
        setErr("");
      } catch (e) {
        console.error(e);
        setErr("No se pudo cargar pedidos/estados.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // ---------- helpers ----------
  const mapNombreToEstadoId = (nombre) => {
    const found = estados.find((e) => e.nombre_pedido === nombre);
    return found?.id_estado_pedido ?? null;
  };

  const mapEstadoIdToNombre = (id) => {
    const found = estados.find((e) => e.id_estado_pedido === id);
    return found?.nombre_pedido ?? "";
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pedidos;
    return pedidos.filter((p) => {
      const numero = `#${String(p.id_pedido).padStart(6, "0")}`;
      const estadoNombre = p?.estado_pedido?.nombre_pedido || "";
      const total = p?.factura?.total?.toString() || "";
      const fecha = p?.fecha_pedido ? new Date(p.fecha_pedido).toLocaleString() : "";
      return (
        numero.toLowerCase().includes(q) ||
        estadoNombre.toLowerCase().includes(q) ||
        total.toLowerCase().includes(q) ||
        fecha.toLowerCase().includes(q)
      );
    });
  }, [pedidos, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleRow = (id) =>
    setOpenRows((s) => ({ ...s, [id]: !s[id] }));

  // ---------- acciones ----------
  const handleChangeEstado = async (id_pedido, nuevoIdEstado) => {
    try {
      await actualizarEstadoPedido(id_pedido, nuevoIdEstado);
      // refrescar en memoria el pedido editado
      setPedidos((prev) =>
        prev.map((p) =>
          p.id_pedido === id_pedido
            ? {
                ...p,
                id_estado_pedido: nuevoIdEstado,
                estado_pedido: { nombre_pedido: mapEstadoIdToNombre(nuevoIdEstado) },
              }
            : p
        )
      );
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar el estado del pedido.");
    }
  };

  // ---------- Render ----------
  return (
    <div
      className="bg-gray-100 w-screen pb-8"
      style={{ position: "absolute", top: "90px", left: 0, right: 0 }}
    >
      <div className={`transition-all duration-300 pt-4 ${moveButton ? "ml-[270px] mr-[70px]" : "ml-[70px] mr-[70px]"}`}>
        <h1 className="text-2xl font-semibold text-[#f0833e] text-4xl pb-1 text-left">
          Gestión de Pedidos
        </h1>
        <hr className="h-[3px] border-0 bg-[#f0833e]" />

        {/* Card tabla principal */}
        <div className="mt-5 bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          {/* Barra superior azul */}
          <div className="flex items-center justify-between bg-[#2b6daf] text-white px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Pedidos</span>
              <span className="text-white/80 text-sm">({filtered.length})</span>
            </div>
            <div className="relative">
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar por #, estado, fecha, total..."
                className="pl-9 pr-3 py-1.5 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-white/60"
              />
              <span className="absolute left-2 top-1.5 text-white/90">🔎</span>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left bg-gray-50">
                  <th className="px-5 py-3 w-10"></th>
                  <th className="px-5 py-3"># Pedido</th>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3 text-right">Opciones</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-center text-gray-500">Cargando…</td>
                  </tr>
                )}
                {!loading && err && (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-center text-red-600">{err}</td>
                  </tr>
                )}
                {!loading && !err && current.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-center text-gray-500">Sin resultados</td>
                  </tr>
                )}

                {current.map((p) => {
                  const numero = `#${String(p.id_pedido).padStart(6, "0")}`;
                  const fecha = p?.fecha_pedido
                    ? new Date(p.fecha_pedido).toLocaleString()
                    : "—";
                  const total = p?.factura?.total != null ? parseFloat(p.factura.total).toFixed(2) : "0.00";
                  const estadoNombre = p?.estado_pedido?.nombre_pedido ?? "";
                  const selectedEstadoId =
                    mapNombreToEstadoId(estadoNombre) ?? p?.id_estado_pedido ?? null;
                  const abierto = !!openRows[p.id_pedido];

                  return (
                    <React.Fragment key={p.id_pedido}>
                      <tr className="border-t hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <button
                            className="p-1 rounded-lg hover:bg-gray-100"
                            onClick={() => toggleRow(p.id_pedido)}
                            title={abierto ? "Ocultar detalles" : "Ver detalles"}
                          >
                            <IconChevron open={abierto} />
                          </button>
                        </td>
                        <td className="px-5 py-3 font-medium text-gray-800">{numero}</td>
                        <td className="px-5 py-3 text-gray-700">{fecha}</td>
                        <td className="px-5 py-3">
                          <select
                            className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2b6daf]/40"
                            value={selectedEstadoId ?? ""}
                            onChange={(e) => handleChangeEstado(p.id_pedido, parseInt(e.target.value))}
                          >
                            <option value="" disabled>Seleccionar…</option>
                            {estados.map((e) => (
                              <option key={e.id_estado_pedido} value={e.id_estado_pedido}>
                                {e.nombre_pedido}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-3 font-semibold">L {total}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100"
                              onClick={() => onVerPedido ? onVerPedido(p) : toggleRow(p.id_pedido)}
                              title="Ver pedido"
                            >
                              <IconEye /> <span className="text-sm">Pedido</span>
                            </button>
                            <button
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100"
                              onClick={() => onVerFactura ? onVerFactura(p?.factura) : toggleRow(p.id_pedido)}
                              title="Ver factura"
                            >
                              <IconEye /> <span className="text-sm">Factura</span>
                            </button>
                            
                          </div>
                        </td>
                      </tr>

                      {/* Fila colapsable con detalles de factura y productos */}
                      {abierto && (
                        <tr className="bg-white border-t">
                          <td colSpan={6} className="px-5 pb-5 pt-2">
                            {/* Factura resumida */}
                            <div className="grid grid-cols-3 gap-6">
                              <div className="col-span-3 md:col-span-1">
                                <div className="rounded-xl border border-gray-200">
                                  <div className="bg-gray-50 px-4 py-2 rounded-t-xl font-semibold">Factura</div>
                                  <div className="p-4 text-sm">
                                    <div><span className="text-gray-500">ID:</span> {p?.factura?.id_factura ?? "—"}</div>
                                    <div><span className="text-gray-500">Emisión:</span> {p?.factura?.fecha_emision ? new Date(p.factura.fecha_emision).toLocaleString() : "—"}</div>
                                    <div><span className="text-gray-500">Total:</span> L {total}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Detalle de productos */}
                              <div className="col-span-3 md:col-span-2">
                                <div className="rounded-xl border border-gray-200 overflow-hidden">
                                  <div className="bg-gray-50 px-4 py-2 font-semibold">Detalles</div>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                      <thead>
                                        <tr className="text-left">
                                          <th className="px-4 py-2">Código</th>
                                          <th className="px-4 py-2">Producto</th>
                                          <th className="px-4 py-2">Categoría</th>
                                          <th className="px-4 py-2 text-right">Cant.</th>
                                          <th className="px-4 py-2 text-right">Precio</th>
                                          <th className="px-4 py-2 text-right">Subtotal</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(p?.factura?.factura_detalles || []).map((d, i) => {
                                          const cod = String(d?.producto?.id_producto ?? "").padStart(4, "0");
                                          const nombre = d?.producto?.nombre ?? "—";
                                          const cat = d?.producto?.subcategoria?.categoria?.nombre ?? "—";
                                          const qty = d?.cantidad_unidad_medida ?? 0;
                                          const precioRaw = d?.producto?.precio_base;
                                          const precio = Number(precioRaw) || 0;
                                          return (
                                            <tr key={i} className="border-t">
                                              <td className="px-4 py-2">{cod}</td>
                                              <td className="px-4 py-2">{nombre}</td>
                                              <td className="px-4 py-2">{cat}</td>
                                              <td className="px-4 py-2 text-right">{qty}</td>
                                              <td className="px-4 py-2 text-right">L {precio.toFixed(2)}</td>
                                              <td className="px-4 py-2 text-right">L {(qty * precio).toFixed(2)}</td>
                                            </tr>
                                          );
                                        })}
                                        {(!p?.factura?.factura_detalles || p.factura.factura_detalles.length === 0) && (
                                          <tr><td colSpan={6} className="px-4 py-4 text-center text-gray-500">Sin detalles</td></tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-center gap-3 py-4">
            <button
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              title="Anterior"
            >
              ‹
            </button>
            <span className="w-8 h-8 rounded-full border border-[#f0833e] text-[#f0833e] flex items-center justify-center font-semibold">
              {page}
            </span>
            <button
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              title="Siguiente"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
