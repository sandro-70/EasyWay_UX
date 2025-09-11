module.exports = (sequelize, DataTypes) => {
  const cupon = sequelize.define('cupon', {
    id_cupon:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codigo:           { type: DataTypes.STRING, unique: true },
    descripcion:      DataTypes.STRING,
    tipo:             DataTypes.STRING,
    valor:            DataTypes.DOUBLE,
    uso_por_usuario:  DataTypes.INTEGER,
    termina_en:       DataTypes.DATEONLY,
    activo:           DataTypes.BOOLEAN,
  }, {
    tableName: 'cupon',
    timestamps: false,
    underscored: true,
  });
  return cupon;
};
