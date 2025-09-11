module.exports = (sequelize, DataTypes) => {
  const sucursal_producto = sequelize.define("sucursal_producto", {
    id_sucursal_producto: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_sucursal: {
      type: DataTypes.INTEGER
    },
    id_producto: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    etiquetas: DataTypes.ENUM('Nuevo', 'En oferta'),
    stock_disponible: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: "sucursal_producto",
    timestamps: false
  });

  return sucursal_producto;
};
