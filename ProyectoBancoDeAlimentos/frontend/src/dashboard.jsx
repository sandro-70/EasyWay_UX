import "./dashboard.css";
import Sidebar from "./sidebar";
import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Icon } from "@iconify/react";
import MiniChart from "./components/miniChart";
import MiniChart2 from "./components/miniChart2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";

// APIs
import {
  getPromedioVentas4Meses,
  getPedidosPorMes,
  ingresosPromocionesUltimos4Meses,
  usuariosMasGastos,
  getStock,
} from "./api/reporteusuarioApi";
import { getAllSucursales } from "./api/InventarioApi"; // ⬅️ NUEVO

function Dashboard() {
  const { moveButton } = useOutletContext();

  ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
  );

  // ======= STATE =======
  const [inventoryRaw, setInventoryRaw] = useState([]); // filas crudas por sucursal
  const [inventory, setInventory] = useState([]); // lo que se muestra (filtrado/ordenado)
  const [activeUsers, setActiveUsers] = useState([]);
  const [ventasMeses, setVentasMeses] = useState([]);
  const [promedio4, setPromedio4] = useState(0);
  const [pedidosMeses, setPedidosMeses] = useState([]);
  const [promoIngresos, setPromoIngresos] = useState([]);
  const [kpis, setKpis] = useState({ hoy: null, semana: null, mes: null, anio: null });

  // Sucursales (filtro)
  const [sucursales, setSucursales] = useState([]);
  const [sucursalId, setSucursalId] = useState("all"); // "all" = todas
  const [pickerOpen, setPickerOpen] = useState(false);

  // ======= HELPERS =======
  const monthLabel = (ym) => {
    try {
      const d = new Date(`${ym}-01T00:00:00`);
      return d.toLocaleString("es-ES", { month: "short" }).replace(".", "");
    } catch {
      return ym;
    }
  };

  const addLps = (num) => {
    if (num == null) return "—";
    return num + ". Lps";
  }

  const lastNMonthsAsc = (rows, n) =>
    [...rows].sort((a, b) => (a.mes < b.mes ? -1 : 1)).slice(Math.max(0, rows.length - n));

  // ======= FETCH =======
  useEffect(() => {
    const fetchAll = async () => {
      try {
        // 1) Stock (por sucursal)
        const res = await getStock();
        const arr = Array.isArray(res?.data) ? res.data : [];

        // Normaliza para no romper aunque cambie el shape
        const norm = arr.map((r) => ({
          id_producto: r?.id_producto ?? r?.producto?.id_producto ?? null,
          producto:
            r?.nombre_producto ??
            r?.producto?.nombre ??
            r?.producto_nombre ??
            "-",
          stock: Number(
            r?.stock ?? r?.stock_disponible ?? r?.cantidad ?? r?.cantidad_total ?? 0
          ),
          id_sucursal:
            r?.id_sucursal ??
            r?.sucursal?.id_sucursal ??
            r?.sucursal_producto?.id_sucursal ??
            r?.idSucursal ??
            null,
          sucursal:
            r?.nombre_sucursal ??
            r?.sucursal?.nombre_sucursal ??
            r?.sucursal_producto?.sucursal?.nombre_sucursal ??
            r?.sucursal_nombre ??
            "",
        }));

        setInventoryRaw(norm);

        // 2) Sucursales (catálogo)
        try {
          const sres = await getAllSucursales();
          const list = Array.isArray(sres?.data) ? sres.data : [];
          // Toma id y nombre con varios “alias” posibles
          const uniq = [];
          const seen = new Set();
          for (const s of list) {
            const id =
              s?.id_sucursal ?? s?.id ?? s?.codigo ?? s?.sucursal?.id_sucursal ?? null;
            const nombre =
              s?.nombre_sucursal ?? s?.nombre ?? s?.sucursal?.nombre_sucursal ?? "Sucursal";
            if (id != null && !seen.has(String(id))) {
              seen.add(String(id));
              uniq.push({ id: String(id), nombre });
            }
          }
          setSucursales(uniq);
        } catch (e) {
          // si falla, mantenemos solo "Todas"
          setSucursales([]);
          console.warn("[getAllSucursales] error:", e);
        }
      } catch (e) {
        console.error("[getStock] error:", e);
        setInventoryRaw([]);
      }

      // Ventas 4 meses
      try {
        const res = await getPromedioVentas4Meses();
        const ventas = Array.isArray(res?.data?.ventas_por_mes) ? res.data.ventas_por_mes : [];
        setVentasMeses(ventas);
        setPromedio4(Number(res?.data?.promedio_4_meses ?? 0));
      } catch (e) {
        console.error("[getPromedioVentas4Meses] error:", e);
        setVentasMeses([]);
        setPromedio4(0);
      }

      // Pedidos por mes
      try {
        const res = await getPedidosPorMes();
        const pedidos = Array.isArray(res?.data?.pedidos_por_mes) ? res.data.pedidos_por_mes : [];
        setPedidosMeses(pedidos);
      } catch (e) {
        console.error("[getPedidosPorMes] error:", e);
        setPedidosMeses([]);
      }

      // Ingresos por promociones
      try {
        const res = await ingresosPromocionesUltimos4Meses();
        const rows = Array.isArray(res?.data?.ingresos_por_promociones)
          ? res.data.ingresos_por_promociones
          : [];
        setPromoIngresos(rows);
      } catch (e) {
        console.error("[ingresosPromocionesUltimos4Meses] error:", e);
        setPromoIngresos([]);
      }

      // Usuarios más gastos
      try {
        const res = await usuariosMasGastos();
        const rows = Array.isArray(res?.data) ? res.data : [];
        setActiveUsers(
          rows.map((u) => ({
            nombre: u?.nombre_usuario ?? "-",
            compras: Number(u?.cantidad_compras ?? 0),
            gastosTotales: Number(u?.total_gastado ?? 0),
          }))
        );
      } catch (e) {
        console.error("[usuariosMasGastos] error:", e);
        setActiveUsers([]);
      }
    };

    fetchAll();
  }, []);

  // Filtrado por sucursal + “críticos”
  useEffect(() => {
    const base = inventoryRaw.filter((r) => r.producto && r.producto !== "-");

    const bySucursal =
      sucursalId === "all"
        ? base
        : base.filter((r) => String(r.id_sucursal) === String(sucursalId));

    // Críticos: <= 5 (si no hay críticos, muestra los más bajos igual)
    const critical = bySucursal.filter((r) => Number.isFinite(r.stock) && r.stock <= 40);
    const display = (critical.length ? critical : bySucursal)
      .slice() // copia
      .sort((a, b) => a.stock - b.stock);

    setInventory(display);
  }, [inventoryRaw, sucursalId]);

  // ======= KPIs derivados de ventas (Mes / Año) =======
  useEffect(() => {
    const now = new Date();
    const ymNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const ventasMes = ventasMeses.find((v) => v.mes === ymNow)?.ventas_totales ?? null;
    const ventasAnio = ventasMeses
      .filter((v) => v.mes.startsWith(String(now.getFullYear())))
      .reduce((acc, v) => acc + Number(v.ventas_totales || 0), 0);

    setKpis({
      hoy: null,
      semana: null,
      mes: ventasMes,
      anio: ventasAnio || (ventasMes === null ? null : ventasMes),
    });
  }, [ventasMeses]);

  // ======= DATASETS CHART.JS =======
  const lineData = useMemo(() => {
    const rows = lastNMonthsAsc(ventasMeses, 4);
    return {
      labels: rows.map((r) => monthLabel(r.mes)),
      datasets: [
        {
          label: "Ventas",
          data: rows.map((r) => Number(r.ventas_totales || 0)),
          borderColor: "#f0833e",
          backgroundColor: "#ffac77",
          tension: 0.35,
        },
      ],
    };
  }, [ventasMeses]);

  const pieData = useMemo(() => {
    const rows = lastNMonthsAsc(pedidosMeses, 4);
    return {
      labels: rows.map((r) => monthLabel(r.mes)),
      datasets: [
        {
          label: "Pedidos",
          data: rows.map((r) => Number(r.total_pedidos || 0)),
          backgroundColor: ["#f0833e", "#ffac77", "#2b6daf", "#2ca9e3"],
          borderColor: ["#f0833e", "#ffac77", "#2b6daf", "#2ca9e3"],
          borderWidth: 1,
        },
      ],
    };
  }, [pedidosMeses]);

  const promoBarData = useMemo(() => {
    const rows = lastNMonthsAsc(promoIngresos, 4);
    return {
      labels: rows.map((r) => monthLabel(r.mes)),
      datasets: [
        {
          label: "Ingresos por promociones",
          data: rows.map((r) => Number(r.ingreso_con_promocion || 0)),
          backgroundColor: "#ffac77",
          borderColor: "#f0833e",
        },
      ],
    };
  }, [promoIngresos]);

  // ======= RENDER =======
  const cardCls =
    "bg-[#fee9d6] rounded-xl shadow-neutral-600 shadow-sm p-6 flex flex-col justify-between h-[320px]";
  const cardBase =
    "bg-[#fee9d6] rounded-xl shadow-neutral-600 shadow-sm p-6 flex flex-col items-center justify-between";
  const H_TOP = "h-[320px]";
  const H_BOTTOM = "h-[320px]";

  // Encabezado “Stock” clicable + etiqueta de sucursal
  const sucursalTxt =
    sucursalId === "all"
      ? "Todas"
      : (sucursales.find((s) => String(s.id) === String(sucursalId))?.nombre ?? "Sucursal");
  const stockHeader = (
    <span
      onClick={() => setPickerOpen((v) => !v)}
      title="Filtrar por sucursal"
      style={{ cursor: "pointer", userSelect: "none" }}
    >
      Stock {sucursalId === "all" ? "" : `· ${sucursalTxt}`} ▾
    </span>
  );



  return (
    <div className=" px-12 " style={{ ...styles.fixedShell, backgroundColor: "#f3f4f6" }}>
      <div
        className={`flex flex-col w-full  pt-2 px-8 transition-all duration-300  ${
          moveButton ? "ml-44" : "ml-0"
        }`}
      >
        <div className="">
          <div className="text-left">
            <h1 className="font-roboto font-medium text-[#f0833e] text-6xl  pb-1 pl-6">
              Dashboard
            </h1>
            <hr className="bg-[#f0833e] h-[2px]"></hr>
          </div>

          <div className="flex flex-row gap-6 px-4 justify-center">
            {/* Columna izquierda */}
            <div className="grid grid-cols-1 min-w-[450px] max-h-[580px] grid-rows-2 h-full gap-4 items-stretch pt-2">
              <div className="sm_grid px-16 space-y-2">
                <p className="pl-0 ">Inventario Critico</p>

                {/* Contenedor relativo para el mini–selector */}
                <div style={{ position: "relative " }}>
                  <MiniChart
                    title1="Producto"
                    title2={stockHeader} // ⬅️ clicable
                    data={inventory}
                    itemsPerPage={4}
                    renderRow={(item) => (
                      <>
                        <span>{item.producto}</span>
                        <span
                          className={`font-bold ${
                            item.stock <= 2
                              ? "text-red-600"
                              : item.stock <= 5
                              ? "text-orange-500"
                              : "text-yellow-500"
                          }`}
                        >
                          {item.stock}
                        </span>
                      </>
                    )}
                  />

                  {/* Mini–dropdown (no cambia el diseño, solo se superpone) */}
                  {pickerOpen && (
                    <div
                      className="bg-white rounded-md border shadow-md"
                      style={{
                        position: "absolute",
                        right: 12,
                        top: 8,
                        zIndex: 20,
                        minWidth: 180,
                        padding: 8,
                      }}
                    >
                      <div
                        className="px-2 py-1 hover:bg-gray-100 cursor-pointer rounded"
                        onClick={() => {
                          setSucursalId("all");
                          setPickerOpen(false);
                        }}
                      >
                        Todas las sucursales
                      </div>
                      <div className="h-px bg-gray-200 my-1" />
                      {sucursales.map((s) => (
                        <div
                          key={s.id}
                          className="px-2 py-1 hover:bg-gray-100 cursor-pointer rounded"
                          onClick={() => {
                            setSucursalId(String(s.id));
                            setPickerOpen(false);
                          }}
                        >
                          {s.nombre}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="sm_grid px-16">
                <p className="pl-4">Total de Pedidos</p>
                <div className="flex w-full h-[232px] px-2 items-center justify-center ">
                  <Pie
                    data={pieData}
                    width={300}
                    height={300}
                    options={{ maintainAspectRatio: false }}
                    style={{ width: "300px", height: "300px" }}
                  />
                </div>
              </div>
            </div>

            {/* Columna derecha */}
            <div className="grid grid-cols-2 grid-rows-9 max-h-[580px] gap-4 pt-2 w-full h-full items-stretch">
              <div className="lg_grid">
                <div className="flex flex-row justify-center items-center gap-2">
                  <p className="text-xl font-bold">Ventas Totales</p>
                  <Icon icon="flat-color-icons:sales-performance" className="text-4xl" />
                </div>

                <div className="flex flex-row gap-2 justify-center font-medium pt-2">
                  <p>Hoy: </p>
                  <p className="text-[#4CAF50]">{addLps(kpis.hoy) ?? "—"}</p>
                  <p>|</p>
                  <p>Esta Semana:</p>
                  <p className="text-[#4CAF50]">{addLps(kpis.semana) ?? "—"}</p>
                  <p>|</p>
                  <p>Este Mes: </p>
                  <p className="text-[#4CAF50]">{addLps(kpis.mes) ?? "—"}</p>
                  <p>|</p>
                  <p>Este año: </p>
                  <p className="text-[#4CAF50]">{addLps(kpis.anio) ?? "—"}</p>
                </div>

                <div className="flex w-full h-[220px] px-2 items-center justify-center ">
                  <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>

              <div className="bg-[#fee9d6] h-full row-span-4 col-span-1 py-2 px-12 rounded-xl shadow-neutral-600 shadow-sm items-center text-center">
                <p className="text-xl font-bold">Promociones mas Efectivas</p>
                <div className="flex w-full h-[200px] px-2 items-center justify-center ">
                  <Bar data={promoBarData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>

              <div className="bg-[#fee9d6] h-full row-span-4 col-span-1 py-2 flex flex-col justify-center space-y-2 rounded-xl shadow-neutral-600 shadow-sm items-center text-center">
                <p className="text-xl font-bold">Usuarios mas Activos </p>
                <MiniChart2
                  title1="Nombre"
                  title2="Compras"
                  title3="Gastos"
                  data={activeUsers}
                  itemsPerPage={3}
                  renderRow={(item) => (
                    <>
                      <span>{item.nombre}</span>
                      <span>{item.compras}</span>
                      <span>{item.gastosTotales+". Lps"}</span>
                    </>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  fixedShell: {
    position: "absolute",
    top: "90px",
    left: 0,
    right: 0,
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
};

export default Dashboard;
