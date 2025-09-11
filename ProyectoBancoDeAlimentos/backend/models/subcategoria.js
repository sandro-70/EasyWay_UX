module.exports = (sequelize, DataTypes) => {
  const subcategoria = sequelize.define("subcategoria", {
    id_subcategoria: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
        type : DataTypes.STRING,
        allowNull : false
    },
    id_categoria_padre : {
        type : DataTypes.INTEGER,
        allowNull : false
    },
    url_icono_subcategoria : DataTypes.STRING,
    porcentaje_ganancias : DataTypes.DECIMAL(10,2)
  }, {
    tableName: "subcategoria",
    timestamps: false
  });

  return subcategoria;
};