import "./dashboard.css";
import Sidebar from "./sidebar";
import React, { useState } from "react";
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

function Dashboard() {
  const { moveButton, setMoveButton } = useOutletContext();

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
  const inventory = [
    { producto: "Leche", stock: 2 },
    { producto: "Huevos", stock: 8 },
    { producto: "Pan", stock: 5 },
    { producto: "Cafe", stock: 4 },
    { producto: "Azúcar", stock: 10 },
    { producto: "Mantequilla", stock: 3 },
  ];
  const activeUsers = [
    { nombre: "Juan Pérez", compras: 5, gastosTotales: 1200 },
    { nombre: "María López", compras: 3, gastosTotales: 800 },
    { nombre: "Carlos Gómez", compras: 7, gastosTotales: 1950 },
    { nombre: "Ana Rodríguez", compras: 10, gastosTotales: 3200 },
    { nombre: "Luis Hernández", compras: 2, gastosTotales: 4500 },
    { nombre: "Camila Morales", compras: 8, gastosTotales: 2750 },
    { nombre: "Pedro Castillo", compras: 6, gastosTotales: 1500 },
    { nombre: "Laura Torres", compras: 4, gastosTotales: 980 },
    { nombre: "Diego Ramírez", compras: 9, gastosTotales: 800 },
    { nombre: "Fernanda Díaz", compras: 1, gastosTotales: 200 },
  ];

  const data = {
    labels: ["Ene", "Feb", "Mar", "Abr"],
    datasets: [
      {
        label: "Ingresos",
        data: [3200, 8900, 5000, 4700],
        borderColor: "#4CAF50",
        backgroundColor: "#4CAF50",
      },
      {
        label: "Gastos",
        data: [2200, 2500, 2400, 2600],
        borderColor: "#FF5722",
        backgroundColor: "#FF5722",
      },
    ],
  };
  const data2 = [
    {
      id: "Ingresos Brutos",
      data: [
        { x: "Ene", y: 3200 },
        { x: "Feb", y: 8900 },
        { x: "Mar", y: 5000 },
        { x: "Abr", y: 4700 },
      ],
    },
    {
      id: "Ingresos Netos",
      data: [
        { x: "Ene", y: 2200 },
        { x: "Feb", y: 2500 },
        { x: "Mar", y: 2400 },
        { x: "Abr", y: 2600 },
      ],
    },
  ];
  const data3 = [
    { year: "2025", DescuentoVIP: 50 },
    { year: "2026", BlackFriday: 120 },
    { year: "2027", PromoVerano: 75 },
  ];
  return (
    <div
      className=" px-12 "
      style={{ ...styles.fixedShell, backgroundColor: "#f3f4f6" }}
    >
      <div
        className={`flex flex-col w-full  pt-2 px-8 transition-all duration-300   ${
          moveButton ? "ml-44" : "ml-0"
        }`}
      >
        <div className="">
          <div className="text-left">
            <h1 className="font-roboto font-medium text-[#204778] text-6xl justify-center pb-1 pl-6">
              Dashboard
            </h1>
            <hr className="bg-[#204778] h-[2px]"></hr>
          </div>
          <div className="flex flex-row gap-6 px-4 justify-center">
            <div className="grid grid-cols-1 min-w-[450px] max-h-[580px] grid-rows-2 h-full gap-4 items-stretch pt-2">
              <div className="sm_grid px-16 space-y-2">
                <p className="pl-0">Inventario Critico</p>{" "}
                <MiniChart
                  title1="Producto"
                  title2="Stock"
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
              </div>
              <div className="sm_grid px-16">
                <p className="pl-4">Total de Pedidos</p>
                {
                  //<MyPie data={data} />
                }
                <div className="flex w-full h-[232px] px-2 items-center justify-center ">
                  <Pie
                    data={data}
                    width={300} // internal resolution
                    height={300} // internal resolution
                    options={{ maintainAspectRatio: false }}
                    style={{ width: "300px", height: "300px" }} // visual size
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 grid-rows-9 max-h-[580px] gap-4 pt-2 w-full h-full items-stretch">
              <div className="lg_grid">
                <div className="flex flex-row justify-center items-center gap-2">
                  <p className="text-xl font-bold">Ventas Totales</p>{" "}
                  <Icon
                    icon="flat-color-icons:sales-performance"
                    className="text-4xl"
                  ></Icon>
                </div>
                <div className="flex flex-row gap-2 justify-center font-medium pt-2">
                  <p>Hoy: </p>
                  <p className="text-[#4CAF50]">{"ventasHoy"}</p>
                  <p>|</p>
                  <p>Esta Semana:</p>
                  <p className="text-[#4CAF50]">{"ventasSemana"}</p>
                  <p>|</p>
                  <p>Este Mes: </p>
                  <p className="text-[#4CAF50]">{"ventasMes"}</p>
                  <p>|</p> <p>Este año: </p>
                  <p className="text-[#4CAF50]">{"ventasAño"}</p>
                </div>
                <div className="flex w-full h-[220px] px-2 items-center justify-center ">
                  <Line
                    data={data}
                    options={{ responsive: true, maintainAspectRatio: false }}
                  />
                </div>
              </div>
              <div className="bg-[#fee9d6] h-full row-span-4 col-span-1 py-2 px-12 rounded-xl shadow-neutral-600 shadow-sm items-center text-center">
                <p className="text-xl font-bold">Promociones mas Efectivas </p>
                <div className="flex w-full h-[200px] px-2 items-center justify-center ">
                  <Bar
                    data={data}
                    options={{ responsive: true, maintainAspectRatio: false }}
                  />
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
                      <span>{item.gastosTotales}</span>
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
