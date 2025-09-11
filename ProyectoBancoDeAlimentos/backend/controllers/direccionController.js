const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');
const direccion = require('../models/direccion')(sequelize, DataTypes);
const Usuario = require('../models/Usuario')(sequelize, DataTypes);
const { municipio, departamento } = require('../models');

//esta funcion tiene un sequel interno, no crea si la pk ya existe
exports.addDirection = async (req,res) => {

    try{
        const {calle,ciudad,codigo_postal,predeterminada,id_municipio} = req.body;
        const {id_usuario} = req.params;

        const user = await Usuario.findByPk(id_usuario);
        if (!user){
            return res.status(404).json({message : "Usuario no existe!"});
        }

        if (predeterminada === true) {
            await direccion.update(
                { predeterminada: false },
                { where: { id_usuario } }
            );
        }

        direccion.create({
            id_usuario,
            calle,
            ciudad,
            codigo_postal,
            predeterminada,
            id_municipio
        });

        return res.status(201).json({
            message: "Direccion agregada!",
        });

    }catch(error){
        console.error(error);
        return res.status(400);
    }
    
}


exports.allDirections = async (req,res) => {
    try{
        const {id_usuario} = req.params;
        const direcciones = await direccion.findAll({where: { id_usuario: id_usuario }});


        return res.json(direcciones);


    }catch(error){
        console.error(error);
        return res.status(500).json({message : 'Error al pedir direcciones!'});
    }
}

exports.direccionDefault = async (req, res) => {
    try {
        const {id_direccion } = req.body; 
        const {id_usuario} = req.params;

        //sanity check
        const direccionz = await direccion.findOne({
            where: { id_direccion, id_usuario }
        });

        if (!direccionz) {
            return res.status(404).json({ message: 'Direccion no encontrada' });
        }

        //todas de ese usuario :false
        await direccion.update(
            { predeterminada: false },
            { where: { id_usuario } }
        );

        direccionz.predeterminada = true;
        await direccionz.save();

        return res.json({ message: 'Direccion actualizada!'});

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al actualizar direccion' });
    }
};

exports.actualizarDireccion = async (req, res) => {
    try {
        
        const {id_usuario,id_direccion} = req.params;
        const {calle, ciudad, codigo_postal, id_municipio } = req.body;
        

        const direccionz = await direccion.findByPk(id_direccion);
        if (!direccionz) {
            return res.status(404).json({ message: 'Direccion no encontrada' });
        }

        if (direccionz.id_usuario !== Number(id_usuario)) {
            return res.status(403).json({ message: 'No tienes permiso para actualizar esta dirección' });
        }
        
        direccionz.calle = calle;
        direccionz.ciudad = ciudad;
        direccionz.codigo_postal = codigo_postal;
        direccionz.id_municipio = id_municipio;

        await direccionz.save();

        return res.json({ message: 'Direccion actualizada!' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al actualizar direccion' });
    }
};

exports.eliminarDireccion = async (req, res) => {
    try {
        const { id_usuario, id_direccion } = req.params;

        const direccionz = await direccion.findByPk(id_direccion);
        if (!direccionz) {
            return res.status(404).json({ message: 'Direccion no encontrada!' });
        }

        if (direccionz.id_usuario !== Number(id_usuario)) {
            return res.status(403).json({ message: 'No tienes permiso para eliminar esta direccion!' });
        }

        const totalDirecciones = await direccion.count({ where: { id_usuario } });
        if (totalDirecciones <= 1) {
            return res.status(400).json({ message: 'Debe de haber mas de una direccion para poder borrar!' });
        }

        const principalz = direccionz.predeterminada;

        await direccion.destroy({ where: { id_direccion } });

        if (principalz) {
            const new_default = await direccion.findOne({ where: { id_usuario } });
            if (new_default) {
                new_default.predeterminada = true;
                await new_default.save();
            }
        }

        return res.json({ message: 'Direccion eliminada correctamente!' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al eliminar la direccion!' });
    }
};


// Obtener todos los municipios
exports.getAllMunicipios = async (req, res) => {
  try {
    const municipios = await municipio.findAll({
      attributes: ['id_municipio', 'nombre_municipio', 'id_departamento']
    });
    res.json(municipios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtener todos los departamentos
exports.getAllDepartamentos = async (req, res) => {
  try {
    const departamentos = await departamento.findAll({
      attributes: ['id_departamento', 'nombre_departamento']
    });
    res.json(departamentos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
