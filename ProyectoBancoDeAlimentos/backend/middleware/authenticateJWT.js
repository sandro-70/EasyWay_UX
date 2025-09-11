// middleware/verifyToken.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/config');
const { Usuario, rol } = require('../models'); // 👈 'rol' minúscula

async function verifyToken(req, res, next) {
  // 1) Toma el token del header o cookie
  const authHeader = req.headers.authorization;
  const bearer = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  const token = bearer || req.cookies?.token;   // 👈 opcional: usa cookie si existe
  if (!token) return res.status(401).json({ msg: 'No token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const usuario = await Usuario.findByPk(decoded.id, {
      attributes: ['id_usuario', 'nombre', 'correo', 'foto_perfil_url', 'tema'],
      include: { model: rol, as: 'rol', attributes: ['nombre_rol'] },
    });

    const crypto = require('crypto');
const hash = crypto.createHash('sha256').update(JWT_SECRET).digest('hex').slice(0, 12);
console.log('[JWT] secret hash:', hash);

    if (!usuario) return res.status(401).json({ msg: 'Usuario no existe' });

    req.user = usuario;             // tendrás req.user.id_usuario disponible
    req.auth = { userId: decoded.id, role: decoded.rol }; // opcional
    next();
  } catch {
    return res.status(403).json({ msg: 'Token inválido o expirado' });
  }
}

module.exports = verifyToken;
