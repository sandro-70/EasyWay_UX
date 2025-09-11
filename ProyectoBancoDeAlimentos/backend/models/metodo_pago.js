module.exports = (sequelize, DataTypes) => {
  const metodo_pago = sequelize.define("metodo_pago", {
    id_metodo_pago: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_usuario: {
      type : DataTypes.INTEGER,
      allowNull : false
    },
    brand_tarjeta : DataTypes.STRING,
    tarjeta_ultimo : DataTypes.STRING,
    vencimiento_mes : DataTypes.INTEGER,
    vencimiento_ano : DataTypes.INTEGER,
    nombre_en_tarjeta : DataTypes.STRING,
    id_direccion_facturacion : DataTypes.INTEGER,
    token_pago : {
        type : DataTypes.STRING,
        allowNull : false
    },
    metodo_predeterminado : DataTypes.BOOLEAN,
    fecha_creacion : DataTypes.DATE //time stamp en base de datos
  }, {
    tableName: "metodo_pago",
    timestamps: false
  });

  return metodo_pago;
};