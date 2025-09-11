import axiosInstance from "./axiosInstance";

export function manejoUsuarioPrivilegios(id_usuario, privilegios, roles) {
    return axiosInstance.patch(`/api/roles-privilegios/privilegios/${id_usuario}`, {
        privilegios,
        roles
    });
}

