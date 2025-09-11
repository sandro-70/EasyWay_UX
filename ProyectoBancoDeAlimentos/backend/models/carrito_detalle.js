module.exports = (sequelize, DataTypes) => {
  const carrito_detalle = sequelize.define("carrito_detalle", {
    id_carrito_detalle: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_carrito: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_producto: DataTypes.INTEGER,
    cantidad_unidad_medida: DataTypes.DOUBLE,
    subtotal_detalle: DataTypes.DOUBLE
  }, {
    tableName: "carrito_detalle",
    timestamps: false
  });

  return carrito_detalle;
};
