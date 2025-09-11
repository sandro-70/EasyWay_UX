module.exports = (sequelize, DataTypes) => {
  const marca_producto = sequelize.define("marca_producto", {
    id_marca_producto: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type : DataTypes.STRING,
      allowNull : false
    }
  }, {
    tableName: "marca_producto",
    timestamps: false
  });

  return marca_producto;
};