const { Op } = require("sequelize");
const {
  sequelize,
  producto,
  categoria,
  subcategoria,
  sucursal_producto,
  sucursal,
  carrito,
  carrito_detalle,
  marca_producto,
  imagen_producto,
} = require("../models");

async function GetAllProductos() {
  const productosList = await producto.findAll({
    attributes: [
      "id_producto",
      "nombre",
      "descripcion",
      "precio_base",
      "unidad_medida",
      "activo",
    ],
    include: [
      {
        model: subcategoria,
        as: "subcategoria",
        attributes: ["id_subcategoria", "nombre"],
       include: [
          {
            model: categoria,
            attributes: ["id_categoria", "nombre"],
            as: "categoria", // Asegúrate el alias correcto aquí
          },
        ],
      },
      
      {
        model: marca_producto,
        as: "marca",
        attributes: ["id_marca_producto", "nombre"],
      },
      {
        model: sucursal_producto,
        as: "stock",
        attributes: [
          "id_sucursal_producto",
          "id_sucursal",
          "stock_disponible",
          [sequelize.fn('COALESCE', sequelize.col('sucursal_producto.precio_venta'), '0')], // Precio de venta
        ],
        where: { activo: true }, // Filtra solo los productos activos en sucursales
        include: [
          {
            model: sucursal,
            as: "sucursal",
            attributes: ["id_sucursal", "nombre_sucursal"],
          },
        ],
      },
    ],
    order: [["id_producto", "ASC"]],
  });

  if (!productosList || productosList.length === 0) {
    throw new Error("No se encontraron productos.");
  }
  return productosList;
}

async function GetSucursales() {
  const sucursales = await sucursal.findAll();
  if (!sucursales || sucursales.length === 0) {
    throw new Error("No se encontro ninguna sucursal.");
  }
  return sucursales;
}

function toInt(v) {
  const n = Number(v);
  return Number.isInteger(n) ? n : NaN;
}

async function abastecerPorProductoSucursal({
  id_sucursal,
  id_producto,
  cantidad,
  modo = "sumar",
  etiquetas,
}) {
  const sid = toInt(id_sucursal);
  const pid = toInt(id_producto);

  if (Number.isNaN(sid) || Number.isNaN(pid)) {
    throw new Error("id_sucursal o id_producto inválido");
  }

  const c = Number(cantidad);
  if (!Number.isFinite(c)) throw new Error("cantidad inválida");

  if (modo === "sumar") {
    if (!Number.isInteger(c) || c <= 0) {
      throw new Error('cantidad inválida: en "sumar" debe ser entero > 0');
    }
  } else if (modo === "reemplazar") {
    if (!Number.isInteger(c) || c < 0) {
      throw new Error(
        'cantidad inválida: en "reemplazar" debe ser entero >= 0'
      );
    }
  } else {
    throw new Error('modo inválido: usa "sumar" o "reemplazar"');
  }

  if (etiquetas != null && !["Nuevo", "En oferta"].includes(etiquetas)) {
    throw new Error('etiquetas inválida: usa "Nuevo" o "En oferta"');
  }

  return await sequelize.transaction(async (t) => {
    // 1) Buscar el registro (debe existir)
    const sp = await sucursal_producto.findOne({
      where: { id_sucursal: sid, id_producto: pid },
      transaction: t,
      lock: t.LOCK.UPDATE, // evita condiciones de carrera
    });

    if (!sp) {
      throw new Error(
        "No existe relación producto-sucursal (sucursal_producto) para esos IDs"
      );
    }

    // 2) Actualizar stock según el modo
    if (modo === "sumar") {
      await sp.increment("stock_disponible", { by: c, transaction: t });
      if (etiquetas != null) {
        sp.etiquetas = etiquetas;
        await sp.save({ transaction: t });
      }
    } else {
      sp.stock_disponible = c;
      if (etiquetas != null) sp.etiquetas = etiquetas;
      await sp.save({ transaction: t });
    }

    // 3) Recargar con includes útiles (si tienes asociaciones definidas)
    await sp.reload({
      include: [
        {
          model: producto,
          attributes: ["id_producto", "nombre", "precio_base", "unidad_medida"],
        },
        { model: sucursal, attributes: ["id_sucursal", "nombre_sucursal"] },
      ],
      transaction: t,
    });

    return {
      ok: true,
      modo,
      id_sucursal_producto: sp.id_sucursal_producto,
      id_sucursal: sp.id_sucursal,
      id_producto: sp.id_producto,
      stock_disponible: sp.stock_disponible,
      etiquetas: sp.etiquetas ?? null,
      producto: sp.producto || null,
      sucursal: sp.sucursal || null,
    };
  });
}

const UNIDADES_PERMITIDAS = ["unidad", "libra", "litro"];


async function crearProductoConStockEnSucursales(payload = {}) {
  const {
    nombre,
    descripcion = null,
    precio_base,
    id_subcategoria,
    id_marca, // -> marca_producto.id_marca_producto
    unidad_medida = "unidad",
    activo = true,
    etiquetas, // ARRAY(STRING) en Postgres; si usas MySQL => usar JSON
  } = payload;

  // --- Validaciones básicas ---
  if (!nombre || typeof nombre !== "string") throw new Error("nombre es requerido");

  const precio = Number(precio_base);
  if (!Number.isFinite(precio) || precio <= 0) throw new Error("precio_base inválido");

  const subId   = toInt(id_subcategoria);
  const marcaId = toInt(id_marca);
  if (Number.isNaN(subId)   || subId   <= 0) throw new Error("id_subcategoria inválido");
  if (Number.isNaN(marcaId) || marcaId <= 0) throw new Error("id_marca inválido");

  if (!UNIDADES_PERMITIDAS.includes(unidad_medida)) {
    throw new Error(`unidad_medida inválida. Usa: ${UNIDADES_PERMITIDAS.join(", ")}`);
  }

  // --- Normalizar etiquetas a array<string> o null ---
  let etiquetasArr = null;
  if (etiquetas !== undefined && etiquetas !== null) {
    if (Array.isArray(etiquetas)) {
      etiquetasArr = etiquetas.map(s => typeof s === "string" ? s.trim() : "")
                              .filter(Boolean);
    } else if (typeof etiquetas === "string") {
      etiquetasArr = etiquetas.split(",").map(s => s.trim()).filter(Boolean);
    } else {
      throw new Error("etiquetas debe ser array de strings o string CSV");
    }
  }

  // --- Transacción ---
  return await sequelize.transaction(async (t) => {
    // FK existentes
    const sub = await subcategoria.findByPk(subId, { transaction: t });
    if (!sub) throw new Error("La subcategoría no existe");

    const marca = await marca_producto.findByPk(marcaId, { transaction: t });
    if (!marca) throw new Error("La marca no existe");

    // 1) Crear producto
    const prod = await producto.create({
      nombre: nombre.trim(),
      descripcion,
      precio_base: precio,
      id_subcategoria: subId,
      id_marca: marcaId,
      unidad_medida,
      activo: !!activo,
      etiquetas: etiquetasArr?.length ? etiquetasArr : null, // requiere ARRAY(STRING) en Postgres
    }, { transaction: t });

    // 2) Traer TODAS las sucursales
    const sucursales = await sucursal.findAll({
      attributes: ["id_sucursal"],
      transaction: t,
      lock: t.LOCK.SHARE,
    });

    // 3) Crear sucursal_producto con stock = 0 para cada sucursal
    if (sucursales.length) {
      const filas = sucursales.map((s) => ({
        id_sucursal: s.id_sucursal,
        id_producto: prod.id_producto,
        stock_disponible: 0,
      }));
      await sucursal_producto.bulkCreate(filas, { transaction: t });
    }

    // 4) Devolver el producto con include usando ALIAS correctos
    const creado = await producto.findByPk(prod.id_producto, {
      transaction: t,
      include: [
        {
          model: subcategoria,
          as: "subcategoria",
          attributes: ["id_subcategoria", "nombre"],
        },
        {
          model: marca_producto,
          as: "marca",
          attributes: ["id_marca_producto", "nombre"],
        },
        {
          model: sucursal_producto,
          as: "stock", // <-- alias definido en asociaciones
          attributes: ["id_sucursal_producto", "id_sucursal", "stock_disponible"],
        },
      ],
    });

    return {
      ok: true,
      producto: creado,
      sucursales_asignadas: sucursales.length,
    };
  });
}

module.exports = {
  GetAllProductos,
  GetSucursales,
  abastecerPorProductoSucursal,
  crearProductoConStockEnSucursales,
};
