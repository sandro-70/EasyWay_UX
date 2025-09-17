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