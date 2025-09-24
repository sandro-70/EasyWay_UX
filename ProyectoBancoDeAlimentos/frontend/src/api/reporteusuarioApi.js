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

export function getUsuariosTabla(params){
    return axiosInstance.get('/api/reportes-usuario/reporte-filtrado/', { params });
}
export function getClientesNuevos(params){
    return axiosInstance.get('/api/reportes-usuario/clientes-nuevos', { params });
}

export function getVentasConFiltros(params) {
    return axiosInstance.get('/api/reportes/ventas', { params });
}

export function exportVentasExcel(params) {//no funciona bien
    return axiosInstance.get('/api/reportes/ventas/export/excel', { params, responseType: 'blob' });
}
export function exportVentasPDF(params) {//no funciona bien
    return axiosInstance.get('/api/reportes/ventas/export/pdf', { params, responseType: 'blob' });
}

export function getPromedioVentas4Meses(){
    return axiosInstance.get('/api/reportes/reporte-4meses');
}

export function getPedidosPorMes(){
    return axiosInstance.get('/api/reportes/pedido-mes');
}

//esta es la unica que no probe
export function ingresosPromocionesUltimos4Meses(){
    return axiosInstance.get('/api/reportes/ingresos-promocion');
}

export function usuariosMasGastos(){
    return axiosInstance.get('/api/reportes/usuarios-gastos');
}

export function getStock(){
    return axiosInstance.get('/api/producto/get-stock-sucursal');
}

export function getInfoUsuario(id_pedido){
    return axiosInstance.get(`/api/reportes/get-info-usuario/${id_pedido}`);
}