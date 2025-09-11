import axiosInstance from './axiosInstance';

export function GetALLCupones(id_usuario) {
    return axiosInstance.get(`/api/cupones/usuario/${id_usuario}`);
}

export function GetCupones() {
    return axiosInstance.get('/api/cupones');
}