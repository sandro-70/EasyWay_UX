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
    id_metodo_pago: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    fecha_emision: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    impuestos: {
      type: DataTypes.DECIMAL(10, 2),
    },
    costo_evio: {
      type: DataTypes.DECIMAL(10, 2),
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