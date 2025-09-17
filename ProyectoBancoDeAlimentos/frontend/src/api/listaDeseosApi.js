import axiosInstance from './axiosInstance';

export function agregarAListaDeseos(id_usuario, id_producto) {
    return axiosInstance.get(`/api/lista-deseos/agregar/${id_usuario}`, {id_producto});
}

export function getListaDeseos(id_usuario) {
    return axiosInstance.get(`/api/lista-deseos/get-lista/${id_usuario}`);
}