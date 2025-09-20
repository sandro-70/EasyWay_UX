import axiosInstance from './axiosInstance';

export function GetALLCupones(id_usuario) {
    return axiosInstance.get(`/api/cupones/usuario/${id_usuario}`);
}

export function GetCupones() {
    return axiosInstance.get('/api/cupones/cupones');
}

export function desactivarCupon(id_cupon){
    return axiosInstance.patch(`/api/cupones/desactivar-cupon/${id_cupon}`);
}

export function addCupon(id_usuario){
    return axiosInstance.patch(`/api/cupones/agregar/${id_usuario}`);
}

export function editarCupon(id_cupon, codigo, descripcion, tipo, valor, uso_por_usuario, termina_en, activo){
    return axiosInstance.put(`/api/cupones/editar-cupon/${id_cupon}`, {codigo, descripcion, tipo, valor, uso_por_usuario, termina_en, activo});
}

export function crearCupon(id_usuario, codigo, descripcion, tipo, valor, uso_por_usuario, termina_en){
    return axiosInstance.post(`/api/cupones/crear-cupon/${id_usuario}`, {codigo, descripcion, tipo, valor, uso_por_usuario, termina_en});
}

export function usarCuponHistorial(id_cupon, id_usuario, id_pedido, fecha_usado) {
  return axiosInstance.post('/api/cupones/usar-cupon', {id_cupon, id_usuario, id_pedido, fecha_usado });
}

export function checkCuponUsuario(id_cupon, id_usuario) {
  return axiosInstance.get(`/api/cupones/check-uso/${id_cupon}/usuario/${id_usuario}`);
}