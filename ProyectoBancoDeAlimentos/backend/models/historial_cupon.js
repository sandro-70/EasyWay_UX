module.exports = (sequelize, DataTypes) => {
  const historial_cupon = sequelize.define('historial_cupon', {
    id_historial_cupon: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_cupon:           DataTypes.INTEGER,
    id_usuario:         DataTypes.INTEGER,
    id_pedido:          DataTypes.INTEGER,
    fecha_usado:        DataTypes.DATEONLY,
  }, {
    tableName: 'historial_cupon',
    timestamps: false,
    underscored: true,
  });
  return historial_cupon;
};