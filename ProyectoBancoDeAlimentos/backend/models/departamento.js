module.exports = (sequelize, DataTypes) => {
  const departamento = sequelize.define("departamento", {
    id_departamento: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre_departamento: DataTypes.STRING
  }, {
    tableName: "departamento",
    timestamps: false
  });

  return departamento;
};
