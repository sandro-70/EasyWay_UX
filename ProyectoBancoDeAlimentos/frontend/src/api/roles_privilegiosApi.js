import axiosInstance from "./axiosInstance";

export function manejoUsuarioPrivilegios(id_usuario, id_privilegios = []) {
  return axiosInstance.patch(
    `/api/roles-privilegios/privilegios/${id_usuario}`,
    { id_privilegios }
  );
}

export function getRolesYPrivilegiosDeUsuario(id_usuario) {
  return axiosInstance.get(`/api/roles-privilegios/mostrar-roles-privilegios-usuario/${id_usuario}`);
}