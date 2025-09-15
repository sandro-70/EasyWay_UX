import axiosInstance from "./axiosInstance";

export default function LoginUser({ correo, contraseña, contrasena }) {
  const pass = contraseña;
  if (!correo || !pass) {
    return Promise.reject(new Error("Faltan credenciales"));
  }
  return axiosInstance.post("/api/auth/login", { correo, contraseña: pass });
}

export function RegistrarUser({
  nombre,
  apellido,
  correo,
  contraseña,
  id_rol,
  telefono,
}) {
  if (!nombre || !apellido || !correo || !contraseña) {
    return Promise.reject(new Error("Faltan datos obligatorios"));
  }
  return axiosInstance.post("/api/registrarse", {
    nombre,
    apellido,
    correo,
    contraseña,
    telefono,
    id_rol,
  });
}

export function InformacionUser(id) {
  return axiosInstance.get(`/api/MiPerfil/info/${id}`);
}
// Devuelve sólo nombre y apellido (más liviano)
export function InformacionUserNombre(id) {
  return axiosInstance.get(`/api/MiPerfil/info/nombre/${id}`);
}
export function InformacionRole(id_role) {
  return axiosInstance.get(`/api/MiPerfil/info/role/${id_role}`);
}
export function EditProfile(payload) {
  return axiosInstance.put("/api/MiPerfil/perfil", payload);
}

export function updateUserById(id, payload) {
  return axiosInstance.put(`/api/MiPerfil/perfil/${id}`, payload);
}

export function forgetPassword(correo) {
  return axiosInstance.post("/api/forget-password/", { correo });
}

export function validarCodigo(correo, codigo) {
  return axiosInstance.post("/api/validar-codigo/", { correo, codigo });
}
export function changePassword(mail, new_password) {
  return axiosInstance.patch("/api/forget-password/cambiar-password", {
    mail,
    new_password,
  });
}
export function addRol(id_usuario, nombre_rol) {
  return axiosInstance.post(
    `/api/roles-privilegios/agregar-rol/${id_usuario}`,
    { nombre_rol }
  );
}
export function addPrivilegio(id_usuario, nombre_privilegio) {
  return axiosInstance.post(
    `/api/roles-privilegios/agregar-privilegio/${id_usuario}`,
    { nombre_privilegio }
  );
}

export function asignarPrivilegioARol(id_usuario, id_rol, id_privilegio) {
  return axiosInstance.post(
    `/api/roles-privilegios/asignar-rol-privilegio/${id_usuario}`,
    { id_rol, id_privilegio }
  );
}

export function getRoles() {
  return axiosInstance.get("/api/roles-privilegios/mostrar-roles");
}

export function getPrivilegios() {
  return axiosInstance.get("/api/roles-privilegios/mostrar-privilegios");
}

export function getAllInformacionUsuario() {
  return axiosInstance.get("/api/auth/GetAllUser");
}

export function uploadProfilePhoto(file) {
  const formData = new FormData();
  formData.append("foto", file);
  return axiosInstance.put("/api/MiPerfil/foto", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function validarCodigoDosPasos(correo, codigo) {
  return axiosInstance.patch("/api/roles-privilegios/verificacion-dos-pasos", {
    correo,
    codigo,
  });
}

export function enviarCorreoDosPasos(correo) {
  return axiosInstance.post("/api/roles-privilegios/autenticacion-dos-pasos", {
    correo,
  });
}

export function createLog(id_usuario) {
  return axiosInstance.post("/api/forget-password/crear-log", { id_usuario });
}

export function getLogsUsuario(id_usuario) {
  return axiosInstance.get(`/api/forget-password/get-log/${id_usuario}`);
}

// api/Usuario.Route.js
// Reemplazar
export const uploadProfilePhoto1 = async (file, desiredName) => {
  const form = new FormData();
  // el tercer argumento fija el nombre con el que se guarda en el disco del backend
  form.append("foto", file, desiredName || file.name);
  return axiosInstance.post("/api/uploads/profile-photo", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export function uploadProductPhotos(files) {
  const form = new FormData();
  for (let i = 0; i < files.length; i++) {
    form.append("fotos", files[i], files[i].name);
  }
  return axiosInstance.post("/api/uploads/product-photos", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}
export async function uploadProductPhotos2(namedFiles) {
  const form = new FormData();
  namedFiles.forEach(({ file, desiredName }) => {
    form.append("fotos", file, desiredName || file.name); // <- 'fotos' (plural)
  });
  return axiosInstance.post("/api/uploads/product-photos", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}



export function estadosUsuarios() {
  return axiosInstance.get("api/usuarios/estado-usuarios");
}

export function promedioGastoUsuario(id_usuario) {
  return axiosInstance.get(`/api/usuarios/promedio-gasto/${id_usuario}`);
}

export function contarPedidosUsuario(id_usuario) {
  return axiosInstance.get(`/api/usuarios/contar-pedidos/${id_usuario}`);
}

export function editarPerfil(
  id_usuario, // ID del usuario a actualizar
  nombre, // nuevo nombre
  apellido, // nuevo apellido
  telefono, // nuevo teléfono
  genero, // nuevo género
  foto_perfil_url, // nueva foto de perfil
  id_direccion, // ID de la dirección a actualizar
  calle, // nueva calle
  ciudad, // nueva ciudad
  codigo_postal, // nuevo código postal
  predeterminada, // booleano si es dirección predeterminada
  id_municipio // nuevo ID de municipio
) {
  return axiosInstance.put(`/api/usuarios/actualizar-usuario/${id_usuario}`, {
    nombre,
    apellido,
    telefono,
    genero,
    foto_perfil_url,
    id_direccion,
    calle,
    ciudad,
    codigo_postal,
    predeterminada,
    id_municipio,
  });
}
