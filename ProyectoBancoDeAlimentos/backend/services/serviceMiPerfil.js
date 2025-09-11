const { Op } = require('sequelize');
const { Usuario, rol, direccion, metodo_pago, rol_privilegio, privilegio } = require('../models');


async function getInformacionUsuario({ id_usuario }) {
  const user = await Usuario.findByPk(id_usuario, {
    attributes: { exclude: ['contraseña'] },
    include: [
      { model: rol, attributes: ['id_rol', 'nombre_rol'] },
      { model: direccion, attributes: ['id_direccion','calle','ciudad','codigo_postal','predeterminada'] },
      { model: metodo_pago, attributes: ['id_metodo_pago','brand_tarjeta','tarjeta_ultimo','vencimiento_mes','vencimiento_ano','nombre_en_tarjeta','id_direccion_facturacion'] }
    ],
    // sin 'as' también en el order:
    order: [[direccion, 'id_direccion', 'ASC']]
  });

  if (!user) throw new Error('Usuario no encontrado.');
  return user;
}

async function getRoleWithPrivileges({ id_rol }) {
  const role = await rol.findByPk(id_rol, {
    attributes: ['id_rol', 'nombre_rol'],
    include: [{
      model: privilegio,                   // 👈 NO incluyas rol_privilegio directamente
      attributes: ['id_privilegio', 'nombre_privilegio'],
      through: { attributes: [] }          // oculta columnas del puente
    }],
    // Como no definiste alias en la asociación, no uses `as` aquí.
    order: [[privilegio, 'id_privilegio', 'ASC']]
  });

  if (!role) throw new Error('Role no encontrado');
  return role;
}

function toSafeUser(row) {
  const u = row.get ? row.get({ plain: true }) : row;
  if (u) delete u.contraseña;
  return u;
}

async function editPerfil(id_usuario, payload = {}, options = {}) {
  const { isAdmin = false } = options;

  console.log("editPerfil payload:", payload);
  const user = await Usuario.findByPk(id_usuario);
  if (!user) throw new Error('Usuario no encontrado');

  const allowedSelf  = [
    'nombre',
    'apellido', 
    'telefono',
    'foto_perfil_url',
    'tema',
    'genero',
    'direccion',
    'departamento',
    'municipio'
  ];
  const allowedAdmin = ['correo', 'id_rol', 'activo'];
  const allowed = new Set(isAdmin ? [...allowedSelf, ...allowedAdmin] : allowedSelf);

  const updates = {};

  // SELF
  if ('nombre' in payload && allowed.has('nombre')) {
    const v = String(payload.nombre || '').trim();
    if (v) updates.nombre = v;
  }
  // ✅ El frontend envía 'apellido', pero la base de datos espera 'apellido'. Se hace el mapeo.
  if ('apellido' in payload && allowed.has('apellido')) {
    const v = String(payload.apellido || '').trim();
    if (v) updates.apellido = v; // Se usa 'apellido' para la actualización
  }

  if ('telefono' in payload && allowed.has('telefono')) {
    const v = String(payload.telefono || '').trim();
    updates.telefono = v || null;
  }
  if ('foto_perfil_url' in payload && allowed.has('foto_perfil_url')) {
    const v = String(payload.foto_perfil_url || '').trim();
    updates.foto_perfil_url = v || null;
  }
  if ('tema' in payload && allowed.has('tema')) {
    const x = payload.tema;
    updates.tema =
      x === true || x === 'true' || x === 1 || x === '1' ? true :
      x === false || x === 'false' || x === 0 || x === '0' ? false :
      !!x;
  }
  if ('genero' in payload && allowed.has('genero')) {
    const v = String(payload.genero || '').trim();
    updates.genero = v || null;
  }
  if ('direccion' in payload && allowed.has('direccion')) {
    const v = String(payload.direccion || '').trim();
    updates.direccion = v || null;
  }
  if ('departamento' in payload && allowed.has('departamento')) {
    const v = String(payload.departamento || '').trim();
    updates.departamento = v || null;
  }
  if ('municipio' in payload && allowed.has('municipio')) {
    const v = String(payload.municipio || '').trim();
    updates.municipio = v || null;
  }

  // ADMIN
  if (isAdmin && 'correo' in payload && allowed.has('correo')) {
    const correo = String(payload.correo || '').trim().toLowerCase();
    if (!correo) throw new Error('Correo inválido');
    const exists = await Usuario.findOne({
      where: { correo, id_usuario: { [Op.ne]: id_usuario } },
      attributes: ['id_usuario']
    });
    if (exists) throw new Error('El correo ya está registrado por otro usuario');
    updates.correo = correo;
  }
  if (isAdmin && 'id_rol' in payload && allowed.has('id_rol')) {
    const v = Number(payload.id_rol);
    if (!Number.isInteger(v) || v <= 0) throw new Error('id_rol inválido');
    updates.id_rol = v;
  }
  if (isAdmin && 'activo' in payload && allowed.has('activo')) {
    const x = payload.activo;
    updates.activo =
      x === true || x === 'true' || x === 1 || x === '1' ? true :
      x === false || x === 'false' || x === 0 || x === '0' ? false :
      !!x;
  }

  if (Object.keys(updates).length === 0) {
    throw new Error('Nada que actualizar');
  }

  updates.fecha_actualizacion = new Date();
  await user.update(updates);

  const reloaded = await Usuario.findByPk(id_usuario, {
    attributes: { exclude: ['contraseña'] },
    include: [{ model: rol, attributes: ['id_rol', 'nombre_rol'] }]
  });

  return toSafeUser(reloaded);
}


async function getAllInformacionUsuario() {
  const user = Usuario.findAll({
    attributes: { exclude: ['contraseña'] },
    include: [
      { model: rol, attributes: ['id_rol', 'nombre_rol'] },
      { model: direccion, attributes: ['id_direccion','calle','ciudad','codigo_postal','predeterminada'] },

    ],
    order: [[direccion, 'id_direccion', 'ASC']]
  });

  if (!user) throw new Error('Usuario no encontrado.');
  return user;
}
module.exports = { getInformacionUsuario,getRoleWithPrivileges,editPerfil,getAllInformacionUsuario };
