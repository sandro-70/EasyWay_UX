module.exports = (sequelize, DataTypes) => {
  const promocion = sequelize.define('promocion', {
    id_promocion:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_tipo_promo:  DataTypes.INTEGER,
    nombre_promocion:DataTypes.STRING,
    descripción:     DataTypes.TEXT,
    valor_fijo:      DataTypes.DOUBLE,
    valor_porcentaje:DataTypes.DECIMAL(5, 2),
    compra_min:      DataTypes.DOUBLE,
    fecha_inicio:    DataTypes.DATEONLY,
    activa:          DataTypes.BOOLEAN,
    banner_url:      DataTypes.BLOB('long'),
    fecha_termina:   DataTypes.DATEONLY,
    creado_en:       DataTypes.DATEONLY,
  }, {
    tableName: 'promocion',
    timestamps: false,
    underscored: true,
  });
  return promocion;
};