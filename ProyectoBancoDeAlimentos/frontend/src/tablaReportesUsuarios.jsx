import "./tablaReportesUsuarios.css";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getAllInformacionUsuario } from "./api/Usuario.Route";
import { getPedidosConDetallesUsuario } from "./api/PedidoApi";
import {
  getAllFacturasByUserwithDetails,
  getResumenFacturasUsuario,
} from "./api/FacturaApi";
import InfoIcon from "./images/info.png";

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

function Pagination({ page, pageCount, onPage }) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  const handlePage = (p) => {
    if (p < 1 || p > pageCount) return;
    onPage(p);
  };

  return (
    <div className="usuario-pagination">
      <button
        onClick={() => handlePage(page - 1)}
        className="usuario-pagination-btn"
        disabled={page === 1}
        title="Anterior"
      >
        <Icon.ChevronLeft />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => handlePage(p)}
          className={`usuario-page-btn ${
            p === page ? "usuario-page-btn-active" : ""
          }`}
          title={`Página ${p}`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => handlePage(page + 1)}
        className="usuario-pagination-btn"
        disabled={page === pageCount}
        title="Siguiente"
      >
        <Icon.ChevronRight />
      </button>
    </div>
  );
}

function TablaReportesUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [appliedFilter, setAppliedFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("Todos");
  const [orderDesc, setOrderDesc] = useState(false);

  const itemsPerPage = 8;

  const calcularProductoEstrella = (facturas) => {
    const conteoProductos = {};

    facturas.forEach((factura) => {
      if (factura.factura_detalles && Array.isArray(factura.factura_detalles)) {
        factura.factura_detalles.forEach((detalle) => {
          const productoId = detalle?.id_producto;
          const nombreProducto = detalle.producto?.nombre;
          const cantidad = parseInt(detalle.cantidad_unidad_medida || 1); // Usar la cantidad_unidad_medida

          if (conteoProductos[productoId]) {
            conteoProductos[productoId].cantidad += cantidad;
          } else {
            conteoProductos[productoId] = {
              nombre: nombreProducto,
              cantidad: cantidad,
              unidadMedida: detalle.producto?.unidad_medida,
            };
          }
        });
      }
    });

    // Encontrar el producto con mayor cantidad
    let productoEstrella = "Este usuario no ha comprado";
    let maxCantidad = 0;

    Object.values(conteoProductos).forEach((producto) => {
      if (producto.cantidad > maxCantidad) {
        maxCantidad = producto.cantidad;
        productoEstrella = `${producto.nombre}`; //${producto.cantidad} ${producto.unidadMedida || ""
      }
    });

    return productoEstrella;
  };

  // Traer los datos del backend
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await getAllInformacionUsuario();

        console.log("🔄 Obteniendo TODAS las facturas...");
        const todasLasFacturas = await getAllFacturasByUserwithDetails();
        console.log(
          "📦 Total facturas obtenidas:",
          todasLasFacturas.data?.length || 0
        );
        console.log(
          "📦 Detalles de todas las facturas:",
          todasLasFacturas.data
        );

        const usuariosMapeados = await Promise.all(
          response.data.map(async (user) => {
            try {
              // Obtener todas las facturas con detalles para este usuario
              const facturasUsuario = await getAllFacturasByUserwithDetails(
                user.id_usuario
              );
              console.log(
                `📄 Facturas obtenidas para usuario ${user.id_usuario} with name ${user.nombre}:`,
                facturasUsuario.data || 0
              );

              // 🔥 FILTRAR de TODAS las facturas para este usuario específico
              const facturasDelUsuario =
                todasLasFacturas.data?.filter((factura) => {
                  const perteneceAlUsuario =
                    factura.pedido?.id_usuario === user.id_usuario;

                  return perteneceAlUsuario;
                }) || [];

              const cantidadCompras = facturasUsuario.data.length;
              const totalComprado = facturasUsuario.data.reduce(
                (sum, factura) => {
                  const total = parseFloat(factura.total) || 0;
                  return sum + total;
                },
                0
              );

              const calcularFrecuenciaCompra = (facturas) => {
                if (!facturas || facturas.length < 2) return "N/A días";

                // Extraer fechas y ordenarlas
                const fechas = facturas
                  .map((f) => new Date(f.fecha_emision))
                  .sort((a, b) => a - b);

                let diferencias = [];
                for (let i = 1; i < fechas.length; i++) {
                  const diff =
                    (fechas[i] - fechas[i - 1]) / (1000 * 60 * 60 * 24);
                  diferencias.push(diff);
                }

                // Promedio de días entre compras
                const promedioDias =
                  diferencias.reduce((a, b) => a + b, 0) / diferencias.length;
                return `${promedioDias.toFixed(1)} días`;
              };

              const frecuenciaCompra =
                calcularFrecuenciaCompra(facturasDelUsuario);

              const productoEstrella = calcularProductoEstrella(
                facturasUsuario.data
              );

              if (user.nombre === null) {
                user.nombre = "N/A";
                user.apellido = "";
              } else if (user.apellido === null) {
                user.apellido = "";
              }
              return {
                id: user.id_usuario,
                rol: user.id_rol,
                nombre: user.nombre + " " + user.apellido,
                estado: user.activo ? "Activo" : "Inactivo",
                productoEstrella: productoEstrella || "N/A",
                cantidadCompras: cantidadCompras,
                totalComprado: totalComprado.toFixed(2),
                frecuenciaCompra: frecuenciaCompra,
              };
            } catch (error) {
              console.error(
                `Error al cargar estadísticas del usuario ${user.id_usuario}:`,
                error
              );
              return {
                id: user.id_usuario,
                nombre: user.nombre + " " + (user.apellido || ""),
                estado: user.activo ? "Activo" : "Inactivo",
                productoEstrella: "N/A",
                cantidadCompras: 0,
                totalComprado: "0.00",
              };
            }
          })
        );

        setUsuarios(usuariosMapeados);
      } catch (error) {
        console.error("Error al cargar los datos de usuarios:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Ordenar
  const sortedData = [...usuarios].sort((a, b) =>
    orderDesc ? b.id - a.id : a.id - b.id
  );

  // Filtrar
  const filteredData = sortedData.filter((item) => {
    const matchesNombre = appliedFilter
      ? item.nombre.toLowerCase().includes(appliedFilter.toLowerCase())
      : true;

    const matchesEstado =
      estadoFilter === "Todos" ? true : item.estado === estadoFilter;

    const matchesRol = item.rol === 2;

    if (!matchesRol) return false;

    return matchesNombre && matchesEstado;
  });

  // Paginación
  const paginatedData = filteredData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

  // Exportar Excel
  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(usuarios);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");
    const excelBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(blob, "Reporte_Usuarios.xlsx");
  };

  return (
    <div
      className="px-4"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="usuario-container" style={{ maxWidth: "1200px" }}>
        <header className="page-header">
          <h1 className="usuario-title">Reportes De Usuarios</h1>
          <button onClick={handleExportExcel} className="usuario-export-btn">
            📊 Exportar a Excel
          </button>
        </header>
        <div className="divider" />
        <div className="usuario-toolbar">
          {/* Filtro por estado */}
          <div className="usuario-filtros">
            <label htmlFor="estadoFilter">Filtrar por estado:</label>
            <select
              id="estadoFilter"
              value={estadoFilter}
              onChange={(e) => {
                setEstadoFilter(e.target.value);
                setPage(1);
              }}
              style={{
                fontSize: "16px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "4px 8px",
                backgroundColor: "#E6E6E6",
              }}
            >
              <option value="Todos">Todos</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>

            <div className="usuario-count">
              <span>Total De Usuarios Registrados: </span>
              <span className="count-bubble">{filteredData.length}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="usuario-loading">Cargando...</div>
        ) : (
          <div className="usuario-table-wrap">
            <table className="usuario-table">
              <thead className="usuario-thead">
                <tr>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => setOrderDesc(!orderDesc)}
                    title="Ordenar por ID"
                  >
                    ID {orderDesc ? "↓" : "↑"}
                  </th>
                  <th>
                    <div className="flex items-center justify-center">
                      <span>Nombre</span>
                      <span
                        className="usuario-search-icon ml-1 cursor-pointer"
                        onClick={() => setShowFilter(true)}
                        title="Filtrar usuario"
                      >
                        <Icon.Search />
                      </span>
                    </div>
                  </th>
                  <th>Estado</th>
                  <th>Producto Estrella</th>
                  <th>Cantidad de Compras</th>
                  <th>Total Comprado</th>
                  <th>Promedio por compra</th>
                  <th>Frecuencia de compra</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="usuario-table-empty">
                      ⚠ Sin resultados que mostrar
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.nombre}</td>
                      <td>
                        <span
                          style={{
                            backgroundColor:
                              row.estado === "Activo"
                                ? "rgba(0, 200, 0, 0.15)"
                                : "rgba(200, 0, 0, 0.15)",
                            color: row.estado === "Activo" ? "green" : "red",
                            padding: "4px 8px",
                            borderRadius: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          {row.estado}
                        </span>
                      </td>
                      <td>{row.productoEstrella}</td>
                      <td>{row.cantidadCompras}</td>
                      <td>L. {row.totalComprado}</td>
                      <td>
                        L.{" "}
                        {row.cantidadCompras > 0
                          ? (row.totalComprado / row.cantidadCompras).toFixed(2)
                          : "0.00"}
                      </td>
                      <td>{row.frecuenciaCompra}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} pageCount={totalPages} onPage={setPage} />

        {/* Mini ventana emergente */}
        {showFilter && (
          <div className="mini-modal">
            <div className="mini-modal-content">
              <h3>Filtrar por nombre</h3>
              <input
                type="text"
                placeholder="Escriba un nombre..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
              <div className="mini-modal-actions">
                <button
                  onClick={() => {
                    setAppliedFilter(filterText);
                    setShowFilter(false);
                    setPage(1);
                  }}
                  className="btn-apply"
                >
                  Aplicar
                </button>
                <button
                  onClick={() => {
                    setShowFilter(false);
                    setFilterText("");
                  }}
                  className="btn-cancel"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TablaReportesUsuarios;
