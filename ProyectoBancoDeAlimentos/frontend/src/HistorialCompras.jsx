import React, { useState, useEffect } from "react";
import { getHistorialComprasProductos } from "./api/PedidoApi.js";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const HistorialCompras = () => {
  const [pedidos, setPedidos] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;

  //API
  useEffect(() => {
    getHistorialComprasProductos()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setPedidos(res.data);
          setPedidoSeleccionado(res.data[0]);
        }
      })
      .catch((err) => console.error("Error al cargar historial:", err));
  }, []);

  const exportarCSV = () => {
    if (pedidos.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    const encabezados = [
      "Nombre",
      "Categoria",
      "Subtotal",
      "Estado",
      "Fecha de pedido",
    ];

    const filas = pedidos.map((prod) => [
      prod.nombre_producto || "",
      prod.categoria || "",
      `L. ${prod.subtotal_producto || "0"}`,
      prod.estado_pedido || "",
      prod.fecha_pedido
        ? new Date(prod.fecha_pedido).toLocaleDateString("es-HN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "-",
    ]);

    const csvContent = [encabezados, ...filas]
      .map((fila) => fila.map((campo) => `"${campo}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `historial_compras_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPaginas = Math.ceil(pedidos.length / registrosPorPagina);
  const indiceInicial = (paginaActual - 1) * registrosPorPagina;
  const indiceFinal = indiceInicial + registrosPorPagina;
  const pedidosPagina = pedidos.slice(indiceInicial, indiceFinal);

  const calcularGastosPorCategoria = () => {
    const mesActual = new Date().getMonth();
    const añoActual = new Date().getFullYear();

    const pedidosMesActual = pedidos.filter((pedido) => {
      if (!pedido.fecha_pedido) return false;
      const fechaPedido = new Date(pedido.fecha_pedido);
      return (
        fechaPedido.getMonth() === mesActual &&
        fechaPedido.getFullYear() === añoActual
      );
    });

    const gastosPorCategoria = {};

    pedidosMesActual.forEach((pedido) => {
      const categoria = pedido.categoria || "Sin categoría";
      const subtotal = parseFloat(pedido.subtotal_producto) || 0;

      if (gastosPorCategoria[categoria]) {
        gastosPorCategoria[categoria] += subtotal;
      } else {
        gastosPorCategoria[categoria] = subtotal;
      }
    });

    return gastosPorCategoria;
  };

  const gastosPorCategoria = calcularGastosPorCategoria();
  const categorias = Object.keys(gastosPorCategoria);
  const valores = Object.values(gastosPorCategoria);

  const colores = [
    "#ff9263ff",
    "#36A2EB",
    "#FFCE56",
    "#4b5fc0ff",
    "#9966FF",
    "#FF9F40",
    "#FF6384",
    "#3a6dd4ff",
    "#327f7fff",
    "#FF9F40",
  ];

  const pieChartData = {
    labels: categorias,
    datasets: [
      {
        label: "Gastos por Categoría",
        data: valores,
        backgroundColor: colores.slice(0, categorias.length),
        borderColor: colores
          .slice(0, categorias.length)
          .map((color) => color + "CC"),
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: L. ${context.parsed.toFixed(
              2
            )} (${percentage}%)`;
          },
        },
      },
    },
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPaginas <= maxVisible) {
      for (let i = 1; i <= totalPaginas; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, paginaActual - 2);
      let end = Math.min(totalPaginas, paginaActual + 2);

      if (paginaActual <= 3) {
        start = 1;
        end = 5;
      }

      if (paginaActual >= totalPaginas - 2) {
        start = totalPaginas - 4;
        end = totalPaginas;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPaginas) {
      setPaginaActual(page);
    }
  };

  const pageNumbers = generatePageNumbers();
  //TOTAL GASTOS DEL MES
  const totalGastosMes = valores.reduce((total, valor) => total + valor, 0);
  const mesActualNombre = new Date().toLocaleDateString("es-HN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.headerWrapper}>
        <h1 style={styles.header}>Hostorial de Compras</h1>
        <div style={styles.headerLineWrapper}>
          <div style={styles.headerLine}></div>
        </div>
      </div>
      <div style={styles.mainContainer}>
        <div style={styles.tableContainer}>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Nombre</th>
                  <th style={styles.tableHeader}>Categoria</th>
                  <th style={styles.tableHeader}>Subtotal</th>
                  <th style={styles.tableHeader}>Estado</th>
                  <th style={styles.tableHeader}>Fecha de pedido</th>
                </tr>
              </thead>
              <tbody>
                {pedidosPagina.map((prod, index) => (
                  <tr style={styles.tableRow} key={index}>
                    <td style={styles.tableCell}>{prod.nombre_producto}</td>
                    <td style={styles.tableCell}>{prod.categoria}</td>
                    <td style={styles.tableCell}>
                      L. {prod.subtotal_producto}
                    </td>
                    <td style={styles.tableCell}>
                      <span>{prod.estado_pedido}</span>
                    </td>
                    <td style={styles.tableCell}>
                      {prod.fecha_pedido
                        ? new Date(prod.fecha_pedido).toLocaleDateString(
                            "es-HN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 🔹 Paginación */}
          <div style={styles.paginationContainer}>
            <div style={styles.pagination}>
              <button
                onClick={() => handlePageChange(paginaActual - 1)}
                disabled={paginaActual === 1}
                style={{
                  ...styles.arrowButton,
                  ...(paginaActual === 1 ? styles.arrowButtonDisabled : {}),
                }}
              >
                &#9664;
              </button>

              {/* Números de página */}
              {pageNumbers.map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  style={{
                    ...styles.pageNumberButton,
                    ...(pageNum === paginaActual
                      ? styles.pageNumberButtonActive
                      : {}),
                  }}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                style={{
                  ...styles.arrowButton,
                  ...(paginaActual === totalPaginas
                    ? styles.arrowButtonDisabled
                    : {}),
                }}
              >
                &#9654;
              </button>
            </div>
          </div>

          <div style={styles.exportButtonContainer}>
            <button
              style={styles.exportButton}
              onClick={exportarCSV}
              title="Exportar historial completo a CSV"
            >
              Exportar
            </button>
          </div>
        </div>

        {/*gastos por categoría */}
        <div style={styles.rightContainer}>
          <h2 style={{ color: "#1976d2", marginBottom: "10px" }}>
            Gastos por Categoría
          </h2>

          <div style={styles.chartContainer}>
            {categorias.length > 0 ? (
              <Pie
                data={pieChartData}
                options={pieChartOptions}
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <div style={styles.noDataMessage}>
                <p>No hay datos de gastos para este mes</p>
              </div>
            )}
          </div>

          <div style={{ ...styles.chartContainer, marginTop: "15px" }}>
            <Bar
              data={pieChartData}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageWrapper: {
    position: "absolute",
    top: "145px",
    left: 0,
    right: 0,
    width: "100%",
    height: "calc(100% - 145px)",
    display: "flex",
    flexDirection: "column",
    padding: "20px",
  },
  mainContainer: {
    display: "flex",
    gap: "20px",
    height: "100%",
  },
  headerWrapper: {
    marginBottom: "20px",
  },
  header: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#f97316",
    textAlign: "left",
  },
  headerLineWrapper: {
    marginTop: "4px",
  },
  headerLine: {
    width: "100%",
    height: "2px",
    backgroundColor: "#f97316",
  },
  tableContainer: {
    flex: 2,
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "16px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
    height: "650px",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  tableWrapper: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    height: "480px",
    overflowY: "auto",
    flex: 1,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    borderRadius: "12px",
  },
  tableHeader: {
    padding: "12px",
    backgroundColor: "#004985",
    fontWeight: "600",
    textAlign: "left",
    borderBottom: "1px solid #d1d5db",
    color: "white",
  },
  tableRow: {
    borderBottom: "1px solid #e5e7eb",
    transition: "background-color 0.2s ease",
  },
  tableCell: {
    padding: "12px",
    textAlign: "left",
  },
  paginationContainer: {
    marginTop: "16px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "20px",
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  arrowButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "transparent",
    color: "#6b7280",
    cursor: "pointer",
    fontSize: "12px",
    transition: "all 0.2s ease",
  },
  arrowButtonDisabled: {
    color: "#d1d5db",
    cursor: "not-allowed",
  },
  pageNumberButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "transparent",
    color: "#6b7280",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s ease",
  },
  pageNumberButtonActive: {
    backgroundColor: "#fc8701",
    color: "white",
    transform: "scale(1.05)",
    boxShadow: "0 2px 4px rgba(252, 135, 1, 0.3)",
  },
  exportButtonContainer: {
    position: "absolute",
    bottom: "16px",
    right: "16px",
    zIndex: 10,
  },
  exportButton: {
    backgroundColor: "#fc8701",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "10px 20px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    boxShadow: "0 2px 4px rgba(252, 135, 1, 0.3)",
    transition: "all 0.2s ease",
  },
  rightContainer: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "16px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
    height: "650px",
    display: "flex",
    flexDirection: "column",
  },
  chartContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "16px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "15px",
  },
  noDataMessage: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#6b7280",
    fontSize: "16px",
  },
};

export default HistorialCompras;
