module.exports = (sequelize, DataTypes) => {
  const promocion_pedido = sequelize.define('promocion_pedido', {
    id_promocion_pedido: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_promocion:        DataTypes.INTEGER,
    id_pedido:           DataTypes.INTEGER,
    monto_descuento:     DataTypes.DOUBLE,
  }, {
    tableName: 'promocion_pedido',
    timestamps: false,
    underscored: true,
  });

  return promocion_pedido;
};