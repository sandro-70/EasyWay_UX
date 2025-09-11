module.exports = (sequelize, DataTypes) => {
  const promocion_producto = sequelize.define('promocion_producto', {
    id_producto:  { type: DataTypes.INTEGER, primaryKey: true },
    id_promocion: { type: DataTypes.INTEGER, primaryKey: true },
  }, { tableName: 'promocion_producto', timestamps: false, underscored: true });
  return promocion_producto;
};
