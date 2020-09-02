'use strict';
module.exports = (sequelize, DataTypes) => {
  const roulettes = sequelize.define('roulettes', {
    user_info_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    helios_amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
  }, {
    tableName: 'tbl_roulettes',
    timestamps: false,
  });

  roulettes.associate = function(models) {
    models.userinfo.hasMany(models.roulettes,
        {foreignKey: 'user_info_id'});
  };

  return roulettes;
};
