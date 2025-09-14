const express = require("express");
const router = express.Router();
const { producto } = require("../models");

// Insertar productos
async function insertProductos(req, res) {
  try {
    const productos = [
      {
        nombre: "Aceite Vegetal",
        descripcion:
          "Aceite vegetal de alta calidad, ideal para cocinar y freír",
        precio_base: 70.0,
        id_subcategoria: 1, // Aceites
        activo: true,
        unidad_medida: "litro",
        id_marca: 1,
        porcentaje_ganancia: 20.0,
        estrellas: 4.5,
        etiquetas: ["cocina", "saludable", "vegetal"],
        stock: 10,
        categoria: "Alimentos",
      },
      {
        nombre: "Manzana Roja",
        descripcion:
          "Manzana roja fresca, crujiente y jugosa, perfecta para snacks y postres",
        precio_base: 30.0,
        id_subcategoria: 2, // Frutas
        activo: true,
        unidad_medida: "unidad",
        id_marca: 2,
        porcentaje_ganancia: 15.0,
        estrellas: 4.0,
        etiquetas: ["fruta", "snack", "postre"],
        stock: 50,
        categoria: "Alimentos",
      },
      {
        nombre: "Arroz Blanco",
        descripcion:
          "Arroz blanco de grano largo, ideal para acompañar tus platos",
        precio_base: 25.0,
        id_subcategoria: 3, // Granos
        activo: true,
        unidad_medida: "unidad",
        id_marca: 4,
        porcentaje_ganancia: 25.0,
        estrellas: 4.8,
        etiquetas: ["cocina", "arroz"],
        stock: 15,
        categoria: "Alimentos",
      },
      {
        nombre: "Atun",
        descripcion: "Atún en agua, rico en proteínas y bajo en grasa",
        precio_base: 25.0,
        id_subcategoria: 5, // Pescados
        activo: true,
        unidad_medida: "unidad",
        id_marca: 3,
        porcentaje_ganancia: 30.0,
        estrellas: 4.2,
        etiquetas: ["proteína", "pescado", "conserva"],
        stock: 100,
        categoria: "Alimentos",
      },
      {
        nombre: "frijol Rojo",
        descripcion:
          "Frijol rojo de alta calidad, ideal para guisos y ensaladas",
        precio_base: 40.0,
        id_subcategoria: 3, // Granos
        activo: true,
        unidad_medida: "unidad",
        id_marca: 4,
        porcentaje_ganancia: 22.0,
        estrellas: 4.6,
        etiquetas: ["legumbre", "proteína", "saludable"],
        stock: 20,
        categoria: "Alimentos",
      },
      {
        nombre: "Leche Deslactosada",
        descripcion:
          "Leche deslactosada, ideal para personas con intolerancia a la lactosa",
        precio_base: 35.0,
        id_subcategoria: 4, // Lácteos
        activo: true,
        unidad_medida: "litro",
        id_marca: 2,
        porcentaje_ganancia: 18.0,
        estrellas: 4.3,
        etiquetas: ["lácteo", "saludable", "deslactosada"],
        stock: 30,
        categoria: "Alimentos",
      },
      {
        nombre: "Leche Entera",
        descripcion: "Leche entera fresca, rica en nutrientes y sabor",
        precio_base: 30.0,
        id_subcategoria: 4, // Lácteos
        activo: true,
        unidad_medida: "litro",
        id_marca: 2,
        porcentaje_ganancia: 15.0,
        estrellas: 4.1,
        etiquetas: ["lácteo", "nutritiva", "fresca"],
        stock: 25,
        categoria: "Alimentos",
      },
      {
        nombre: "Yogurt de Fresa",
        descripcion:
          "Yogurt de fresa cremoso y delicioso, perfecto para el desayuno o snack",
        precio_base: 20.0,
        id_subcategoria: 4, // Lácteos
        activo: true,
        unidad_medida: "unidad",
        id_marca: 1,
        porcentaje_ganancia: 20.0,
        estrellas: 4.4,
        etiquetas: ["lácteo", "yogurt", "fresa"],
        stock: 40,
        categoria: "Alimentos",
      },
      {
        nombre: "CocaCola",
        descripcion: "Bebida gaseosa sabor cola, refrescante y deliciosa",
        precio_base: 15.0,
        id_subcategoria: 6, // Bebidas
        activo: true,
        unidad_medida: "litro",
        id_marca: 5,
        porcentaje_ganancia: 18.0,
        estrellas: 4.0,
        etiquetas: ["bebida", "refrescante", "cola"],
        stock: 100,
        categoria: "Bebidas",
      },
    ];

    let inserted = [];
    for (const prod of productos) {
      const exists = await producto.findOne({ where: { nombre: prod.nombre } });
      if (!exists) {
        const created = await producto.create(prod);
        inserted.push(created);
      }
    }
    res.status(201).json({
      message: "Productos insertados correctamente",
      result: inserted,
    });
  } catch (error) {
    console.error("Error al insertar productos:", error);
    res.status(500).json({ error: "Error al insertar productos" });
  }
}

module.exports = insertProductos;
