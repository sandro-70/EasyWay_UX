import axiosInstance from "./axiosInstance";

export function getHistorialComprasProductos() {
  return axiosInstance.get("/api/pedidos/get-historial");
}

export function getPedidosEntregados(id_usuario) {
  return axiosInstance.get(`/api/pedidos/get-pedido/${id_usuario}`);
}

export function crearPedido(
  id_usuario,
  direccion_envio,
  id_sucursal,
  id_cupon,
  descuento
) {
  return axiosInstance.post("/api/pedidos/crear-pedido/", {
    id_usuario,
    direccion_envio,
    id_sucursal,
    id_cupon,
    descuento,
  });
}

export function getPedidosConDetalles() {
  return axiosInstance.get("/api/pedidos/pedidos-con-detalles");
}
export function listarPedido(id_pedido) {
  return axiosInstance.get(`/api/pedidos/detalles/${id_pedido}`);
}
