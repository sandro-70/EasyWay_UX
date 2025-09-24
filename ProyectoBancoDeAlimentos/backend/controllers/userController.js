const { Usuario, pedido, factura, direccion} = require('../models');
const { fn, col } = require('sequelize');
const nodemailer = require('nodemailer');

exports.estadosUsuarios = async (req, res) => {
  try {
    const resultado = await Usuario.findAll({
      attributes: [
        'activo',
        [fn('COUNT', col('id_usuario')), 'cantidad']
      ],
      group: ['activo']
    });

    const respuesta = {
      activos: 0,
      inactivos: 0
    };

    resultado.forEach(r => {
      if (r.activo) {
        respuesta.activos = r.getDataValue('cantidad');
      } else {
        respuesta.inactivos = r.getDataValue('cantidad');
      }
    });

    res.json(respuesta);
  } catch (error) {
    console.error("Error al contar usuarios:", error);
    res.status(500).json({ error: "Error interno al contar usuarios" });
  }
};

exports.promedioGastoUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const usuario = await Usuario.findByPk(id_usuario);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    //promedio
    const resultado = await factura.findOne({
      attributes: [[fn('AVG', col('total')), 'promedio_gasto']],
      include: [{
        model: pedido,
        attributes: [],
        where: { id_usuario }
      }],
      raw: true
    });

    res.json({
      id_usuario,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      promedio_gasto: parseFloat(resultado.promedio_gasto) || 0
    });

  } catch (error) {
    console.error("Error al calcular promedio de gasto del usuario:", error);
    res.status(500).json({ error: "Error interno al calcular promedio de gasto" });
  }
};

exports.contarPedidosUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const user = await Usuario.findByPk(id_usuario);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    //contar
    const cantidadPedidos = await pedido.count({
      where: { id_usuario }
    });

    res.json({
      id_usuario,
      nombre: user.nombre,
      apellido: user.apellido,
      total_pedidos: cantidadPedidos
    });
  } catch (error) {
    console.error("Error al contar pedidos del usuario:", error);
    res.status(500).json({ error: "Error interno al contar pedidos" });
  }
};

exports.editarPerfil = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    console.log("Editar perfil para usuario:", id_usuario);
    const {
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
      id_municipio
    } = req.body;

    // Buscar usuario
    const user = await Usuario.findOne({ where: { id_usuario } });
    if (!user) {
      console.log("Usuario no encontrado:", id_usuario);
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Actualizar campos del usuario
    if (nombre !== undefined) user.nombre = nombre;
    if (apellido !== undefined) user.apellido = apellido;
    if (telefono !== undefined) user.telefono = telefono;
    if (genero !== undefined) user.genero = genero;
    if (foto_perfil_url !== undefined) user.foto_perfil_url = foto_perfil_url;

    // Actualizar dirección si se envía id_direccion
    if (id_direccion !== undefined) {
      const direccio = await direccion.findOne({ where: { id_direccion, id_usuario } });
      if (!direccio) {
        return res.status(404).json({ message: "Dirección no encontrada para este usuario" });
      }

      if (calle !== undefined) direccio.calle = calle;
      if (ciudad !== undefined) direccio.ciudad = ciudad;
      if (codigo_postal !== undefined) direccio.codigo_postal = codigo_postal;
      if (predeterminada !== undefined) direccio.predeterminada = predeterminada;
      if (id_municipio !== undefined) direccio.id_municipio = id_municipio;

      await direccio.save();

      // Opcional: actualizar la dirección actual del usuario
      user.id_direccion_actual = id_direccion;
    }

    // Actualizar fecha de actualización
    user.fecha_actualizacion = new Date();

    await user.save();

    return res.json({
      message: "Perfil y dirección actualizados correctamente",
      usuario: user
    });

  } catch (error) {
    console.error("Error al editar perfil:", error);
    return res.status(500).json({ message: "No se pudo actualizar el perfil", error: error.message });
  }
};

exports.enviarCorreo = async (req, res) => {
  try {
    const { correo, descripcion, asunto } = req.body;

    if (!correo || typeof correo !== 'string') {
      return res.status(400).json({ message: 'correo es requerido' });
    }
    if (!descripcion || typeof descripcion !== 'string') {
      return res.status(400).json({ message: 'descripcion (string) es requerida' });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // STARTTLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"EasyWay Soporte" <${process.env.EMAIL_USER}>`,
      to: correo,
      subject: asunto || 'Mensaje de EasyWay',
      text: descripcion, // ← ya es string
      html: `<p style="white-space:pre-wrap;margin:0">${descripcion}</p>`,
    });

    return res.status(200).json({ message: 'Correo enviado correctamente' });
  } catch (err) {
    console.error('[enviarCorreoLibre] Error:', err);
    return res.status(500).json({ message: 'Error al enviar el correo' });
  }
};
