const { politicas_reembolso } = require('../models');

exports.agregarPolitica = async (req, res) => {
  try {
    const descripcion = req.body;
    
    await politicas_reembolso.create(
      descripcion
    );
    return res.status(201).json({ msg: 'Política de reembolso agregada' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: e.message });
  }
};

exports.listarPoliticas = async (req, res) => {
  try {
    const politicas = await politicas_reembolso.findAll();
    res.json(politicas);
    return;
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

exports.eliminarPolitica = async (req, res) => {
  try {
    const { id } = req.params;

    const eliminados = await politicas_reembolso.destroy({
      where: { id_politicas_reembolso: id }
    });

    if (eliminados === 0) {
      return res.status(404).json({ error: 'Política no encontrada' });
    }

    return res.json({ msg: 'Política de reembolso eliminada correctamente' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};