import axiosInstance from './axiosInstance';


/**
 * Crea una dirección para el usuario dado. ESTE ES EL STRUCT QUE TIENEN QUE ENVIAR!!!
 * @param {Object} args
 * @param {number|string} args.id_usuario - ID del usuario (va en la URL)
 * @param {string} args.calle
 * @param {string} args.ciudad
 * @param {string} args.codigo_postal
 * @param {boolean} [args.predeterminada=false]
 * @param {number|string} args.id_municipio
 * 
 * const payload = {
      calle: "Av. Central 123",
      ciudad: "San Pedro",
      codigo_postal: "11001",
      predeterminada: true,
      id_municipio: 5,
    };
    const res = await addDireccion({ id_usuario, payload, token });
    const token = localStorage.getItem("token") || null;
    const res = await aplicarCupon({ codigo: codigo.trim() });    
    */
export function addDireccion({id_usuario,calle,ciudad,codigo_postal,predeterminada = false,id_municipio,}) {
  return axiosInstance.post(
    `/api/direcciones/${id_usuario}`,
    { calle, ciudad, codigo_postal, predeterminada, id_municipio }
  );
}

export function getDirecciones(id_usuario) {
  return axiosInstance.get(`/api/direcciones/${id_usuario}`);
}
export function getAllMunicipios() {
  return axiosInstance.get(`/api/direcciones/municipios`);
}
export function getAllDepartamentos() {
  return axiosInstance.get(`/api/direcciones/departamentos`);
}

export function setDireccionDefault({ id_usuario, id_direccion }) {
  return axiosInstance.put(`/api/direcciones/${id_usuario}/${id_direccion}`);
}
export function eliminarDireccionApi({ id_usuario, id_direccion }) {
  return axiosInstance.delete(`/api/direcciones/${id_usuario}/${id_direccion}`);
}

