module.exports = (sequelize, DataTypes) => {
  const valoracion_producto = sequelize.define("valoracion_producto", {
    id_valoracion_producto: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_producto: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    puntuacion: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    comentario: DataTypes.STRING(255),
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: "valoracion_producto",
    timestamps: false
  });

  return valoracion_producto;
};
