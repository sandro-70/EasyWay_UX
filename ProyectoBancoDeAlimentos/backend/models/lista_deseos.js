module.exports = (sequelize, DataTypes) => {
  const lista_deseos = sequelize.define("lista_deseos", {
    id_usuario:  { type: DataTypes.INTEGER, primaryKey: true },
    id_producto: { type: DataTypes.INTEGER, primaryKey: true },

  }, {
    tableName: "lista_deseos",
    timestamps: false
  });

  return lista_deseos;
};