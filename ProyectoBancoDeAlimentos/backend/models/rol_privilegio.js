module.exports = (sequelize, DataTypes) => {
  const rol_privilegio = sequelize.define('rol_privilegio', {
    id_rol:         { 
      type: DataTypes.INTEGER, 
      primaryKey: true },

    id_privilegio:  { 
      type: DataTypes.INTEGER, 
      primaryKey: true },
  }, {
    tableName: 'rol_privilegio',
    timestamps: false,
    underscored: true,
  });

  return rol_privilegio ;
};