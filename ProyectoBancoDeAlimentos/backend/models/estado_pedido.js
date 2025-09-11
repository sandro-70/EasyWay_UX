module.exports = (sequelize, DataTypes) => {
  const estado_pedido = sequelize.define("estado_pedido", {
    id_estado_pedido: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre_pedido : DataTypes.STRING
  }, {
    tableName: "estado_pedido",
    timestamps: false
  });

  return estado_pedido;
};