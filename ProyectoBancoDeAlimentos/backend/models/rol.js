module.exports = (sequelize, DataTypes) => {
  const rol = sequelize.define('rol', {
    id_rol:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_rol:   { type: DataTypes.STRING, allowNull: false },
  }, {
    tableName: 'rol',
    timestamps: false,
    underscored: true,
  });
  return rol;
};