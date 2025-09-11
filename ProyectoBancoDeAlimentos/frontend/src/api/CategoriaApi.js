import axiosInstance from './axiosInstance';

export function ListarCategoria(){
    return axiosInstance.get('/api/categorias');
}
export function ObtenerCategoria(id){
    return axiosInstance.get(`/api/categorias/${id}`);
}
export function CrearCategoria(nombre, icono_categoria){
  return axiosInstance.post('/api/categorias', { nombre, icono_categoria });
}
export function ActualizarCategoria(id, nombre, icono_categoria){
  return axiosInstance.put(`/api/categorias/${id}`, { nombre, icono_categoria });
}
export function DesactivarProductosDeCategoria(id){
  return axiosInstance.delete(`/api/categorias/${id}`);
}