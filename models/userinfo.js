'use strict';
module.exports = (sequelize, DataTypes) => {
  const userinfo = sequelize.define('userinfo', {
    user_discord_id: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    keystore_wallet: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    wallet: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    create_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: "tbl_user_info",
    timestamps: false
  });
  return userinfo;
};