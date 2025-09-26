const { reembolso_pedido, pedido } = require('../models');

exports.agregarReembolso = async (req, res) => {
  try {
    const { id_pedido, motivo } = req.body;

    const pedidoEncontrado = await pedido.findByPk(id_pedido);

    if (!pedidoEncontrado) {
      return res.status(404).json({ error: 'El pedido no existe' });
    }

    if (pedidoEncontrado.id_estado_pedido === 6) {
      return res.status(400).json({ error: 'Este pedido ya fue reembolsado' });
    }

    await reembolso_pedido.create({ id_pedido, motivo });

    await pedido.update(
      { id_estado_pedido: 6 },
      { where: { id_pedido } }
    );

    return res.status(201).json({ msg: 'Reembolso efectuado' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Error desconocido' });
  }
};

exports.listarReembolsos = async (req, res) => {
  try {
    const reembolsos = await reembolso_pedido.findAll();
    res.json(reembolsos);
    return;
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
