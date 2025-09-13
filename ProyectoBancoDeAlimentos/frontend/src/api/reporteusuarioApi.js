import axiosInstance from './axiosInstance';

export function getTopProductosUsuario(id_usuario){
    return axiosInstance.post('/api/reportes-usuario/top-3-productos', {id_usuario});
}
export function getProductosRecomendados(id_usuario){
    return axiosInstance.post('/api/reportes-usuario/top-3-recomendados', {id_usuario});
}
export function getDiasCompra(id_usuario){
    return axiosInstance.post('/api/reportes-usuario/top-dias-pedidos', {id_usuario});
}
export function getTotalAhorrado(id_usuario){
    return axiosInstance.post('/api/reportes-usuario/total-ahorrado', {id_usuario});
}

export function getUsuariosReporte(){
    return axiosInstance.get('/api/reportes-usuario/reporte');
}
export function getUsuariosTabla(){
    return axiosInstance.get('/api/reportes-usuario/reporte-filtrado');}
export function getClientesNuevos(){
    return axiosInstance.get('/api/reportes-usuario/clientes-nuevos');
}
