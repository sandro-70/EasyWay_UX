module.exports = (sequelize, DataTypes) => {
  const auditoria_inventario = sequelize.define("auditoria_inventario", {
    id_auditoria_inventario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_producto: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_sucursal: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cantidad: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    nombre_operacion: {
      type: DataTypes.ENUM("entrada", "salida", "ajuste"),
      allowNull: false
    },
    fecha_caducidad: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    fecha_movimiento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: "auditoria_inventario",
    timestamps: false
  });

  return auditoria_inventario;
};