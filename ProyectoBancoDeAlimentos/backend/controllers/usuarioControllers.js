const { Usuario , usuario_log} = require('../models');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');


const codes = {};

exports.forgetPassword = async (req, res) => {
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

exports.validarCodigo = async (req, res) => {
  const { correo, codigo } = req.body;

  const codigo_verificar = codes[correo];

  try {
    const user = await Usuario.findOne({ where: { correo } });

    if (!user) {
      return res.status(404).send('Usuario no encontrado!');
    }

    if (codigo_verificar === parseInt(codigo)) {
      delete codes[correo];
      return res.send('Codigo valido!');
    } else {
      return res.status(400).send('Codigo incorrecto!');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error, no se pudo validar el codigo');
  }
};

exports.changePassword = async (req,res) => {
  try{
    const {mail,new_password} = req.body;

    const user = await Usuario.findOne({where : { correo: mail }});

    if(!user){
      return res.status(404).send('Usuario no encontrado!');
    }

    const hashPass = await bcrypt.hash(new_password,10);

    user.contraseña = hashPass;

    await user.save();

    return res.status(200).json({ message: 'Contraseña actualizada!' });
  }catch(error){
    console.error(error);
    return res.status(500).json({ message: 'Error, no se pudo cambiar contraseña.' });
  }
}

exports.createLog = async (req, res) => {
  try {
    const { id_usuario } = req.body;

    const user = await Usuario.findOne({ where: { id_usuario } });

    if (!user) {
      return res.status(404).json({ message: "No se pudo encontrar el usuario!" });
    }

    await usuario_log.create({
      id_usuario,
      fecha_actualizacion: new Date()
    });

    return res.status(201).json({ message: "Log creado correctamente!" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al crear log!" });
  }
};

exports.getLogsUsuario = async (req, res) => {
  try {
    console.log("pene 1");
    const { id_usuario } = req.params;
    console.log("pene 2");
    const logs = await usuario_log.findAll({
      where: { id_usuario },
      attributes: ['id_usuario', ['fecha_actualizacion', 'fecha_conexion']],
      include: [
        {
          model: Usuario,
          attributes: ['nombre']
        }
      ],
      order: [['fecha_actualizacion', 'DESC']]
    });

    console.log("pene 3");
    return res.status(200).json(logs);

  } catch (error) {
    console.log("pene 4");
    console.error(error);
    return res.status(500).json({ message: "Error al obtener logs del usuario!" });
  }
};