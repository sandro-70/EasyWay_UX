import axiosInstance from './axiosInstance';

export function getAllProducts(){
    return axiosInstance.get('/api/Inventario/');
}
export function getAllSucursales(){
    return axiosInstance.get('/api/Inventario/sucursales');
}

export function abastecerPorSucursalProducto(id_sucursal, id_producto, cantidad, modo='sumar'){
    return axiosInstance.put(`/api/Inventario/abastecer/sucursal/${id_sucursal}/producto/${id_producto}`, {cantidad, modo});
}

export function getMarcas(){
    return axiosInstance.get('/api/producto/marcas');
}

export function getProductosDestacados(){
    return axiosInstance.get('/api/producto/destacados');
}

export function getProductosTendencias(){
    return axiosInstance.get('/api/producto/tendencias');
}

export function getProductoById(id){   
    return axiosInstance.get(`/api/producto/${id}`);
}
export function getImagenesProducto(id){   
    return axiosInstance.get(`/api/producto/${id}/imagenes`);
}
export function getAllPorcentajeGanancia(){   
    return axiosInstance.get('/api/producto/porcentaje-ganancia');
}
export function updatePorcentajeGanancia(id, porcentaje_ganancia){
    return axiosInstance.put(`/api/producto/${id}/porcentaje-ganancia`, {porcentaje_ganancia});
}
export function getProductosRecomendados(){
    return axiosInstance.get('/api/producto/recomendados');
}
//cupones
export function addCupon(id_usuario, codigo_cupon){
    return axiosInstance.post(`/api/cupones/agregar/${id_usuario}`, {codigo: codigo_cupon});
}
export function getAllCupones(){
    return axiosInstance.get('/api/cupones/cupones');
}
export function getCuponesByUser(id_usuario){
    return axiosInstance.get(`/api/cupones/${id_usuario}`);
}
export function desactivarProducto(id_producto){
    return axiosInstance.patch(`/api/producto/desactivar/${id_producto}`);
}
export function actualizarProducto(id_producto, nombre, descripcion, precio_base, id_subcategoria, porcentaje_ganancia, id_marca, etiquetas, unidad_medida, activo){
    return axiosInstance.put(`/api/producto/actualizar-producto/${id_producto}`, {nombre, descripcion, precio_base, id_subcategoria, porcentaje_ganancia, id_marca, etiquetas, unidad_medida, activo});
}

export function crearProducto(nombre, descripcion, precio_base, id_subcategoria, porcentaje_ganancia, id_marca, etiquetas, unidad_medida){
    return axiosInstance.post('/api/Inventario/productos', {nombre, descripcion, precio_base, id_subcategoria, porcentaje_ganancia, id_marca, etiquetas, unidad_medida});
}

export function listarProductosporsucursal(id_sucursal){
    return axiosInstance.get(`/api/producto/sucursal/${id_sucursal}`);
}

export function addOrUpdateValoracion(id_producto, { puntuacion, comentario }) {
  const rating = Math.max(1, Math.min(5, parseInt(puntuacion, 10) || 0));
  return axiosInstance.post(
    `/api/producto/${id_producto}/valoraciones`,  // <-- PLURAL
    { puntuacion: rating, comentario: comentario ?? "" },
    { headers: { "Content-Type": "application/json" } }
  );
}

// (si lo usas después)
export function AddProductoFav(id_producto) {
  return axiosInstance.post(`/api/producto/${id_producto}/favoritos`);
}