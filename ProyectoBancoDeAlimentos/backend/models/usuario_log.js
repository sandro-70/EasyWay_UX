module.exports = (sequelize, DataTypes) => {
  const usuario_log = sequelize.define("usuario_log", {
    id_usuario_log: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_usuario: {
      type: DataTypes.INTEGER
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
    }
  }, {
    tableName: "usuario_log",
    timestamps: false
  });

  return usuario_log;
};