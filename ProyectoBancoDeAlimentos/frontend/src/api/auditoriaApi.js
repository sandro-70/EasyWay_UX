import axiosInstance from './axiosInstance';

export function agregarAuditoria(id_producto, id_usuario, id_sucursal, cantidad, nombre_operacion){
    return axiosInstance.post('api/auditorias/agregar', {id_producto, id_usuario, id_sucursal, cantidad, nombre_operacion});
}

export function listarAuditorias(){
  return axiosInstance.get('api/auditorias/listar');
}

export function filtrarCantidadMayor(){
  return axiosInstance.get('api/auditorias/filtro-mayor');
}

export function filtrarCantidadMenor(){
  return axiosInstance.get('api/auditorias/filtro-menor');
}

export function filtrarEntradas(){
  return axiosInstance.get('api/auditorias/filtro-entrada');
}

export function filtrarSalidas(){
  return axiosInstance.get('api/auditorias/filtro-salida');
}