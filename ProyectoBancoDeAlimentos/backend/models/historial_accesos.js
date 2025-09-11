module.exports = (sequelize, DataTypes) => {
  const historial_accesos = sequelize.define('historial_accesos', {
    id_historial_accesos: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_usuario:         DataTypes.INTEGER,
    fecha_de_ingreso:        DataTypes.DATE,
  }, {
    tableName: 'historial_accesos',
    timestamps: false,
    underscored: true,
  });

  return historial_accesos;
};