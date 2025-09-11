import axiosInstance from './axiosInstance';

export function getAllFacturasByUserwithDetails() {
  return axiosInstance.get('/api/facturas');
}
