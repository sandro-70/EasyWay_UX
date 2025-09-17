import React, { useState, useEffect } from "react";
import "../components/GestionPedido.css";

import {
  getPedidosConDetalles,
  listarPedido,
  actualizarEstadoPedido,
} from "../api/PedidoApi";
import { getAllSucursales } from "../api/InventarioApi";
import { getDirecciones } from "../api/DireccionesApi";
import { getAllMetodoPago, getMetodosPagoByUserId } from "../api/metodoPagoApi";
import { InformacionUserNombre } from "../api/Usuario.Route";

// Nota: el shape devuelto por la API puede variar. Aquí asumimos que
// cada pedido tiene al menos: id_pedido (o id), nombre_usuario, fecha,
// estado, sucursal, productos, descuento, subtotal, direccion, metodo_pago, total.

// Helper: formatea un campo antes de renderizar para evitar pasar objetos/arrays

function formatField(value) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" || typeof value === "number") return value;
  if (Array.isArray(value)) return value.map((v) => formatField(v)).join(", ");
  // objeto: intenta obtener propiedades útiles
  if (typeof value === "object") {
    // priorizar campos comunes
    return (
      value.nombre_pedido ||
      value.nombre ||
      value.nombre_usuario ||
      value.id ||
      JSON.stringify(value)
    );
  }
  return String(value);
}

function formatPayment(mp) {
  if (!mp) return "-";
  if (typeof mp === "string") return mp;

  // Tarjeta: Visa ****1234
  if (mp.brand_tarjeta || mp.tarjeta_ultimo) {
    const brand = mp.brand_tarjeta ? mp.brand_tarjeta : "Tarjeta";
    const last4 =
      mp.tarjeta_ultimo && String(mp.tarjeta_ultimo).length === 4
        ? ` ****${mp.tarjeta_ultimo}`
        : "";
    return `${brand}${last4}`;
  }

  // Otros métodos de pago
  if (mp.tipo) return mp.tipo;
  if (mp.nombre) return mp.nombre;

  return JSON.stringify(mp);
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return formatField(value);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
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

function PaginationSmall({ page, pageCount, onPage }) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <div className="pedido-pagination">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        className="pedido-pagination-btn"
        disabled={page === 1}
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
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPage(Math.min(pageCount, page + 1))}
        className="pedido-pagination-btn"
        disabled={page === pageCount}
      >
        <Icon.ChevronRight />
      </button>
    </div>
  );
}
const GestionPedidos = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  // estado para alternar orden asc/desc por id
  const [orderDesc, setOrderDesc] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const t = localStorage.getItem("token");
  // decode token payload safely
  let tokenPayload = null;
  if (t) {
    try {
      tokenPayload = JSON.parse(atob(t.split(".")[1]));
      console.log("token payload", tokenPayload);
    } catch (e) {
      console.warn("No se pudo decodificar token", e);
    }
  }

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const fetchPedidos = async () => {
      try {
        // cargar pedidos y sucursales en paralelo
        const [res, sucResp] = await Promise.all([
          getPedidosConDetalles(),
          getAllSucursales().catch(() => ({ data: [] })),
        ]);
        if (!mounted) return;
        const data = res && res.data ? res.data : [];
        const sucursales = sucResp && sucResp.data ? sucResp.data : [];

        // construir mapa id_sucursal -> nombre
        const sucursalMap = sucursales.reduce((acc, s) => {
          const id = s.id_sucursal || s.id || s.idSucursal || s.idSucursal;
          const nombre =
            s.nombre ||
            s.nombre_sucursal ||
            s.nombreSucursal ||
            s.nombre_sucursal;
          if (id) acc[String(id)] = nombre || "";
          return acc;
        }, {});

        const mappedInitial = data.map((p) => ({
          raw: p,
          id: p.id_pedido || p.id || p.ID || p.idPedido || "-",
          id_usuario:
            p.id_usuario || p.idUsuario || (p.usuario && p.usuario.id) || null,
          usuario:
            p.nombre_usuario ||
            (p.usuario &&
              (p.usuario.nombre ||
                `${p.usuario.nombre || ""} ${
                  p.usuario.apellido || ""
                }`.trim())) ||
            p.usuario ||
            "-",
          fecha: p.fecha || p.createdAt || p.fecha_pedido || "-",
          estado: p.estado || p.estado_pedido || "-",
          sucursal:
            (p.sucursal && (p.sucursal.nombre || p.sucursal.nombre_sucursal)) ||
            p.nombre_sucursal ||
            sucursalMap[String(p.id_sucursal || p.idSucursal || p.id || "")] ||
            "-",
          productos: p.productos || p.detalle || p.items || [],
          descuento: p.descuento || 0,
          subtotal: p.subtotal || 0,
          direccion: p.direccion || p.direccion_entrega || "-",
          metodoPago: p.metodo_pago || p.metodoPago || p.metodo || "-",
          total: p.total || p.monto_total || 0,
        }));

        // Normalizar ids como strings para evitar mismatches (number vs string)
        // Además incluir casos donde `usuario` viene como un id numérico en lugar de
        // estar en `id_usuario`.
        const userIds = Array.from(
          new Set(
            mappedInitial
              .flatMap((m) => {
                const ids = [];
                if (m.id_usuario !== null && m.id_usuario !== undefined)
                  ids.push(String(m.id_usuario));
                // si usuario parece ser solo un id numérico, incluirlo también
                if (
                  m.usuario !== null &&
                  m.usuario !== undefined &&
                  /^[0-9]+$/.test(String(m.usuario))
                ) {
                  ids.push(String(m.usuario));
                }
                return ids;
              })
              .filter(Boolean)
          )
        );

        const userMap = {};
        if (userIds.length > 0) {
          try {
            const userPromises = userIds.map((uid) =>
              // uid ya está normalizado como string; InformacionUser acepta string/number según implementación
              InformacionUserNombre(uid)
                .then((r) => ({ uid, data: r && r.data ? r.data : null }))
                .catch(() => ({ uid, data: null }))
            );
            const usersRes = await Promise.all(userPromises);

            usersRes.forEach((u) => {
              const key = String(u.uid);
              if (u && u.data) {
                const nombre = u.data.nombre
                  ? u.data.apellido
                    ? `${u.data.nombre} ${u.data.apellido}`
                    : u.data.nombre
                  : u.data.nombre_completo || u.data.correo || null;
                userMap[key] = nombre || key;
              } else {
                userMap[key] = key;
              }
            });
          } catch (e) {
            console.warn("Error obteniendo usuarios:", e);
          }
        }

        // Al mapear, buscar por la clave string normalizada o por si `usuario` era un id
        const mapped = mappedInitial.map((m) => {
          const uidKey =
            m.id_usuario !== null && m.id_usuario !== undefined
              ? String(m.id_usuario)
              : /^[0-9]+$/.test(String(m.usuario || ""))
              ? String(m.usuario)
              : null;
          const resolved = uidKey ? userMap[uidKey] : null;
          const usuarioFinal = resolved ? resolved : m.usuario;
          return {
            ...m,
            usuario: usuarioFinal,
          };
        });

        if (mounted) setPedidos(mapped);
      } catch (err) {
        console.error("Error cargando pedidos:", err);
        if (mounted) setError("Error al cargar pedidos");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPedidos();

    return () => {
      mounted = false;
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(pedidos.length / itemsPerPage));

  // ordenar los pedidos localmente por id (robusto ante id como string o faltante)
  const getId = (x) =>
    Number(x?.id ?? x?.id_pedido ?? x?.ID ?? x?.idPedido ?? 0) || 0;
  const sortedPedidos = React.useMemo(() => {
    return [...pedidos].sort((a, b) => {
      const ia = getId(a);
      const ib = getId(b);
      return orderDesc ? ib - ia : ia - ib;
    });
  }, [pedidos, orderDesc]);

  const visible = sortedPedidos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const [detalleOpen, setDetalleOpen] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [estadoActual, setEstadoActual] = useState("Pendiente");
  const [nuevoEstado, setNuevoEstado] = useState("Pendiente");
  const [direccionEntrega, setDireccionEntrega] = useState(null);
  const [metodoPagoUsuario, setMetodoPagoUsuario] = useState(null);
  const [sucursalNombre, setSucursalNombre] = useState(null);
  // mapeo simple nombre de estado -> id en la tabla estado_pedido
  const estadoNameToId = {
    Pendiente: 1,
    "En Preparación": 2, // mapeado a 'Procesando'
    "En Camino": 3, // mapeado a 'Enviado'
    Entregado: 4,
    Cancelado: 5,
  };

  return (
    <div
      className="px-4"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: "300px",
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div className="pedido-container">
        <h2 className="pedido-title">Gestión de Pedidos</h2>

        <div className="pedido-table-wrap">
          <table className="pedido-table">
            <thead className="pedido-thead">
              <tr>
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setOrderDesc(!orderDesc);
                    setCurrentPage(1); // reset paginación al cambiar orden
                  }}
                  title="Ordenar por ID"
                >
                  ID de Producto {orderDesc ? "↓" : "↑"}
                </th>
                <th>Usuario</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Sucursal</th>
                <th>Más información</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="pedido-table-empty">
                    Cargando pedidos...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" className="pedido-table-empty">
                    {error}
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan="6" className="pedido-table-empty">
                    No hay pedidos para mostrar
                  </td>
                </tr>
              ) : (
                visible.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{formatField(p.usuario)}</td>
                    <td>{formatDate(p.fecha)}</td>
                    <td>{formatField(p.estado)}</td>
                    <td>{formatField(p.sucursal)}</td>
                    <td>
                      <button
                        className="pedido-export-btn"
                        onClick={async () => {
                          try {
                            // pedir detalle actualizado del pedido
                            const id = p.id || p.id_pedido;
                            const resp = await listarPedido(id);
                            const detalle = resp && resp.data ? resp.data : {};
                            // combinar sin perder datos ya mapeados en la tabla
                            const combinado = { ...p, ...detalle };

                            // calcular subtotal/total si vienen dentro de factura
                            // Nota: la respuesta original (getPedidosConDetalles) se guarda en combinado.raw
                            // y puede contener `factura`. Buscar en ambas ubicaciones.
                            const facturaObj =
                              combinado.factura ||
                              combinado.Factura ||
                              combinado.raw?.factura ||
                              combinado.raw?.Factura ||
                              null;
                            const detallesFactura =
                              facturaObj?.factura_detalles ||
                              facturaObj?.factura_detalle ||
                              [];
                            let subtotalCalc =
                              combinado.subtotal || combinado.sub_total || 0;
                            let totalCalc = combinado.total || 0;
                            if (
                              Array.isArray(detallesFactura) &&
                              detallesFactura.length > 0
                            ) {
                              subtotalCalc = detallesFactura.reduce(
                                (s, d) => s + Number(d.subtotal_producto || 0),
                                0
                              );
                            }
                            if (facturaObj && facturaObj.total !== undefined) {
                              totalCalc = Number(facturaObj.total);
                              console.log(
                                "Total que viene de facturaObj.total:",
                                totalCalc
                              );

                              console.log("Objeto obj", facturaObj);
                              // Calcular subtotal a partir de los detalles de factura si existen
                              if (
                                Array.isArray(facturaObj.factura_detalles) &&
                                facturaObj.factura_detalles.length > 0
                              ) {
                                subtotalCalc =
                                  facturaObj.factura_detalles.reduce(
                                    (s, d) => Number(d.subtotal_producto || 0),
                                    0
                                  );
                                console.log(
                                  "Lo que trae objetoObj.factura_Detalles... SUbtotalCalc =  ",
                                  subtotalCalc
                                );
                              } else if (
                                Array.isArray(facturaObj.factura_detalle) &&
                                facturaObj.factura_detalle.length > 0
                              ) {
                                subtotalCalc =
                                  facturaObj.factura_detalle.reduce(
                                    (s, d) => Number(d.subtotal_producto || 0),
                                    0
                                  );
                              }
                              console.log(
                                "Subtotal calculado desde detalles:",
                                subtotalCalc
                              );
                            }
                            combinado.subtotal = subtotalCalc;
                            combinado.total = totalCalc;

                            // obtener direcciones del usuario y metodo de pago
                            const userId =
                              combinado.id_usuario ||
                              combinado.idUsuario ||
                              null;

                            // si falta nombre en el combinado, intentar traerlo por id
                            if (
                              userId &&
                              (!combinado.usuario ||
                                combinado.usuario === "-" ||
                                combinado.usuario === null)
                            ) {
                              try {
                                const userResp = await InformacionUserNombre(
                                  userId
                                );

                                const udata =
                                  userResp && userResp.data
                                    ? userResp.data
                                    : null;
                                if (udata) {
                                  combinado.usuario = udata.nombre
                                    ? udata.apellido
                                      ? `${udata.nombre} ${udata.apellido}`
                                      : udata.nombre
                                    : udata.nombre_completo ||
                                      udata.correo ||
                                      combinado.usuario;
                                }
                              } catch (e) {
                                console.warn(
                                  "No se pudo obtener nombre de usuario:",
                                  e
                                );
                              }
                            }

                            if (userId) {
                              try {
                                const dirResp = await getDirecciones(userId);
                                const direcciones =
                                  dirResp && dirResp.data ? dirResp.data : [];
                                // buscar predeterminada o la primera
                                const pred =
                                  direcciones.find((d) => d.predeterminada) ||
                                  direcciones[0] ||
                                  null;
                                setDireccionEntrega(
                                  pred
                                    ? `${pred.calle || ""} ${
                                        pred.ciudad || ""
                                      }`.trim()
                                    : null
                                );
                                // si existe id_municipio en la direccion, buscar sucursal
                                if (pred && pred.id_municipio) {
                                  try {
                                    const sucResp = await getAllSucursales();
                                    const sucursales =
                                      sucResp && sucResp.data
                                        ? sucResp.data
                                        : [];
                                    const match = sucursales.find(
                                      (s) =>
                                        String(s.id_municipio) ===
                                        String(pred.id_municipio)
                                    );
                                    const resolvedSucursal = match
                                      ? match.nombre ||
                                        match.nombre_sucursal ||
                                        null
                                      : null;
                                    setSucursalNombre(resolvedSucursal);
                                    // actualizar la fila de la tabla para mostrar sucursal
                                    if (resolvedSucursal) {
                                      setPedidos((prev) =>
                                        prev.map((it) =>
                                          String(it.id) === String(combinado.id)
                                            ? {
                                                ...it,
                                                sucursal: resolvedSucursal,
                                              }
                                            : it
                                        )
                                      );
                                    }
                                  } catch (e) {
                                    console.warn(
                                      "Error al obtener sucursales:",
                                      e
                                    );
                                    setSucursalNombre(null);
                                  }
                                } else {
                                  setSucursalNombre(null);
                                }
                              } catch (e) {
                                console.warn(
                                  "Error al obtener direcciones:",
                                  e
                                );
                                setDireccionEntrega(null);
                              }

                              try {
                                let mpResp = null;

                                if (userId) {
                                  try {
                                    mpResp = await getMetodosPagoByUserId(
                                      userId
                                    );
                                  } catch (err) {
                                    // Si no autorizado, intentar el endpoint general
                                    const status = err?.response?.status;
                                    if (status === 401 || status === 403) {
                                      mpResp = await getAllMetodoPago();
                                    } else {
                                      // rethrow para ser capturado por outer catch
                                      throw err;
                                    }
                                  }
                                } else {
                                  mpResp = await getAllMetodoPago();
                                }

                                const metodos =
                                  mpResp && mpResp.data ? mpResp.data : [];

                                // Búsqueda robusta del método del usuario: el backend puede
                                // devolver campos con nombres distintos (id_usuario, idUsuario, etc.)
                                const matchesUser = (m) => {
                                  if (!m) return false;
                                  const candidates = [
                                    m.id_usuario,
                                    m.idUsuario,
                                    m.id_user,
                                    m.usuario_id,
                                    m.id,
                                  ];
                                  return candidates.some(
                                    (c) =>
                                      c != null && String(c) === String(userId)
                                  );
                                };

                                let mpUsuario = metodos.find(matchesUser);

                                // si la lista ya está filtrada por usuario, tomar el predeterminado
                                if (!mpUsuario) {
                                  mpUsuario =
                                    metodos.find(
                                      (m) => m.metodo_predeterminado
                                    ) ||
                                    metodos[0] ||
                                    null;
                                }

                                const formatted = formatPayment(mpUsuario);
                                setMetodoPagoUsuario(formatted);
                                console.log(
                                  "Método de Pago del Usuario:",
                                  formatted
                                );
                              } catch (e) {
                                console.warn(
                                  "Error al obtener metodos de pago:",
                                  e
                                );
                                setMetodoPagoUsuario(null);
                              }
                            } else {
                              setDireccionEntrega(null);
                              setMetodoPagoUsuario(null);
                            }

                            setPedidoSeleccionado(combinado);
                            // inicializar estados (usar formatField para evitar objects)
                            setEstadoActual(
                              formatField(combinado.estado || p.estado)
                            );
                            console.log(
                              "Estado actual inicial: en el modal",
                              formatField(combinado.estado || p.estado)
                            );
                            setNuevoEstado(
                              formatField(combinado.estado || p.estado)
                            );
                            setDetalleOpen(true);
                          } catch (e) {
                            console.error(
                              "Error al obtener detalle del pedido:",
                              e
                            );
                            // fallback local
                            setPedidoSeleccionado(p);
                            setEstadoActual(formatField(p.estado));
                            setNuevoEstado(formatField(p.estado));
                            setDetalleOpen(true);
                          }
                        }}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="pedido-footer">
          <span>
            {loading ? "Cargando total..." : `Total Pedidos: `}{" "}
            <p>{pedidos.length}</p>
          </span>
          <PaginationSmall
            page={currentPage}
            pageCount={totalPages}
            onPage={setCurrentPage}
          />
        </div>

        {/* Modal de detalle */}
        {detalleOpen && pedidoSeleccionado && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Detalle del Pedido</h2>
                <button
                  className="modal-close"
                  onClick={() => setDetalleOpen(false)}
                >
                  ✕
                </button>
              </div>

              {/* Productos */}
              <div className="productos-lista">
                {Array.isArray(pedidoSeleccionado.productos)
                  ? pedidoSeleccionado.productos.map((prod, i) => (
                      <div className="producto-card" key={i}>
                        <img src={prod.img} alt={formatField(prod.nombre)} />
                        <p>{formatField(prod.nombre)}</p>
                        <span>{formatField(prod.cantidad)}</span>
                      </div>
                    ))
                  : null}
              </div>

              {/* Info del pedido */}
              <div className="pedido-info">
                <label>Descuento</label>
                <input
                  value={`L. ${formatField(pedidoSeleccionado.descuento)}`}
                  readOnly
                />
                <label>Subtotal</label>
                <input
                  value={`L. ${formatField(pedidoSeleccionado.subtotal)}`}
                  readOnly
                />
                <label>Total</label>
                <input
                  value={`L. ${formatField(pedidoSeleccionado.total)}`}
                  readOnly
                />
                <label>Dirección de entrega</label>
                <input
                  value={
                    direccionEntrega ||
                    formatField(pedidoSeleccionado.direccion)
                  }
                  readOnly
                />
                <label>Sucursal asignada</label>
                <input
                  value={
                    sucursalNombre || formatField(pedidoSeleccionado.sucursal)
                  }
                  readOnly
                />
                <label>Método de Pago</label>
                <input
                  value={
                    metodoPagoUsuario ||
                    formatField(pedidoSeleccionado.metodoPago)
                  }
                  readOnly
                />
              </div>

              {/* Estado actual y cambio */}
              <div className="estado-pedido">
                <label>Estado actual</label>
                <input type="text" value={estadoActual} readOnly disabled />

                <label>Nuevo estado</label>
                <select
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Preparación">En Preparación</option>
                  <option value="En Camino">En Camino</option>
                  <option value="Entregado">Entregado</option>
                </select>
              </div>

              {/* Acciones */}
              <div className="acciones">
                {/* Cambiar Estado: solo actualiza vista localmente (preview). Persist on Guardar. */}
                <button
                  type="button"
                  className="btn-cambiar"
                  onClick={() => {
                    // actualizar preview local
                    setEstadoActual(nuevoEstado);
                    setPedidoSeleccionado((prev) => ({
                      ...prev,
                      estado: nuevoEstado,
                    }));
                    const pedidoId = pedidoSeleccionado
                      ? pedidoSeleccionado.id || pedidoSeleccionado.id_pedido
                      : null;
                    if (pedidoId) {
                      setPedidos((prev) =>
                        prev.map((it) =>
                          String(it.id) === String(pedidoId)
                            ? { ...it, estado: nuevoEstado }
                            : it
                        )
                      );
                    }
                    console.log("Estado cambiado localmente a:", nuevoEstado);
                  }}
                >
                  Cambiar Estado
                </button>

                {/* Cancelar Pedido: marca localmente como Cancelado. Persist on Guardar. */}
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() => {
                    const cancelar = "Cancelado";
                    setNuevoEstado(cancelar);
                    setEstadoActual(cancelar);
                    setPedidoSeleccionado((prev) => ({
                      ...prev,
                      estado: cancelar,
                    }));
                    const pedidoId = pedidoSeleccionado
                      ? pedidoSeleccionado.id || pedidoSeleccionado.id_pedido
                      : null;
                    if (pedidoId) {
                      setPedidos((prev) =>
                        prev.map((it) =>
                          String(it.id) === String(pedidoId)
                            ? { ...it, estado: cancelar }
                            : it
                        )
                      );
                    }
                    console.log("Pedido marcado localmente como Cancelado");
                  }}
                >
                  Cancelar Pedido
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionPedidos;
