const { Sequelize,Op, fn, col, literal  } = require('sequelize');
const { factura_detalle, producto, factura, pedido, estado_pedido, promocion, promocion_pedido, Usuario, categoria, 
  subcategoria, promocion_producto, metodo_pago } = require("../models");
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

exports.getPromedioVentas4Meses = async (req, res) => {
  try {
    const hoy = new Date();
    const hace4Meses = new Date();
    hace4Meses.setMonth(hoy.getMonth() - 3);//4 meses y actual

    // Traer ventas agrupadas por mes
    const ventas = await factura.findAll({
      attributes: [
        [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("fecha_emision")), "mes"],
        [Sequelize.fn("SUM", Sequelize.col("total")), "ventas_totales"]
      ],
      where: {
        fecha_emision: {
          [Op.between]: [hace4Meses, hoy]
        }
      },
      group: [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("fecha_emision"))],
      order: [[Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("fecha_emision")), "ASC"]]
    });

    //estructura para 4 meses
    const resultados = [];
    for (let i = 3; i >= 0; i--) {
      const fechaMes = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const claveMes = fechaMes.toISOString().substring(0, 7); // yyyy-mm

      const venta = ventas.find(v => 
        v.get("mes").toISOString().substring(0, 7) === claveMes
      );

      resultados.push({
        mes: claveMes,
        ventas_totales: venta ? parseFloat(venta.get("ventas_totales")) : 0
      });
    }

    // Calcular promedio sobre 4 meses
    const promedio = resultados.reduce((a, b) => a + b.ventas_totales, 0) / 4;

    return res.status(200).json({
      ventas_por_mes: resultados,
      promedio_4_meses: promedio
    });

  } catch (error) {
    console.error("Error obteniendo promedio de ventas:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getPedidosPorMes = async (req, res) => {
  try {
    // Agrupar todos los pedidos por mes (sin límite de 4 meses)
    const pedidos = await pedido.findAll({
      attributes: [
        [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("fecha_pedido")), "mes"],
        [Sequelize.fn("COUNT", Sequelize.col("id_pedido")), "total_pedidos"]
      ],
      group: [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("fecha_pedido"))],
      order: [[Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("fecha_pedido")), "ASC"]]
    });

    // Convertir el resultado a un arreglo más limpio
    const resultados = pedidos.map(p => ({
      mes: p.get("mes").toISOString().substring(0, 7), // yyyy-mm
      total_pedidos: parseInt(p.get("total_pedidos"))
    }));

    return res.status(200).json({
      pedidos_por_mes: resultados
    });

  } catch (error) {
    console.error("Error obteniendo pedidos por mes:", error);
    return res.status(500).json({ error: error.message });
  }
};


exports.ingresosPromocionesUltimos4Meses = async (req, res) => {
  try {
    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - 4);

    const data = await factura.findAll({
      attributes: [
        [
          Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("factura.fecha_emision")),
          "mes"
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("factura.total")),
          "ingreso_con_promocion"
        ]
      ],
      include: [
        {
          model: pedido,
          attributes: [],
          required: true,
          include: [
            {
              model: promocion,
              attributes: [],
              required: true,
              through: { attributes: [] }
            }
          ]
        }
      ],
      where: {
        fecha_emision: { [Op.gte]: fechaInicio }
      },
      group: [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("factura.fecha_emision"))],
      order: [
        [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("factura.fecha_emision")), "ASC"]
      ],
      raw: true
    });

    // transformar a JSON bonito
    const result = data.map(item => ({
      mes: item.mes.toISOString().substring(0, 7),
      ingreso_con_promocion: parseFloat(item.ingreso_con_promocion)
    }));

    return res.status(200).json({ ingresos_por_promociones: result });
  } catch (error) {
    console.error("Error calculando ingresos de promociones:", error);
    return res.status(500).json({ error: error.message });
  }
};


exports.usuariosMasGastos = async (req, res) => {
  try {
    const userFactura = await factura.findAll({
      attributes: [
        [Sequelize.col("pedido.Usuario.nombre"), "nombre_usuario"],
        [Sequelize.fn("COUNT", Sequelize.col("factura.id_factura")), "cantidad_compras"],
        [Sequelize.fn("SUM", Sequelize.col("factura.total")), "total_gastado"]
      ],
      include: [
        {
          model: pedido,
          attributes: [],
          include: [
            {
              model: Usuario,
              attributes: []
            }
          ]
        }
      ],
      group: ["pedido.Usuario.id_usuario", "pedido.Usuario.nombre"],
      order: [[Sequelize.literal("total_gastado"), "DESC"]],
      raw: true
    });

    res.json(userFactura);
  } catch (error) {
    console.error("Error en usuariosMasGastos:", error);
    res.status(500).json({ error: "Error interno al obtener usuarios con más gastos" });
  }
};

exports.getReportePromociones = async (req, res) => {
  try {
    const report = await promocion.findAll({
    attributes: [
      ["id_promocion", "id_promocion"],
      ["nombre_promocion", "nombre_promocion"],
      [
        literal(`
          CASE
            WHEN "promocion"."valor_porcentaje" IS NOT NULL THEN 'PORCENTAJE'
            WHEN "promocion"."valor_fijo" IS NOT NULL THEN 'FIJO'
            ELSE 'SIN_TIPO'
          END
        `),
        "tipo_promocion"
      ],
      [
        literal(`
          COALESCE(
            CASE WHEN "promocion"."valor_porcentaje" IS NOT NULL 
                THEN CONCAT("promocion"."valor_porcentaje", '%') END,
            CAST("promocion"."valor_fijo" AS TEXT)
          )
        `),
        "descuento"
      ],
      [fn("COUNT", literal(`DISTINCT("pedidos"."id_pedido")`)), "cupones_usados"]
    ],
    include: [
      {
        model: producto,
        through: { attributes: [] },
        attributes: [],
        include: [
          {
            model: subcategoria,
            as: "subcategoria",
            attributes: [],
            include: [
              {
                model: categoria,
                as: "categoria",
                attributes: ["id_categoria", "nombre"]
              }
            ]
          }
        ]
      },
      {
        model: pedido,
        through: { attributes: [] },
        attributes: [],
        required: false
      }
    ],
    group: [
      "promocion.id_promocion",
      "promocion.nombre_promocion",
      "promocion.valor_porcentaje",
      "promocion.valor_fijo",
      "productos->subcategoria->categoria.id_categoria",
      "productos->subcategoria->categoria.nombre"
    ],
    order: [["id_promocion", "ASC"]]
  });


    res.json(report);
  } catch (error) {
    console.error("Error al generar reporte de promociones:", error);
    res.status(500).json({ error: "Error al generar reporte de promociones" });
  }
};

exports.getReportePedidos = async (req, res) => {
  try {
    const pedidos = await pedido.findAll({
      attributes: ['id_pedido', 'fecha_pedido'],
      include: [
        {
          model: estado_pedido,
          attributes: ['nombre_pedido']
        },
        {
          model: factura,
          attributes: ['id_factura'],
          include: [
            {
              model: metodo_pago,
              attributes: ['brand_tarjeta', 'tarjeta_ultimo']
            }
          ]
        }
      ],
      order: [['id_pedido', 'ASC']]
    });

    if (!pedidos || pedidos.length === 0) {
      return res.status(404).json({ message: 'No se encontraron pedidos.' });
    }

    const resultado = pedidos.map(p => ({
      id_pedido: p.id_pedido,
      estado: p.estado_pedido?.nombre_pedido || null,
      fecha_pedido: p.fecha_pedido,
      metodo_pago: p.factura?.metodo_pago
        ? `${p.factura.metodo_pago.brand_tarjeta} ****${p.factura.metodo_pago.tarjeta_ultimo}`
        : null
    }));

    return res.json(resultado);
  } catch (err) {
    console.error('Error en getReportePedidos:', err);
    return res.status(500).json({ message: 'Error interno al generar reporte de pedidos' });
  }
};