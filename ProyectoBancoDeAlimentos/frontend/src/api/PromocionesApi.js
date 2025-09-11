import axiosInstance from './axiosInstance';

export function getPromociones(){
    return axiosInstance.get('/api/promociones');
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
