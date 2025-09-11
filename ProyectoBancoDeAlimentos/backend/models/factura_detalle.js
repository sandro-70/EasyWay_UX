module.exports = (sequelize, DataTypes) => {
  const factura_detalle = sequelize.define('factura_detalle', {
    id_factura_detalle: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_factura:        DataTypes.INTEGER,
    id_producto:       DataTypes.INTEGER,
    cantidad_unidad_medida:  DataTypes.DOUBLE,
    subtotal_producto:         DataTypes.DOUBLE,
  }, {
    tableName: 'factura_detalle',
    timestamps: false,
    underscored: true,
  });
  return factura_detalle;
};