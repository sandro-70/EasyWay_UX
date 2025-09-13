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
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [page, setPage] = useState(1);
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

  const filtered = useMemo(() => {
    return usuarios
      .filter(
        (r) =>
          (!filtroFecha || r.fecha.includes(filtroFecha)) &&
          (!filtroEstado || r.estado === filtroEstado)
      )
      .sort((a, b) => a.id_usuario - b.id_usuario); // ID más bajo arriba
  }, [filtroFecha, filtroEstado, usuarios]);

  const pageCount = Math.ceil(filtered.length / PageSize);
  const start = (page - 1) * PageSize;
  const pageItems = filtered.slice(start, start + PageSize);

  const COLORS = ["#1976d2", "#e85c0d"];

  // Cargar tabla de usuarios
  const fetchUsuarios = async () => {
    try {
      const res = await getUsuariosTabla();
      setUsuarios(res.data.rows); // tu API devuelve { rows: [...] }
    } catch (err) {
      console.error("Error cargando usuarios:", err);
    }
  };

  // Cargar usuarios nuevos por semana
  const fetchUsuariosNuevos = async () => {
    try {
      const res = await getClientesNuevos();
      console.log("Usuarios nuevos:", res.data); // Revisar consola para verificar datos
      setUsuariosNuevos(res.data.series || []);
    } catch (err) {
      console.error("Error cargando usuarios nuevos:", err);
    }
  };

  // Cargar estados para gráfico pie
  const fetchEstados = async () => {
    try {
      const res = await getUsuariosTabla(); // llamas a la misma API que llena la tabla
      const meta = res.data.meta;
      setPieData([
        { name: "Activos", value: meta.activos },
        { name: "Inactivos", value: meta.inactivos },
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
    fetchUsuarios();
    fetchEstados();
    fetchUsuariosNuevos();
  }, []);

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
                Filtrar fecha por:
                <select
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                >
                  <option value="">Todas</option>
                  <option value="2025-09-12">12/09/2025</option>
                  <option value="2025-09-11">11/09/2025</option>
                </select>
              </label>
              <label>
                Filtrar usuarios por:
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
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
