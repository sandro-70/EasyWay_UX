import axiosInstance from "./axiosInstance";

export const uploadProfilePhoto1 = async (file, desiredName) => {
  const form = new FormData();
  // el tercer argumento fija el nombre con el que se guarda en el disco del backend
  form.append("foto", file, desiredName || file.name);
  return axiosInstance.post("/api/uploads/profile-photo", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export function getAllProducts() {
  return axiosInstance.get("/api/Inventario/");
}
export function getAllSucursales() {
  return axiosInstance.get("/api/Inventario/sucursales");
}

export function abastecerPorSucursalProducto(
  id_sucursal,
  id_producto,
  cantidad,
  modo = "sumar"
) {
  return axiosInstance.put(
    `/api/Inventario/abastecer/sucursal/${id_sucursal}/producto/${id_producto}`,
    { cantidad, modo }
  );
}



export function getMarcas() {
  return axiosInstance.get("/api/producto/marcas");
}

export function getProductosDestacados() {
  return axiosInstance.get("/api/producto/destacados");
}

export function getProductosTendencias() {
  return axiosInstance.get("/api/producto/tendencias");
}

export function crearMarca(nombre_marca) {
  return axiosInstance.post("/api/producto/marcas", { nombre_marca });
}

export function getProductoById(id) {
  return axiosInstance.get(`/api/producto/${id}`);
}
export function getImagenesProducto(id) {
  return axiosInstance.get(`/api/producto/${id}/imagenes`);
}

export function subirImagenesProducto(files, id_producto) {
  const form = new FormData();
  files.forEach((file) => {
    form.append("fotos", file, file.name);
  });
  if (id_producto) form.append("id_producto", id_producto);
  return axiosInstance.post("/api/uploads/product-photos", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function eliminarImagenProducto(imagenId) {
  return axiosInstance.delete(`/api/producto/imagenes/${imagenId}`);
}

export function getAllPorcentajeGanancia() {
  return axiosInstance.get("/api/producto/porcentaje-ganancia");
}
export function updatePorcentajeGanancia(id, porcentaje_ganancia) {
  return axiosInstance.put(`/api/producto/${id}/porcentaje-ganancia`, {
    porcentaje_ganancia,
  });
}
export function getProductosRecomendados() {
  return axiosInstance.get("/api/producto/recomendados");
}
//cupones
export function addCupon(id_usuario, codigo_cupon) {
  return axiosInstance.post(`/api/cupones/agregar/${id_usuario}`, {
    codigo: codigo_cupon,
  });
}
export function getAllCupones() {
  return axiosInstance.get("/api/cupones/cupones");
}
export function getCuponesByUser(id_usuario) {
  return axiosInstance.get(`/api/cupones/${id_usuario}`);
}
export function desactivarProducto(id_producto) {
  return axiosInstance.patch(`/api/producto/desactivar/${id_producto}`);
}

export function actualizarProducto(
  id_producto,
  nombre,
  descripcion,
  precio_base,
  id_subcategoria,
  porcentaje_ganancia,
  id_marca,
  etiquetas,
  unidad_medida,
  imagenes,
  peso,
  files = [] // Array de archivos para subir
) {
  const formData = new FormData();

  // Agregar datos del producto
  formData.append('nombre', nombre);
  formData.append('descripcion', descripcion || '');
  formData.append('precio_base', precio_base);
  formData.append('id_subcategoria', id_subcategoria);
  if (porcentaje_ganancia !== undefined) formData.append('porcentaje_ganancia', porcentaje_ganancia);
  formData.append('id_marca', id_marca);
  if (etiquetas) formData.append('etiquetas', Array.isArray(etiquetas) ? etiquetas.join(',') : etiquetas);
  formData.append('unidad_medida', unidad_medida);
  if (peso !== undefined) formData.append('peso', peso);

  // Agregar archivos de imagen
  if (files && files.length > 0) {
    files.forEach((file, index) => {
      formData.append('imagenes', file, file.name);
    });
  }

  return axiosInstance.put(`/api/producto/actualizar-producto/${id_producto}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}


export function crearProducto(
  nombre,
  descripcion,
  precio_base,
  id_subcategoria,
  porcentaje_ganancia,
  id_marca,
  etiquetas,
  unidad_medida,
  imagenes,
  peso,
  files = [] // Array de archivos para subir
) {
  const formData = new FormData();

  // Agregar datos del producto
  formData.append('nombre', nombre);
  formData.append('descripcion', descripcion || '');
  formData.append('precio_base', precio_base);
  formData.append('id_subcategoria', id_subcategoria);
  if (porcentaje_ganancia !== undefined) formData.append('porcentaje_ganancia', porcentaje_ganancia);
  formData.append('id_marca', id_marca);
  if (etiquetas) formData.append('etiquetas', Array.isArray(etiquetas) ? etiquetas.join(',') : etiquetas);
  formData.append('unidad_medida', unidad_medida);
  if (peso !== undefined) formData.append('peso', peso);

  // Agregar archivos de imagen
  if (files && files.length > 0) {
    files.forEach((file, index) => {
      formData.append('imagenes', file, file.name);
    });
  }

  return axiosInstance.post("/api/Inventario/productos", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function listarProductosporsucursal(id_sucursal) {
  return axiosInstance.get(`/api/producto/sucursal/${id_sucursal}`);
}

export function addOrUpdateValoracion(id_producto, { puntuacion, comentario }) {
  const rating = Math.max(1, Math.min(5, parseInt(puntuacion, 10) || 0));
  return axiosInstance.post(
    `/api/producto/${id_producto}/valoraciones`, // <-- PLURAL
    { puntuacion: rating, comentario: comentario ?? "" },
    { headers: { "Content-Type": "application/json" } }
  );
}

export function AddProductoFav(id_producto) {
  return axiosInstance.post(`/api/producto/${id_producto}/favoritos`);
}

export function getProductosFav() {
  return axiosInstance.get("/api/producto/favoritos");
}
