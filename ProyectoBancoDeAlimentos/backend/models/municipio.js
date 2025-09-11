module.exports = (sequelize, DataTypes) => {
  const municipio = sequelize.define("municipio", {
    id_municipio: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_departamento: DataTypes.INTEGER,
    nombre_municipio: DataTypes.STRING
  }, {
    tableName: "municipio",
    timestamps: false
  });

  return municipio;
};
