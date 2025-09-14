// src/components/ReporteUsuariosAdmin.jsx
import React, { useEffect, useState, useMemo } from "react";
import { estadosUsuarios } from "./api/Usuario.Route";
import {
  promedioGastoUsuario,
  contarPedidosUsuario,
} from "./api/Usuario.Route";
import { getClientesNuevos } from "./api/reporteusuarioApi";
import {
  getUsuariosTabla,
  getTopProductosUsuario,
  getProductosRecomendados,
  getDiasCompra,
  getTotalAhorrado,
} from "./api/reporteusuarioApi"; // tus APIs reales
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import "./reporteUsuariosAdmin.css";

const PageSize = 10;

export default function ReporteUsuariosAdmin() {
  // rango que enviaremos al backend: "hoy"|"semana"|"mes"|"anio"|"todos"
  const [rango, setRango] = useState("semana");
  // estado para enviar al backend: "todos"|"activos"|"inactivos"
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [page, setPage] = useState(1);

  // total de filas en el servidor (para calcular paginación)
  const [totalFiltrado, setTotalFiltrado] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosNuevos, setUsuariosNuevos] = useState([]);

  const [pieData, setPieData] = useState([
    { name: "Activos", value: 0 },
    { name: "Inactivos", value: 0 },
  ]);
  const [productosFavoritos, setProductosFavoritos] = useState([]);
  const [productosRecomendados, setProductosRecomendados] = useState([]);
  const [diasCompra, setDiasCompra] = useState([]);
  const [totalAhorrado, setTotalAhorrado] = useState(0);

  const [promedioGasto, setPromedioGasto] = useState(0);
  const [totalPedidos, setTotalPedidos] = useState(0);

  // Ya no necesitamos filtrar en el front, el backend devuelve los datos según 'rango' y 'filtroEstado'
  const pageCount = Math.max(
    1,
    Math.ceil((totalFiltrado || usuarios.length) / PageSize)
  );

  // Items de la página actual
  const pageItems = usuarios;

  const COLORS = ["#1976d2", "#e85c0d"];

  // Cargar tabla de usuarios
  const fetchUsuarios = async () => {
    try {
      const params = {
        rango, // "semana"|"mes"|...
        estado: filtroEstado || "todos",
        limit: PageSize,
        offset: (page - 1) * PageSize,
      };

      // Opción A: si tu helper acepta params como objeto:
      const res = await getUsuariosTabla(params);

      // Opción B (si tu helper no acepta params): descomenta e importa axiosInstance
      // const res = await axiosInstance.get('/api/reportes-usuario/reporte/tabla', { params });

      const rows = res.data.rows || [];
      setUsuarios(rows);
      // meta.totalFiltrado viene de tu API (count)
      const meta = res.data.meta || {};
      setTotalFiltrado(meta.totalFiltrado ?? meta.total ?? rows.length);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
    }
  };

  // Cargar usuarios nuevos por semana
  const fetchUsuariosNuevos = async () => {
    try {
      // si tu helper acepta un objeto:
      const res = await getClientesNuevos({ rango });
      // adaptamos según lo que retorne tu API (serie, out, data)
      const data = res.data.series || res.data.out || res.data || [];
      setUsuariosNuevos(data);
    } catch (err) {
      console.error("Error cargando usuarios nuevos:", err);
    }
  };

  // Cargar estados para gráfico pie
  const fetchEstados = async () => {
    try {
      const params = {
        rango, // "hoy"|"semana"|...
        estado: filtroEstado || "todos",
        limit: 1,
        offset: 0,
      };
      const res = await getUsuariosTabla(params); // tu API de tabla
      const meta = res.data.meta || {};

      setPieData([
        { name: "Activos", value: meta.activos ?? 0 },
        { name: "Inactivos", value: meta.inactivos ?? 0 },
      ]);
    } catch (err) {
      console.error("Error cargando estados:", err);
    }
  };

  // Cargar info detallada de usuario seleccionado
  const fetchUserDetails = async (id_usuario) => {
    try {
      const [topProductos, recomendados, dias, ahorrado, promedio, pedidos] =
        await Promise.all([
          getTopProductosUsuario(id_usuario),
          getProductosRecomendados(id_usuario),
          getDiasCompra(id_usuario),
          getTotalAhorrado(id_usuario),
          promedioGastoUsuario(id_usuario),
          contarPedidosUsuario(id_usuario),
        ]);

      setProductosFavoritos(topProductos.data || []);
      setProductosRecomendados(recomendados.data || []);
      setDiasCompra(dias.data || []);
      setTotalAhorrado(ahorrado.data.total || 0);
      setPromedioGasto(promedio.data.promedio || 0);
      setTotalPedidos(pedidos.data.total || 0);
    } catch (err) {
      console.error("Error cargando detalles del usuario:", err);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchUsuarios();
    fetchEstados();
    fetchUsuariosNuevos();
  }, [rango, filtroEstado]);

  const handleSelectUser = (usuario) => {
    setSelectedUser(usuario);
    fetchUserDetails(usuario.id_usuario);
  };

  // Transformar usuariosNuevos para el gráfico de barras
  const barData = usuariosNuevos.map((u) => ({
    name: u.label,
    Nuevos: u.total,
  }));

  return (
    <>
      <div className="reporte-layout">
        <div className="reporte-container">
          <div className="header">
            <h1>Reporte de Usuarios</h1>
            <div className="filters">
              <label>
                Filtrar periodo:
                <select
                  value={rango}
                  onChange={(e) => {
                    setRango(e.target.value);
                    setPage(1); // reiniciar a primera página
                  }}
                >
                  <option value="hoy">Hoy</option>
                  <option value="semana">Última semana</option>
                  <option value="mes">Este mes</option>
                  <option value="anio">Este año</option>
                  <option value="todos">Todos</option>
                </select>
              </label>

              <label>
                Filtrar usuarios por:
                <select
                  value={filtroEstado}
                  onChange={(e) => {
                    setFiltroEstado(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="todos">Todos</option>
                  <option value="activos">Activos</option>
                  <option value="inactivos">Inactivos</option>
                </select>
              </label>
            </div>
          </div>

          <table className="tabla-usuarios">
            <thead>
              <tr>
                <th>ID de Usuario</th>
                <th>Usuario</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Más Información</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((r, idx) => (
                <tr key={idx}>
                  <td>{r.id_usuario}</td>
                  <td>{r.usuario}</td>
                  <td>{r.fecha}</td>
                  <td className={r.estado === "Activo" ? "activo" : "inactivo"}>
                    {r.estado}
                  </td>
                  <td className="info" onClick={() => handleSelectUser(r)}>
                    ℹ️
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="paginacion">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))}>
              ◀
            </button>
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                className={page === i + 1 ? "activo" : ""}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
              ▶
            </button>
          </div>
        </div>

        {/* Contenedor único para los gráficos */}
        <div className="charts-container">
          <div className="chart-block">
            <h3>Activos vs Inactivos</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" outerRadius={80} label>
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-block">
            <h3>Usuarios Nuevos por Semana</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Nuevos" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalles del Usuario</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedUser(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <h3 className="top">Top 3 Productos Favoritos</h3>
              <div className="productos">
                {productosFavoritos.map((p, i) => (
                  <div key={i} className="producto">
                    <img
                      src={p.imagen_url || "https://via.placeholder.com/50"}
                      alt={p.nombre}
                    />
                    <p>{p.nombre}</p>
                  </div>
                ))}
              </div>

              <h3 className="resumen ">Resumen de Compras</h3>
              <p>
                Total de compras: <b>{totalPedidos}</b>
              </p>
              <p>
                Promedio de gasto: <b>L {promedioGasto}</b>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
