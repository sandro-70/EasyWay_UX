const jwt = require('jsonwebtoken');

const verificarToken = async (req, res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ message: 'No autenticado' });
  const token = h.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto');

    // 👇 Import tardío para evitar require circular
    const { Usuario, rol } = require('../models');

    const usuario = await Usuario.findByPk(decoded.id, {
      attributes: ['id_usuario', 'nombre', 'correo', 'foto_perfil_url', 'tema'],
      include: { model: rol, as: 'rol', attributes: ['nombre_rol'] },
    });

    if (!usuario) return res.status(401).json({ message: 'Usuario no existe' });
    req.user = usuario;
    console.log('✅ Usuario autenticado:', usuario.toJSON());

    next();
  } catch (e) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

module.exports = verificarToken;
