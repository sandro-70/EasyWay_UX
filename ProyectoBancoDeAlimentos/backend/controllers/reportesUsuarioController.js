const {Sequelize} = require('sequelize');
const { factura, factura_detalle, producto, pedido, Usuario, estado_pedido, valoracion_producto, promocion_pedido } = require("../models");

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

    // Suma de descuentos de pedidos (cupones) para todos los pedidos del usuario
    const descuentoPedidos = await pedido.findAll({
      attributes: [
        [Sequelize.fn("SUM", Sequelize.fn("COALESCE", Sequelize.col("descuento"), 0)), "total_descuento_pedidos"]
      ],
      where: { id_usuario },
      raw: true
    });

    // Suma de descuentos de promociones aplicadas a todos los pedidos del usuario
    const descuentoPromociones = await promocion_pedido.findAll({
      attributes: [
        [Sequelize.fn("SUM", Sequelize.fn("COALESCE", Sequelize.col("monto_descuento"), 0)), "total_descuento_promociones"]
      ],
      include: [
        {
          model: pedido,
          attributes: [],
          where: { id_usuario }
        }
      ],
      raw: true
    });

    const totalDescuentoPedidos = Number(descuentoPedidos?.[0]?.total_descuento_pedidos ?? 0);
    const totalDescuentoPromociones = Number(descuentoPromociones?.[0]?.total_descuento_promociones ?? 0);
    const totalAhorrado = totalDescuentoPedidos + totalDescuentoPromociones;

    res.json({ total_ahorrado: totalAhorrado });
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
      usuario: nombreUI(u),                 // <-- "Nombre Apellido" o user del correo
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

exports.getReporteUsuariosCompras = async (req, res) => {
  try {
    const db = require("../models");
    const { Sequelize } = db;

    // Filtros opcionales
    const limit = Number(req.query.limit || 50);
    const offset = Number(req.query.offset || 0);
    const estado = String(req.query.estado || "todos").toLowerCase(); // todos|activos|inactivos

    const whereUser = estado === "activos" ? "AND u.activo = true" : estado === "inactivos" ? "AND u.activo = false" : "";

    // Raw query for efficiency
    const query = `
      SELECT
        u.id_usuario AS id,
        CONCAT(u.nombre, ' ', COALESCE(u.apellido, '')) AS nombre,
        CASE WHEN u.activo THEN 'Activo' ELSE 'Inactivo' END AS estado,
        COALESCE(stats.cantidad_compras, 0) AS cantidad_compras,
        COALESCE(stats.total_comprado, 0) AS total_comprado,
        COALESCE(stats.promedio_compra, 0) AS promedio_compra,
        COALESCE(stats.frecuencia_compras, 0) AS frecuencia_compras,
        COALESCE(stats.producto_estrella, 'N/A') AS producto_estrella
      FROM usuario u
      LEFT JOIN (
        SELECT
          p.id_usuario,
          COUNT(f.id_factura) AS cantidad_compras,
          SUM(f.total) AS total_comprado,
          CASE WHEN COUNT(f.id_factura) > 0 THEN ROUND(SUM(f.total) / COUNT(f.id_factura), 2) ELSE 0 END AS promedio_compra,
          COUNT(DISTINCT DATE(f.fecha_emision)) AS frecuencia_compras,
          (
            SELECT pr.nombre
            FROM producto pr
            INNER JOIN factura_detalle fd ON pr.id_producto = fd.id_producto
            INNER JOIN factura ff ON fd.id_factura = ff.id_factura
            WHERE ff.id_pedido IN (SELECT pp.id_pedido FROM pedido pp WHERE pp.id_usuario = p.id_usuario)
            GROUP BY pr.id_producto
            ORDER BY SUM(fd.cantidad_unidad_medida) DESC
            LIMIT 1
          ) AS producto_estrella
        FROM pedido p
        INNER JOIN factura f ON p.id_pedido = f.id_pedido
        GROUP BY p.id_usuario
      ) stats ON u.id_usuario = stats.id_usuario
      WHERE u.id_rol = 2 ${whereUser}
      ORDER BY stats.total_comprado DESC NULLS LAST, u.id_usuario
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [results] = await db.sequelize.query(query, { type: Sequelize.QueryTypes.SELECT });

    // Totales generales
    const totalQuery = `
      SELECT COUNT(*) AS totalUsuarios, COALESCE(SUM(stats.cantidad_compras), 0) AS totalCompras, COALESCE(SUM(stats.total_comprado), 0) AS totalGastado
      FROM usuario u
      LEFT JOIN (
        SELECT p.id_usuario, COUNT(f.id_factura) AS cantidad_compras, SUM(f.total) AS total_comprado
        FROM pedido p
        INNER JOIN factura f ON p.id_pedido = f.id_pedido
        GROUP BY p.id_usuario
      ) stats ON u.id_usuario = stats.id_usuario
      WHERE u.id_rol = 2 ${whereUser}
    `;

    const totalResults = await db.sequelize.query(totalQuery, { type: Sequelize.QueryTypes.SELECT });
    const meta = {
      estado,
      limit,
      offset,
      totalUsuarios: totalResults[0]?.totalUsuarios || 0,
      totalCompras: totalResults[0]?.totalCompras || 0,
      totalGastado: totalResults[0]?.totalGastado || 0,
    };

    res.json({
      meta,
      rows: results,
    });
  } catch (error) {
    console.error("[getReporteUsuariosCompras] Error:", error);
    res.status(500).json({ error: "Error al obtener reporte de compras de usuarios" });
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
