// controllers/AuthController.js
const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');
const Usuario = require('../models/Usuario')(sequelize, DataTypes);
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/config');

const login = async (req, res) => {
  try {
    const { correo, contraseña } = req.body;
    if (!correo || !contraseña) {
      return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
    }

    //  Buscar usuario 
    const usuario = await Usuario.findOne({ where: { correo } });
    if (!usuario) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    //  Verificar contraseña
    const valid = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!valid) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    //  Crear token
    const token = jwt.sign(
      { id: usuario.id_usuario, nombre: usuario.nombre , rol: usuario.id_rol}, // 👈 id_usuario
      process.env.JWT_SECRET || 'secreto',
      { expiresIn: '2h' }
    );

    // Cookie opcional
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 2 * 60 * 60 * 1000
    });
    
    return res.json({ message: 'Login exitoso', token });
  } catch (error) {
    console.error('Error en login:', error.stack);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const registrarse = async (req, res) => {
  try {
    let { nombre, apellido, correo, contraseña, telefono, id_rol, foto_perfil_url, genero } = req.body;

    // Normaliza el correo (trim + lowercase)
    correo = (correo || '').trim().toLowerCase();

    // Pre-chequeo (sigue siendo útil para la mayoría de casos)
    const user_existence = await Usuario.findOne({ where: { correo } });
    if (user_existence) {
      return res.status(400).json({ msg: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(contraseña, 10);

    await Usuario.create({
      nombre,
      apellido,
      correo,
      contraseña: hashedPassword,
      id_rol,
      telefono,
      foto_perfil_url,
      genero
    });

    return res.status(201).json({
      message: 'Usuario registrado correctamente',
      nombre,
      correo,
      telefono,
      rol: id_rol
    });

  } catch (error) {
     if (
      error?.name === 'SequelizeUniqueConstraintError' ||
      String(error?.original?.detail || '').includes('already exists') // Postgres
    ) {
      return res.status(400).json({ msg: 'El correo ya está registrado' });
    }
    console.error('No se pudo registrar el usuario!', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};


module.exports = { login, registrarse };