module.exports = (sequelize, DataTypes) => {
  const reembolso_pedido = sequelize.define('reembolso_pedido', {
    id_reembolso_pedido:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_pedido:  DataTypes.INTEGER,
    motivo:      DataTypes.STRING(50)
  }, {
    tableName: 'reembolso_pedido',
    timestamps: false,
    underscored: true,
  });
  return reembolso_pedido;
};