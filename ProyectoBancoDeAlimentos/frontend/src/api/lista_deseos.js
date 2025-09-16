//frontend/src/api/lista_deseos.js
import axiosInstance from "./axiosInstance"; 

// Función para obtener productos favoritos de un usuario
export function getProductosFav(id_usuario) {
  return axiosInstance.get(`/api/producto/favoritos?usuario=${id_usuario}`);
}
