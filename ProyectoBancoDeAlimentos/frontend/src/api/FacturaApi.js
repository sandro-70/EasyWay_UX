import axiosInstance from './axiosInstance';

export function getAllFacturasByUserwithDetails() {
  return axiosInstance.get('/api/facturas');
}

export function getResumenFacturasUsuario(id_usuario) {
  return axiosInstance.get(`/api/facturas/resumen/${id_usuario}`);
}