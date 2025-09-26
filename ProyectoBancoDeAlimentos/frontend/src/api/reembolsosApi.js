import axiosInstance from "./axiosInstance";

export function agregarReembolso(id_pedido, motivo) {
  return axiosInstance.post('/api/reembolsos/agregar', { id_pedido , motivo});
}

export function listarReembolsos() {
  return axiosInstance.get('/api/reembolsos/listar');
}

export function agregarPolitica(descripcion) {
  return axiosInstance.get('/api/politicas-reembolso/agregar', { descripcion});
}

export function listarPoliticas() {
  return axiosInstance.get('/api/politicas-reembolso/listar');
}

export function eliminarPolitica(id) {
  return axiosInstance.delete(`/api/politicas-reembolso/eliminar/${id}`);
}