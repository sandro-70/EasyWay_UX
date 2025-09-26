module.exports = (sequelize, DataTypes) => {
  const politicas_reembolso = sequelize.define('politicas_reembolso', {
    id_politicas_reembolso:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    descripcion: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    tableName: 'politicas_reembolso',
    timestamps: false,
    underscored: true,
  });
  return politicas_reembolso;
};