module.exports = (sequelize, DataTypes) => {
  const sucursal = sequelize.define("sucursal", {
    id_sucursal: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_municipio: {
      type: DataTypes.INTEGER
    },
    nombre_sucursal: DataTypes.STRING,
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: "sucursal",
    timestamps: false
  });

  return sucursal;
};
