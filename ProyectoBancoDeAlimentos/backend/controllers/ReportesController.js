const { Sequelize } = require('sequelize');
const { factura_detalle, producto, factura, pedido, estado_pedido } = require("../models");
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Función para listar ventas con filtros
exports.getVentasConFiltros = async (req, res) => {
  try {
    const { filtro, cantidad } = req.query; // filtro: 'mayor' o 'menor', cantidad: número

    let whereCondition = {};
    if (filtro && cantidad) {
      const cant = parseInt(cantidad);
      if (filtro === 'mayor') {
        whereCondition = Sequelize.where(Sequelize.fn('SUM', Sequelize.col('factura_detalle.cantidad_unidad_medida')), '>', cant);
      } else if (filtro === 'menor') {
        whereCondition = Sequelize.where(Sequelize.fn('SUM', Sequelize.col('factura_detalle.cantidad_unidad_medida')), '<', cant);
      }
    }

    const ventas = await factura_detalle.findAll({
      attributes: [
        ['id_producto', 'id_producto'],
        [Sequelize.fn('SUM', Sequelize.col('factura_detalle.cantidad_unidad_medida')), 'total_vendido']
      ],
      include: [
        {
          model: factura,
          attributes: [],
          include: [
            {
              model: pedido,
              attributes: [],
              include: [
                {
                  model: estado_pedido,
                  attributes: [],
                  where: { nombre_pedido: 'Enviado' }
                }
              ]
            }
          ]
        },
        {
          model: producto,
          attributes: ['nombre', 'precio_base']
        }
      ],
      where: whereCondition,
      group: ['factura_detalle.id_producto', 'producto.id_producto', 'producto.nombre', 'producto.precio_base'],
      order: [[Sequelize.literal('total_vendido'), 'DESC']],
      subQuery: false
    });

    res.json(ventas);
  } catch (error) {
    console.error('Error al obtener ventas con filtros:', error);
    res.status(500).json({ error: 'Error al obtener el reporte de ventas' });
  }
};

// Función para exportar ventas a Excel
exports.exportVentasExcel = async (req, res) => {
  try {
    const { filtro, cantidad } = req.query;

    let whereCondition = {};
    if (filtro && cantidad) {
      const cant = parseInt(cantidad);
      if (filtro === 'mayor') {
        whereCondition = Sequelize.where(Sequelize.fn('SUM', Sequelize.col('factura_detalle.cantidad_unidad_medida')), '>', cant);
      } else if (filtro === 'menor') {
        whereCondition = Sequelize.where(Sequelize.fn('SUM', Sequelize.col('factura_detalle.cantidad_unidad_medida')), '<', cant);
      }
    }

    const ventas = await factura_detalle.findAll({
      attributes: [
        ['id_producto', 'id_producto'],
        [Sequelize.fn('SUM', Sequelize.col('factura_detalle.cantidad_unidad_medida')), 'total_vendido']
      ],
      include: [
        {
          model: factura,
          attributes: [],
          include: [
            {
              model: pedido,
              attributes: [],
              include: [
                {
                  model: estado_pedido,
                  attributes: [],
                  where: { nombre_pedido: 'Enviado' }
                }
              ]
            }
          ]
        },
        {
          model: producto,
          attributes: ['nombre', 'precio_base']
        }
      ],
      where: whereCondition,
      group: ['factura_detalle.id_producto', 'producto.id_producto', 'producto.nombre', 'producto.precio_base'],
      order: [[Sequelize.literal('total_vendido'), 'DESC']],
      subQuery: false
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ventas');

    worksheet.columns = [
      { header: 'ID Producto', key: 'id_producto', width: 15 },
      { header: 'Nombre Producto', key: 'nombre', width: 30 },
      { header: 'Precio Base', key: 'precio_base', width: 15 },
      { header: 'Total Vendido', key: 'total_vendido', width: 15 }
    ];

    ventas.forEach(venta => {
      worksheet.addRow({
        id_producto: venta.dataValues.id_producto,
        nombre: venta.producto.nombre,
        precio_base: venta.producto.precio_base,
        total_vendido: venta.dataValues.total_vendido
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte_ventas.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error al exportar ventas a Excel:', error);
    res.status(500).json({ error: 'Error al exportar el reporte de ventas a Excel' });
  }
};

// Función para exportar ventas a PDF
exports.exportVentasPDF = async (req, res) => {
  try {
    const { filtro, cantidad } = req.query;

    let whereCondition = {};
    if (filtro && cantidad) {
      const cant = parseInt(cantidad);
      if (filtro === 'mayor') {
        whereCondition = Sequelize.where(Sequelize.fn('SUM', Sequelize.col('factura_detalle.cantidad_unidad_medida')), '>', cant);
      } else if (filtro === 'menor') {
        whereCondition = Sequelize.where(Sequelize.fn('SUM', Sequelize.col('factura_detalle.cantidad_unidad_medida')), '<', cant);
      }
    }

    const ventas = await factura_detalle.findAll({
      attributes: [
        ['id_producto', 'id_producto'],
        [Sequelize.fn('SUM', Sequelize.col('factura_detalle.cantidad_unidad_medida')), 'total_vendido']
      ],
      include: [
        {
          model: factura,
          attributes: [],
          include: [
            {
              model: pedido,
              attributes: [],
              include: [
                {
                  model: estado_pedido,
                  attributes: [],
                  where: { nombre_pedido: 'Enviado' }
                }
              ]
            }
          ]
        },
        {
          model: producto,
          attributes: ['nombre', 'precio_base']
        }
      ],
      where: whereCondition,
      group: ['factura_detalle.id_producto', 'producto.id_producto', 'producto.nombre', 'producto.precio_base'],
      order: [[Sequelize.literal('total_vendido'), 'DESC']],
      subQuery: false
    });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte_ventas.pdf');

    doc.pipe(res);

    doc.fontSize(20).text('Reporte de Ventas', { align: 'center' });
    doc.moveDown();

    ventas.forEach(venta => {
      doc.fontSize(12).text(`ID Producto: ${venta.dataValues.id_producto}`);
      doc.text(`Nombre: ${venta.producto.nombre}`);
      doc.text(`Precio Base: ${venta.producto.precio_base}`);
      doc.text(`Total Vendido: ${venta.dataValues.total_vendido}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    console.error('Error al exportar ventas a PDF:', error);
    res.status(500).json({ error: 'Error al exportar el reporte de ventas a PDF' });
  }
};
