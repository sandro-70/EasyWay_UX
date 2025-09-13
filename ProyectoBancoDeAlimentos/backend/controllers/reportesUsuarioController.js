const {Sequelize} = require('sequelize');
const { factura, factura_detalle, producto, pedido, Usuario, estado_pedido, valoracion_producto } = require("../models");

exports.getTopProductosUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.body;

    const topProductos = await factura_detalle.findAll({
      attributes: [
        ["id_producto", "id_producto"],
        [Sequelize.fn("SUM", Sequelize.col("factura_detalle.cantidad_unidad_medida")), "total_comprado"]
      ],
      include: [
        {
          model: factura,
          attributes: [],
          include: [
            {
              model: pedido,
              attributes: [],
              where: { id_usuario },
              include: [
                {
                  model: estado_pedido,
                  attributes: [],
                  where: { nombre_pedido: "Enviado" }
                }
              ]
            }
          ]
        },
        {
          model: producto,
          attributes: ["id_producto", "nombre"]
        }
      ],
      group: ["factura_detalle.id_producto", "producto.id_producto", "producto.nombre"],
      order: [[Sequelize.literal("total_comprado"), "DESC"]],
      limit: 3,
      subQuery: false
    });



    res.json(topProductos);
  } catch (error) {
    console.error("Error al obtener top productos:", error);
    res.status(500).json({ error: "Error al obtener top productos del usuario" });
  }
};

exports.getProductosRecomendados = async (req, res) => {
  try {
    const { id_usuario } = req.body;

    const user = await Usuario.findOne({ where: { id_usuario } });
    if (!user) {
      return res.status(404).json({message : "Usuario no encontrado!" });
    }

    const recomendados = await valoracion_producto.findAll({
      attributes: ["id_producto", "puntuacion", "comentario"],
      where: { id_usuario },
      include: [
        {
          model: producto,
          attributes: ["nombre", "precio_base"]
        }
      ],
      order: [["puntuacion", "DESC"]],
      limit: 3
    });

    res.json(recomendados);
  } catch (error) {
    console.error("Error al obtener productos recomendados:", error);
    res.status(500).json({ error: "Error al obtener productos recomendados" });
  }
};

exports.getDiasCompra = async (req, res) => {
  try {
    const { id_usuario } = req.body;

    const user = await Usuario.findOne({ where: { id_usuario } });
    if (!user) {
      return res.status(404).json({ message : "Usuario no encontrado" });
    }

    const diasCompra = await pedido.findAll({
      attributes: [
        //DOW = 0-Lunes , 1-Martes , 2-Miercoles ...
        [Sequelize.fn("EXTRACT", Sequelize.literal("DOW FROM fecha_pedido")), "dia_semana"],
        [Sequelize.fn("COUNT", Sequelize.col("id_pedido")), "total_pedidos"]
      ],
      where: { id_usuario },
      group: [Sequelize.literal("dia_semana")],
      order: [[Sequelize.literal("total_pedidos"), "DESC"]]
    });

    res.json(diasCompra);
  } catch (error) {
    console.error("Error al obtener días de compra:", error);
    res.status(500).json({ error: "Error al obtener días de compra" });
  }
};

exports.getTotalAhorrado = async (req, res) => {
  try {
    const { id_usuario } = req.body;

    const resultado = await pedido.findOne({
      attributes: [
        [Sequelize.fn("SUM", Sequelize.col("descuento")), "total_ahorrado"]
      ],
      where: { id_usuario },
      include: [
        {
          model: estado_pedido,
          attributes: [],
          where: { nombre_pedido: "Enviado" }
        }
      ],
      raw: true
    });

    res.json({ total_ahorrado: resultado.total_ahorrado ?? 0 });
  } catch (error) {
    console.error("Error al calcular total ahorrado:", error);
    res.status(500).json({ error: "Error al calcular el ahorro del usuario!" });
  }
};


exports.getUsuariosReporte = async (req, res) => {
  try {
    // Obtener el total de usuarios registrados
    const totalUsers = await Usuario.count();
    
    res.header("Content-Type", "application/json");

    // Obtener la lista de usuarios con detalles
    const users = await Usuario.findAll({
      attributes: ['id_usuario', 'nombre', 'fecha_creacion', 'activo'],
      order: [['fecha_creacion', 'DESC']]
    });

    // Calcular estadísticas
    const activeUsers = users.filter(user => user.activo);
    const inactiveUsers = users.filter(user => !user.activo);
    const activePercentage = (activeUsers.length / totalUsers) * 100;
    const inactivePercentage = 100 - activePercentage;

    // Prepar la información para el reporte
    const reportData = {
      totalUsers: totalUsers,
      activeUsers: activeUsers.length,
      inactiveUsers: inactiveUsers.length,
      activePercentage: activePercentage.toFixed(2),
      inactivePercentage: inactivePercentage.toFixed(2),
      usersList: users.map(user => ({
        id: user.id_usuario,
        username: user.nombre,
        fecha: user.fecha_creacion,
        estado: user.activo ? 'Activo' : 'Inactivo',
      }))
    };

    res.json(reportData);
  } catch (error) {
    console.error('Error al obtener reporte de usuarios:', error);
    res.status(500).json({ error: 'Error al obtener reporte de usuarios' });
  }
};

// GET /api/reportes-usuario/reporte/tabla?rango=semana&estado=todos&limit=50&offset=0
exports.getUsuariosTabla = async (req, res) => {
  try {
    const { Usuario } = require("../models");
    const { Op, fn, col, literal } = require("sequelize");

    // Filtros
    const rango  = String(req.query.rango || "semana").toLowerCase(); // hoy|semana|mes|anio|todos
    const estado = String(req.query.estado || "todos").toLowerCase(); // todos|activos|inactivos
    const limit  = Number(req.query.limit || 50);
    const offset = Number(req.query.offset || 0);

    // Rango de fechas
    const now = new Date();
    let start = null;
    if (rango === "hoy") {
      start = new Date(now); start.setHours(0,0,0,0);
    } else if (rango === "semana") {
      start = new Date(now); start.setDate(start.getDate() - 7);
    } else if (rango === "mes") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (rango === "anio" || rango === "año") {
      start = new Date(now.getFullYear(), 0, 1);
    } // 'todos' => sin filtro

    const where = {};
    if (estado === "activos") where.activo = true;
    if (estado === "inactivos") where.activo = false;
    if (start) where.fecha_creacion = { [Op.gte]: start, [Op.lte]: now };

    // Query
    const { rows, count } = await Usuario.findAndCountAll({
      where,
      attributes: ["id_usuario", "nombre", "apellido", "correo", "fecha_creacion", "activo"],
      order: [["fecha_creacion", "DESC"]],
      limit, offset
    });

    // Helpers
    const fmtFecha = (d) => {
      const x = new Date(d);
      const dd = String(x.getDate()).padStart(2, "0");
      const mm = String(x.getMonth() + 1).padStart(2, "0");
      const yy = x.getFullYear();
      return `${dd}/${mm}/${yy}`;
    };
    const cap = (s="") => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
    const nombreUI = (u) => {
      const nom = [cap(u.nombre), cap(u.apellido)].filter(Boolean).join(" ").trim();
      if (nom) return nom;
      return (u.correo ? String(u.correo).split("@")[0] : "").trim();
    };

    // Transformación para la tabla
    const tabla = rows.map(u => ({
      id_usuario: u.id_usuario,
      usuario: nombreUI(u),                 // <-- “Nombre Apellido” o user del correo
      fecha: fmtFecha(u.fecha_creacion),    // dd/mm/yyyy
      estado: u.activo ? "Activo" : "Inactivo"
    }));

    // Totales de cabecera
    const totalUsuarios = await Usuario.count();
    const activos = await Usuario.count({ where: { activo: true } });
    const inactivos = totalUsuarios - activos;

    res.json({
      meta: { rango, estado, limit, offset, totalFiltrado: count, totalUsuarios, activos, inactivos },
      rows: tabla
    });
  } catch (err) {
    console.error("Error en getUsuariosTabla:", err);
    res.status(500).json({ error: "Error al obtener el reporte de usuarios" });
  }
};

// GET /api/reportes-usuario/clientes-nuevos-rango?rango=mes
exports.getClientesNuevos = async (req, res) => {
  try {
    const { Usuario, Sequelize } = require("../models");
    const { Op } = Sequelize;

    const rango = String(req.query.rango || "semana").toLowerCase(); // hoy|semana|mes|anio|todos
    const valid = new Set(["hoy", "semana", "mes", "anio", "todos"]);
    if (!valid.has(rango)) {
      return res.status(400).json({ message: "rango debe ser hoy|semana|mes|anio|todos" });
    }

    // 1) Fechas de inicio/fin
    const now = new Date();
    let start = null;
    let bucketExpr = null;      // DATE_TRUNC(...)
    let labelFmt = null;        // cómo formatear la etiqueta del bucket

    if (rango === "hoy") {
      // desde 00:00 del día → agrupado por hora
      start = new Date(now); start.setHours(0,0,0,0);
      bucketExpr = Sequelize.literal(`DATE_TRUNC('hour', "fecha_creacion")`);
      labelFmt = (d) => new Date(d).toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" });
    } else if (rango === "semana") {
      // últimos 7 días → agrupado por día
      start = new Date(now); start.setDate(start.getDate() - 6); start.setHours(0,0,0,0);
      bucketExpr = Sequelize.literal(`DATE_TRUNC('day', "fecha_creacion")`);
      labelFmt = (d) => new Date(d).toLocaleDateString("es-HN", { weekday: "short", day: "2-digit", month: "2-digit" });
    } else if (rango === "mes") {
      // desde el 1er día del mes actual → agrupado por día
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      bucketExpr = Sequelize.literal(`DATE_TRUNC('day', "fecha_creacion")`);
      labelFmt = (d) => new Date(d).toLocaleDateString("es-HN", { day: "2-digit", month: "short" });
    } else if (rango === "anio" || rango === "año") {
      // desde el 1er día del año → agrupado por mes
      start = new Date(now.getFullYear(), 0, 1);
      bucketExpr = Sequelize.literal(`DATE_TRUNC('month', "fecha_creacion")`);
      labelFmt = (d) => new Date(d).toLocaleDateString("es-HN", { month: "long", year: "numeric" });
    } else { // 'todos'
      // sin filtro de fecha → agrupado por mes completo
      bucketExpr = Sequelize.literal(`DATE_TRUNC('month', "fecha_creacion")`);
      labelFmt = (d) => new Date(d).toLocaleDateString("es-HN", { month: "long", year: "numeric" });
    }

    // 2) WHERE (si aplica)
    const where = {};
    if (rango !== "todos") where.fecha_creacion = { [Op.gte]: start, [Op.lte]: now };

    // 3) Consulta agrupada
    const rows = await Usuario.findAll({
      where,
      attributes: [
        [bucketExpr, "bucket"],
        [Sequelize.fn("COUNT", Sequelize.col("id_usuario")), "total"]
      ],
      group: [bucketExpr],
      order: [[Sequelize.literal("bucket"), "ASC"]],
      raw: true
    });

    // 4) Opcional: rellenar buckets faltantes (para hoy/semana/mes/anio)
    // Genera una secuencia desde start→now con el paso correcto
    const out = [];
    const stepMs = (() => {
      if (rango === "hoy")    return 60 * 60 * 1000;                // 1 hora
      if (rango === "semana") return 24 * 60 * 60 * 1000;           // 1 día
      if (rango === "mes")    return 24 * 60 * 60 * 1000;           // 1 día
      // anio/todos → delegamos a lo retornado (mes a mes); no rellenamos todos para 'todos' por tamaño
      return null;
    })();

    // indexar resultados
    const keyOf = (d) => {
      const dt = new Date(d);
      if (rango === "hoy")    return dt.toISOString().slice(0,13);          // YYYY-MM-DDTHH
      if (rango === "semana") return dt.toISOString().slice(0,10);          // YYYY-MM-DD
      if (rango === "mes")    return dt.toISOString().slice(0,10);          // YYYY-MM-DD
      return dt.toISOString().slice(0,7);                                   // YYYY-MM
    };
    const map = new Map(rows.map(r => [keyOf(r.bucket), Number(r.total)]));

    if (rango === "todos" || rango === "anio") {
      // Devolvemos tal cual lo agrupado (mes a mes)
      rows.forEach(r => out.push({
        bucket: r.bucket,
        label: labelFmt(r.bucket),
        total: Number(r.total)
      }));
    } else {
      // Relleno continuo
      for (let t = start.getTime(); t <= now.getTime(); t += stepMs) {
        const cur = new Date(t);
        const key = keyOf(cur);
        out.push({
          bucket: cur.toISOString(),
          label : labelFmt(cur.toISOString()),
          total : map.get(key) || 0
        });
      }
    }

    // 5) Totales útiles para otros widgets
    const totalUsuarios = await Usuario.count();
    const activos       = await Usuario.count({ where: { activo: true } });
    const inactivos     = totalUsuarios - activos;

    res.json({
      meta: { rango, totalUsuarios, activos, inactivos },
      series: out
    });
  } catch (err) {
    console.error("getClientesNuevosRango error:", err);
    res.status(500).json({ error: "No se pudo generar la serie de clientes nuevos" });
  }
};
