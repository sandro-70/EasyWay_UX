// models/producto.js
module.exports = (sequelize, DataTypes) => {
  const producto = sequelize.define(
    "producto",
    {
      id_producto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      nombre: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },

      descripcion: DataTypes.STRING(100),

      precio_base: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      id_subcategoria: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      unidad_medida: DataTypes.ENUM("unidad", "libra", "litro"),

      id_marca: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      porcentaje_ganancia: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      estrellas: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      etiquetas: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
    },
    {
      tableName: "producto",
      timestamps: false,
    }
  );
  return producto;
};
