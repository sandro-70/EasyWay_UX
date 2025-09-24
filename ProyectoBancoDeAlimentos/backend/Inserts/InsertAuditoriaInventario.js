const express = require("express");
const router = express.Router();
const { auditoria_inventario } = require("../models");

// Insertar registros de auditoría de inventario
async function insertAuditoriaInventario(req, res) {
  try {
    const registros = [
      {
        id_producto: 1,
        id_usuario: 1,
        id_sucursal: 1,
        cantidad: 20,
        nombre_operacion: "entrada",
        fecha_movimiento: "2025-09-10",
      },
      {
        id_producto: 2,
        id_usuario: 2,
        id_sucursal: 1,
        cantidad: 5,
        nombre_operacion: "salida",
        fecha_movimiento: "2025-09-11",
      },
      {
        id_producto: 3,
        id_usuario: 3,
        id_sucursal: 2,
        cantidad: 10.5,
        nombre_operacion: "ajuste",
        fecha_movimiento: "2025-09-12",
      },
      {
        id_producto: 1,
        id_usuario: 2,
        id_sucursal: 1,
        cantidad: 3,
        nombre_operacion: "salida",
        fecha_movimiento: "2025-09-13",
      },
      {
        id_producto: 4,
        id_usuario: 4,
        id_sucursal: 2,
        cantidad: 50,
        nombre_operacion: "entrada",
        fecha_movimiento: "2025-09-14",
      },
      {
        id_producto: 5,
        id_usuario: 1,
        id_sucursal: 1,
        cantidad: 2,
        nombre_operacion: "ajuste",
        fecha_movimiento: "2025-09-15",
      },
      {
        id_producto: 2,
        id_usuario: 3,
        id_sucursal: 2,
        cantidad: 7,
        nombre_operacion: "entrada",
        fecha_movimiento: "2025-09-16",
      },
      {
        id_producto: 3,
        id_usuario: 2,
        id_sucursal: 1,
        cantidad: 1,
        nombre_operacion: "salida",
        fecha_movimiento: "2025-09-17",
      },
    ];

    const inserted = [];
    for (const reg of registros) {
      const exists = await auditoria_inventario.findOne({
        where: {
          id_producto: reg.id_producto,
          id_usuario: reg.id_usuario,
          id_sucursal: reg.id_sucursal,
          cantidad: reg.cantidad,
          nombre_operacion: reg.nombre_operacion,
          fecha_movimiento: reg.fecha_movimiento,
        },
      });

      if (!exists) {
        const created = await auditoria_inventario.create(reg);
        inserted.push(created);
      }
    }

    res.status(201).json({
      message: "Registros de auditoría insertados correctamente",
      result: inserted,
    });
  } catch (error) {
    console.error("Error al insertar auditoría de inventario:", error);
    res
      .status(500)
      .json({ error: "Error al insertar auditoría de inventario" });
  }
}

module.exports = insertAuditoriaInventario;
