import axiosInstance from "./axiosInstance";

export function listarSubcategoria() {
  return axiosInstance.get("/api/subcategorias");
}

export function obtenerSubcategoria(id) {
  return axiosInstance.get(`/api/subcategorias/${id}`);
}

export function crearSubcategoria(nombre, id_categoria_padre) {
  return axiosInstance.post("/api/subcategorias", {
    nombre,
    id_categoria_padre,
  });
}
export function actualizarSubcategoria(id, nombre, id_categoria_padre) {
  return axiosInstance.put(`/api/subcategorias/${id}`, {
    nombre,
    id_categoria_padre,
  });
}
export function desactivarSubcategoria(id) {
  return axiosInstance.delete(`/api/subcategorias/${id}`);
}

export function listarPorCategoria(id_categoria_padre) {
  return axiosInstance.get(`/api/subcategorias/por-categoria/${id_categoria_padre}`);
}