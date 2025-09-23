import axiosInstance from './axiosInstance';

export function agregarAListaDeseos(id_usuario, id_producto) {
  // el backend espera POST y body { id_producto }
  return axiosInstance.post(
    `/api/lista-deseos/agregar/${id_usuario}`,
    { id_producto }
  );
}
export function getListaDeseos(id_usuario) {
    return axiosInstance.get(`/api/lista-deseos/get-lista/${id_usuario}`);
}

export function eliminarDeListaDeseos(id_usuario, id_producto) {
  return axiosInstance.delete(`/api/lista-deseos/eliminar/${id_usuario}/${id_producto}`);
}

export function vaciarListaDeseos(id_usuario) {
  return axiosInstance.delete(`/api/lista-deseos/vaciar/${id_usuario}`);
}