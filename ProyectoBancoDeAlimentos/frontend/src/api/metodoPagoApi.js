import axiosInstance from "./axiosInstance";

//
export function getAllMetodoPago() {
  return axiosInstance.get("/api/metodo-pago/");
}

export function createMetodoPago(payload) {
  return axiosInstance.post("/api/metodo-pago/", payload);
}

export function updateMetodoPago(id, payload) {
  return axiosInstance.put(`/api/metodo-pago/${id}`, payload);
}

export function deleteMetodoPago(id) {
  return axiosInstance.delete(`/api/metodo-pago/${id}`);
}

export function setMetodoPagoDefault(id){
    return axiosInstance.patch(`/api/metodo-pago/default/${id}`);
}
