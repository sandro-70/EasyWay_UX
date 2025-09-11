module.exports = (sequelize, DataTypes) => {
  const imagen_producto = sequelize.define("imagen_producto", {
    id_imagen: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_producto: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    url_imagen: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    orden_imagen: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: "imagen_producto",
    timestamps: false
  });

  return imagen_producto;
};
