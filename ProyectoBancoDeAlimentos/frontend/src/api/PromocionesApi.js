import axiosInstance from './axiosInstance';

export function getPromociones(){
    return axiosInstance.get('/api/promociones');
}

export function getPromocionesOrden(){
    return axiosInstance.get('/api/promociones/listarorden');
}

export function getPromocionById(id){
    return axiosInstance.get(`/api/promociones/${id}`);
}

export function getPromocionesByUsuario(id_usuario){
    return axiosInstance.get(`/api/promociones/usuario/${id_usuario}`);
}

export function getDescuentosAplicadosPorUsuario(id_usuario){
    return axiosInstance.get(`/api/promociones/descuentos/aplicados/${id_usuario}`);
}

export function getPromocionesConDetallesURL(){
    return axiosInstance.get('/api/promociones/detalles');
}


export function aplicarDescuentoseleccionados(data) {
  return axiosInstance.patch('/api/promociones/descuentosMultiples', data);
}

export function crearPromocion(data) {
  return axiosInstance.post('/api/promociones', data);
}
export function desactivarPromocion(id) {
  return axiosInstance.put(`/api/promociones/desactivar/${id}`);
}
export function activarPromocion(id) {
  return axiosInstance.put(`/api/promociones/activar/${id}`);
}
export function actualizarPromocion(id, data) {
  return axiosInstance.put(`/api/promociones/actualizar/${id}`, data);
}