module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define('Usuario', {
  id_usuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(55),
    allowNull: true,
  },
  apellido : DataTypes.STRING(55),
  correo: {
    type: DataTypes.STRING(55),
    allowNull: false,
    unique: true,
  },
  contraseña: {
    type: DataTypes.STRING(155),
    allowNull: false,
  },
  id_rol: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  fecha_actualizacion: {
    type: DataTypes.DATE,
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  foto_perfil_url: {
    type: DataTypes.STRING(255),
  },
  tema: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  autenticacion_dos_pasos : {type : DataTypes.BOOLEAN, defaultValue : false},
  genero : DataTypes.ENUM('masculino', 'femenino', 'otro')
}, {
  sequelize,
  modelName: 'Usuario',
  tableName: 'usuario',
  timestamps: false,
});
  return Usuario;
}