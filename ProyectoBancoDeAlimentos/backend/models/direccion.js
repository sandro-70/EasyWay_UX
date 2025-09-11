module.exports = (sequelize, DataTypes) => {
  const direccion = sequelize.define("direccion", {
    id_direccion: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    calle: DataTypes.STRING(255),
    ciudad: DataTypes.STRING(100),
    codigo_postal: DataTypes.STRING(20),
    predeterminada: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    id_municipio: DataTypes.INTEGER
  }, {
    tableName: "direccion",
    timestamps: false
  });

  return direccion;
};
