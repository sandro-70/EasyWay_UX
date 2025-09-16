// src/api/axiosInstance.js
import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:3001",
  withCredentials: true,
});

// ⬇️ ya lo tienes, lo dejamos
instance.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// ⬇️ NUEVO: cache-buster y no-cache en todos los GET
instance.interceptors.request.use((config) => {
  if ((config.method || "get").toLowerCase() === "get") {
    config.params = { ...(config.params || {}), _ts: Date.now() };
    config.headers = {
      ...(config.headers || {}),
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    };
  }
  return config;
});

export default instance;
