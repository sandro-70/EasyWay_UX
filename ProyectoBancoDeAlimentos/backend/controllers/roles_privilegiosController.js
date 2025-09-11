const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');
const { Usuario, rol, privilegio, rol_privilegio } = require('../models');
const nodemailer = require('nodemailer');

const codes = {};

exports.enviarCorreoDosPasos = async (req, res) => {
    //correo solicitante
    const { correo } = req.body;

  try {
    const user = await Usuario.findOne({ where: { correo } });

    if (!user) {
        return res.status(404).send('Usuario no se pudo encontrar!');
    }

    //codigo de validacion
    const codigo = Math.floor(100000 + Math.random() * 900000);

    //codigo guardado en usuario(temporal)
    codes[correo] = codigo;

    //configurar nodemailer
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, //STARTTLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    //enviar el codigo
    await transporter.sendMail({
      from: `"EasyWay Soporte" <${process.env.EMAIL_USER}>`,
      to: user.correo,
      subject: 'Codigo de confirmación',
      text: 'Tu código de confirmación es: ' + codigo,
    });

    res.send('Código enviado a tu correo');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al enviar el código');
  }
};

exports.validarCodigoDosPasos = async (req, res) => {
  const { correo, codigo } = req.body;

  const codigo_verificar = codes[correo];

  try {
    const user = await Usuario.findOne({ where: { correo } });

    if (!user) {
      return res.status(404).send('Usuario no encontrado!');
    }

    if (codigo_verificar === parseInt(codigo)) {
      delete codes[correo];

      user.autenticacion_dos_pasos = true;
      await user.save();

      return res.send('Codigo valido!');
    } else {
      return res.status(400).send('Codigo incorrecto!');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error, no se pudo validar el codigo');
  }
};

exports.addRol = async (req,res) => {
    try{
        const {id_usuario} = req.params;

        const {nombre_rol} = req.body;

        const user = await Usuario.findByPk(id_usuario);

        if(!user){
            return res.status(404).json({message : "Usuario no existe!"});
        }
        
        if(user.id_rol !== 1){
            return res.status(403).json({ message: "No tienes permisos para crear un rol!" });
        }

        await rol.create({
            nombre_rol
        });
        res.status(201).json({message : "rol creado exitosamente!"});
    }catch(error){
        console.error(error);
        return res.status(500).json({message : "Error al agregar rol!"});
    }
}

exports.addPrivilegio = async (req,res) => {
    try{
        const {id_usuario} = req.params;

        const {nombre_privilegio} = req.body;

        const user = await Usuario.findByPk(id_usuario);

        if(!user){
            return res.status(404).json({message : "Usuario no existe!"});
        }
        
        if(user.id_rol !== 1){
            return res.status(403).json({ message: "No tienes permisos para crear un privilegio!" });
        }

        await privilegio.create({
            nombre_privilegio
        });

        res.status(201).json({message : "Privilegio creado exitosamente!"});

    }catch(error){
        console.error(error);
        return res.status(500).json({message : "Error al agregar privilegio!"});
    }
}

exports.asignarPrivilegioARol = async (req, res) => {
  try {
    const { id_rol, id_privilegio } = req.body;

    const asignacion = await rol_privilegio.create({ id_rol, id_privilegio });

    return res.status(201).json({ message: 'Privilegio asignado al rol correctamente', asignacion });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al asignar privilegio al rol' });
  }
};

exports.getRoles = async (req,res) => {
    try {
        const roles = await rol.findAll();
        return res.status(200).json(roles);
    } catch (error) {
        console.error('Error al obtener roles:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}

exports.getPrivilegios = async (req, res) => {
  try {
    const privilegios = await privilegio.findAll();
    return res.status(200).json(privilegios);
  } catch (error) {
    console.error('Error al obtener privilegios:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.getRolesYPrivilegiosDeUsuario = async (req, res) => {
  const { id_usuario } = req.params;

  try {
    const user = await Usuario.findByPk(id_usuario, {
      attributes: [],
      include: [
        {
          model: rol,
          attributes: ['nombre_rol'],
          include: [
            {
              model: privilegio,
              attributes: ['nombre_privilegio'],
              through: { attributes: [] }
            }
          ]
        }
      ]
    });


    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.status(200).json(user.rols || user.rol); // Sequelize puede devolver en plural
  } catch (error) {
    console.error('Error al obtener roles y privilegios del usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
