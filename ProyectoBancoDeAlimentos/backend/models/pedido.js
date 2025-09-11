module.exports = (sequelize, DataTypes) => {
  const pedido = sequelize.define('pedido', {
    id_pedido:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_estado_pedido:        DataTypes.INTEGER,
    id_usuario:       { type: DataTypes.INTEGER, allowNull: false },
    fecha_pedido:     { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    direccion_envio:  DataTypes.STRING(100),
    id_sucursal:      DataTypes.INTEGER,
    descuento:        DataTypes.DECIMAL(10, 2),
    id_cupon : DataTypes.INTEGER,
  }, {
    tableName: 'pedido',
    timestamps: false,
    underscored: true,
  });
  return pedido;
};