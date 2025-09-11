import React, { useState, useMemo } from "react";
import "./reporteUsuarios.css";

const ReporteUsuarios = () => {
  const [filtroFecha, setFiltroFecha] = useState("semana");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // Datos de ejemplo más completos
  const usuarios = [
    { id: "001", usuario: "marianvera", fecha: "15/08/2024", estado: "Activo" },
    {
      id: "002",
      usuario: "juanperez",
      fecha: "14/08/2024",
      estado: "Inactivo",
    },
    { id: "003", usuario: "anagarcia", fecha: "13/08/2024", estado: "Activo" },
    {
      id: "004",
      usuario: "carloslopez",
      fecha: "12/08/2024",
      estado: "Activo",
    },
    { id: "005", usuario: "mariarod", fecha: "11/08/2024", estado: "Inactivo" },
    { id: "006", usuario: "pedromart", fecha: "10/08/2024", estado: "Activo" },
    { id: "007", usuario: "laurajim", fecha: "09/08/2024", estado: "Inactivo" },
    { id: "008", usuario: "davidgon", fecha: "08/08/2024", estado: "Inactivo" },
    { id: "009", usuario: "elenasanz", fecha: "07/08/2024", estado: "Activo" },
  ];

  // Datos para gráficos
  const datosMensuales = {
    enero: 45,
    febrero: 78,
    marzo: 120,
  };

  // Filtrar usuarios según el estado seleccionado
  const usuariosFiltrados = useMemo(() => {
    if (filtroEstado === "todos") return usuarios;
    return usuarios.filter((user) =>
      filtroEstado === "activos"
        ? user.estado === "Activo"
        : user.estado === "Inactivo"
    );
  }, [filtroEstado]);

  // Calcular estadísticas basadas en el filtro
  const estadisticas = useMemo(() => {
    const total = usuarios.length;
    const activos = usuarios.filter((u) => u.estado === "Activo").length;
    const inactivos = usuarios.filter((u) => u.estado === "Inactivo").length;

    return {
      activos: ((activos / total) * 100).toFixed(1),
      inactivos: ((inactivos / total) * 100).toFixed(1),
      nuevosClientes: 156, // Este valor podría calcularse dinámicamente
    };
  }, []);

  return (
    <div
      className="reporte-usuarios"
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
      {/* Header y Filtros */}
      <div className="reporte-header">
        <h1>Reporte de Usuarios</h1>
        <div className="filtros-container">
          <div className="filtro-group">
            <label>Filtrar fecha por:</label>
            <select
              className="filtro-select"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
            >
              <option value="semana">Semana</option>
              <option value="mes">Mes</option>
              <option value="trimestre">Trimestre</option>
              <option value="anio">Año</option>
            </select>
          </div>

          <div className="filtro-group">
            <label>Filtrar usuarios por:</label>
            <select
              className="filtro-select"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="reporte-grid">
        {/* Tabla de Usuarios */}
        <div className="tabla-usuarios">
          <h2>Total Usuarios Registrados</h2>
          <div className="tabla-header">
            <span>ID</span>
            <span>Usuario</span>
            <span>Fecha</span>
            <span>Estado</span>
            <span>Acción</span>
          </div>

          {usuariosFiltrados.map((user, index) => (
            <div key={index} className="usuario-row">
              <span className="id-usuario">{user.id}</span>
              <span className="nombre-usuario">{user.usuario}</span>
              <span className="fecha-registro">{user.fecha}</span>
              <span
                className={`estado-badge ${
                  user.estado.toLowerCase() === "activo"
                    ? "estado-activo"
                    : "estado-inactivo"
                }`}
              >
                {user.estado}
              </span>
              <button className="btn-mas-info">↑</button>
            </div>
          ))}
        </div>

        {/* Estadísticas */}
        <div className="estadisticas-container">
          {/* Activos vs Inactivos */}
          <div className="stats-card">
            <h3>Activos vs Inactivos</h3>
            <div className="grafico-circular-container">
              <div className="grafico-circular">
                <div className="grafico-centro">
                  <span className="porcentaje-total">100%</span>
                </div>
              </div>
            </div>
            <div className="leyendas">
              <div className="leyenda-item">
                <div className="leyenda-color leyenda-inactivos"></div>
                <span className="leyenda-texto">Inactivos</span>
                <span className="leyenda-porcentaje">
                  {estadisticas.inactivos}%
                </span>
              </div>
              <div className="leyenda-item">
                <div className="leyenda-color leyenda-activos"></div>
                <span className="leyenda-texto">Activos</span>
                <span className="leyenda-porcentaje">
                  {estadisticas.activos}%
                </span>
              </div>
            </div>
          </div>

          {/* Clientes Nuevos */}
          <div className="stats-card">
            <h3>Clientes nuevos</h3>
            <div className="grafico-barras-clientes">
              {Object.entries(datosMensuales).map(([mes, cantidad]) => (
                <div key={mes} className="barra-mes">
                  <div
                    className="barra-altura"
                    style={{ height: `${(cantidad / 150) * 100}px` }}
                  ></div>
                  <span className="barra-label">
                    {mes.charAt(0).toUpperCase() + mes.slice(1)}
                  </span>
                </div>
              ))}
            </div>
            <div className="total-clientes">
              <div className="total-numero">{estadisticas.nuevosClientes}</div>
              <div className="total-texto">Usuarios</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReporteUsuarios;
