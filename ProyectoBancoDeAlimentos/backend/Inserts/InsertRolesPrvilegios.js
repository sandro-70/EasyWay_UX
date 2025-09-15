const db = require("../models");

async function insertRolesPrivilegios(req, res) {
  // =========================
  // ROLES
  // =========================
  const roles = [
    { id_rol: 1, nombre_rol: "administrador" },
    { id_rol: 2, nombre_rol: "cliente" },
    { id_rol: 3, nombre_rol: "Consultor" },
  ];

  // =========================
  // PRIVILEGIOS
  // =========================
  const privilegios = [
    { id_privilegio: 1, nombre_privilegio: "gestionar_productos" },
    { id_privilegio: 2, nombre_privilegio: "ver_dashboard" },
    { id_privilegio: 3, nombre_privilegio: "gestionar_usuarios" },
    { id_privilegio: 4, nombre_privilegio: "gestionar_inventario" },
    { id_privilegio: 5, nombre_privilegio: "ver_reportes" },
    { id_privilegio: 6, nombre_privilegio: "personalizacion_reportes" },
    { id_privilegio: 7, nombre_privilegio: "ver_reportes_pedidos" },
    { id_privilegio: 8, nombre_privilegio: "ver_descuentos" },
  ];

  // =========================
  // ASIGNACIÓN ROL–PRIVILEGIO
  // =========================
  const rolPrivilegios = [
    { id_rol: 1, id_privilegio: 1 },
    { id_rol: 1, id_privilegio: 2 },
    { id_rol: 1, id_privilegio: 3 },
    { id_rol: 1, id_privilegio: 4 },
    { id_rol: 1, id_privilegio: 5 },
    { id_rol: 1, id_privilegio: 6 },
    { id_rol: 1, id_privilegio: 7 },
    { id_rol: 1, id_privilegio: 8 },
  ];

  try {
    let insertedRoles = [];
    for (const rol of roles) {
      const exists = await db.rol.findOne({
        where: { nombre_rol: rol.nombre_rol },
      });
      if (!exists) {
        const created = await db.rol.create(rol);
        insertedRoles.push(created);
      }
    }

    let insertedPrivilegios = [];
    for (const priv of privilegios) {
      const exists = await db.privilegio.findOne({
        where: { nombre_privilegio: priv.nombre_privilegio },
      });
      if (!exists) {
        const created = await db.privilegio.create(priv);
        insertedPrivilegios.push(created);
      }
    }

    let insertedAsignaciones = [];
    for (const rp of rolPrivilegios) {
      const exists = await db.rol_privilegio.findOne({
        where: { id_rol: rp.id_rol, id_privilegio: rp.id_privilegio },
      });
      if (!exists) {
        const created = await db.rol_privilegio.create(rp);
        insertedAsignaciones.push(created);
      }
    }

    res.status(201).json({
      message: "Roles, Privilegios y Asignaciones insertados correctamente",
      result: {
        roles: insertedRoles,
        privilegios: insertedPrivilegios,
        asignaciones: insertedAsignaciones,
      },
    });
  } catch (error) {
    console.error("Error al insertar roles/privilegios:", error);
    res.status(500).json({ message: "Error al insertar datos", error });
  }
}

module.exports = insertRolesPrivilegios;
