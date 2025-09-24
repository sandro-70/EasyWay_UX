// controllers/usuario-info.controller.js
const {
  getInformacionUsuario,
  getRoleWithPrivileges,
  getAllInformacionUsuario,
} = require("../services/serviceMiPerfil");
const { editPerfil } = require("../services/serviceMiPerfil");

function getAuthUserId(req) {
  return req.user?.id_usuario ?? req.auth?.userId ?? null;
}

exports.infoMe = async (req, res) => {
  try {
    const id = getAuthUserId(req);
    if (!id) return res.status(401).json({ message: "No autenticado" });

    const data = await getInformacionUsuario({ id_usuario: Number(id) });
    return res.status(200).json(data);
  } catch (e) {
    const msg = String(e?.message || e);
    if (msg.includes("Usuario no encontrado")) {
      return res.status(404).json({ message: msg });
    }
    return res.status(400).json({ message: msg });
  }
};

/**
 * GET /api/usuarios/info/:id
 * Usa el id que llega por parámetro.
 * (Si tienes roles/permisos, aquí validarías si el usuario puede ver a otros)
 */
exports.infoById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "id inválido" });
    }

    const data = await getInformacionUsuario({ id_usuario: id });
    return res.status(200).json(data);
  } catch (e) {
    const msg = String(e?.message || e);
    if (msg.includes("Usuario no encontrado")) {
      return res.status(404).json({ message: msg });
    }
    return res.status(400).json({ message: msg });
  }
};

exports.infoRoleById = async (req, res) => {
  try {
    const id = Number(req.params.id_role);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ message: "id inválido" });
    }

    const data = await getRoleWithPrivileges({ id_rol: id });
    return res.status(200).json(data);
  } catch (e) {
    const msg = String(e?.message || e);
    if (msg.includes("Role no encontrado")) {
      return res.status(404).json({ message: msg });
    }
    return res.status(400).json({ message: msg });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const id = getAuthUserId(req);
    if (!id) return res.status(401).json({ message: "No autenticado" });

    // calcula isAdmin desde el token o el usuario cargado por el middleware
    const isAdmin =
      req.auth?.role === "administrador" ||
      req.user?.rol?.nombre_rol === "administrador";

    const data = await editPerfil(Number(id), req.body, { isAdmin }); // 👈 ahora sí existe
    return res.status(200).json(data);
  } catch (e) {
    return res.status(400).json({ message: String(e?.message || e) });
  }
};
exports.updateById = async (req, res) => {
  try {
    const authId = getAuthUserId(req);
    if (!Number.isFinite(authId) || authId <= 0) {
      return res.status(401).json({ message: "No autenticado" });
    }

    // ID objetivo viene de la URL, no del token
    const targetId = Number(req.params.id || req.params.id_usuario);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({ message: "id inválido en URL" });
    }

    // Solo admin puede editar a OTROS, pero permite editar su propio perfil
    const isAdmin =
      req.auth?.role === "administrador" ||
      req.user?.rol?.nombre_rol === "administrador";
    if (!isAdmin && authId !== targetId) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const data = await editPerfil(targetId, req.body, { isAdmin: isAdmin || authId === targetId });
    return res.status(200).json(data);
  } catch (e) {
    return res.status(400).json({ message: String(e?.message || e) });
  }
};

exports.GetAllUser = async (req, res) => {
  try {
    const data = await getAllInformacionUsuario();
    return res.status(200).json(data);
  } catch (e) {
    const msg = String(e?.message || e);
    if (msg.includes("Usuario no encontrado")) {
      return res.status(404).json({ message: msg });
    }
    return res.status(400).json({ message: msg });
  }
};


// Devuelve sólo nombre y apellido (útil para interfaces que requieren mostrar el nombre corto)
exports.infoNombreApellidoById = async (req, res) => {
  try {
    // usar el id que viene en la URL (req.params.id)
    const id = Number(req.params.id || req.params.id_usuario);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "id inválido en URL" });
    }

    const data = await getInformacionUsuario({ id_usuario: id });
    // data puede venir como objeto Sequelize o puro JS
    const nombre = data && (data.nombre || data.nombre_completo || null);
    const apellido = data && (data.apellido || null);
    const nombre_completo =
      nombre && apellido
        ? `${nombre} ${apellido}`
        : nombre || data?.nombre_completo || null;

    return res.status(200).json({ nombre, apellido, nombre_completo });
  } catch (e) {
    const msg = String(e?.message || e);
    if (msg.includes("Usuario no encontrado")) {
      return res.status(404).json({ message: msg });
    }
    return res.status(400).json({ message: msg });
  }
};
