const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("../models/Usuario");

// Insertar usuarios
async function insertUsuarios(req, res) {
  const db = req.app.locals.db;

  // ...existing code...
  const usuarios = [
    {
      nombre: "Admin",
      apellido: "Principal",
      correo: "admin@banco.com",
      contraseña: bcrypt.hashSync("admin123", 10),
      id_rol: 1,
      activo: true,
      telefono: "1234567890",
      foto_perfil_url: "/images/cocacola.png",
      tema: true,
      autenticacion_dos_pasos: false,
      genero: "masculino",
      fecha_creacion: new Date(),
      fecha_actualizacion: new Date(),
    },
    {
      nombre: "harold",
      apellido: "Martínez",
      correo: "diazh5773@gmail.com",
      contraseña: bcrypt.hashSync("usuario123", 10),
      id_rol: 2,
      activo: true,
      telefono: "0987654321",
      foto_perfil_url: "",
      tema: false,
      autenticacion_dos_pasos: true,
      genero: "femenino",
      fecha_creacion: new Date(),
      fecha_actualizacion: new Date(),
    },
    {
      nombre: "Pedro",
      apellido: "Deras",
      correo: "pedro@banco.com",
      contraseña: bcrypt.hashSync("usuario123", 10),
      id_rol: 2,
      activo: true,
      telefono: "1122334455",
      foto_perfil_url: "",
      tema: true,
      autenticacion_dos_pasos: false,
      genero: "masculino",
      fecha_creacion: new Date(),
      fecha_actualizacion: new Date(),
    },
    {
      nombre: "Alex",
      apellido: "Gómez",
      correo: "alex@banco.com",
      contraseña: bcrypt.hashSync("usuario123", 10),
      id_rol: 3,
      activo: false,
      telefono: "5566778899",
      foto_perfil_url: "",
      tema: false,
      autenticacion_dos_pasos: false,
      genero: "otro",
      fecha_creacion: new Date(),
      fecha_actualizacion: new Date(),
    },
  ];

  try {
    const result = await db.Usuario.bulkCreate(usuarios, {
      ignoreDuplicates: true,
    });
    res
      .status(201)
      .json({ message: "Usuarios insertados correctamente", result });
  } catch (error) {
    console.error("Error al insertar usuarios:", error);
    res.status(500).json({ message: "Error al insertar usuarios", error });
  }
}

module.exports = insertUsuarios;
