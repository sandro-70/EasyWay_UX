import axiosInstance from "./axiosInstance";

export function getHistorialComprasProductos() {
  return axiosInstance.get("/api/pedidos/get-historial");
}

export function getPedidosEntregados(id_usuario) {
  return axiosInstance.get(`/api/pedidos/get-pedido/${id_usuario}`);
}

export function getPedidosEstado(id_usuario) {
  return axiosInstance.get(`/api/pedidos/get-pedido-estado/${id_usuario}`);
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
export function getPedidosConDetallesUsuario(id_usuario) {
  return axiosInstance.get(
    `/api/pedidos/mis-pedidos-con-detalles/${id_usuario}`
  );
}
export function listarPedido(id_pedido) {
  return axiosInstance.get(`/api/pedidos/detalles/${id_pedido}`);
}

export function actualizarEstadoPedido(id_pedido, id_estado_pedido) {
  return axiosInstance.patch(`/api/pedidos/actualizar-estado/${id_pedido}`, {
    id_estado_pedido,
  });
}

export function getReportePedidos() {
  return axiosInstance.get("/api/reportes/reporte-pedidos");
}