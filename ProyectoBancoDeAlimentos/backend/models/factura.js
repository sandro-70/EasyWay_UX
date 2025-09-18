module.exports = (sequelize, DataTypes) => {
  const factura = sequelize.define('factura', {
    id_factura: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_pedido: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha_emision: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
    },
  }, {
    tableName: 'factura',
    timestamps: false,
    underscored: true,
  });
  return factura;
};