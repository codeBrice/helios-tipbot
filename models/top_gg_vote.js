'use strict';
module.exports = (sequelize, DataTypes) => {
  const transactions = sequelize.define('topggvote', {
    user_discord_id: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    user_info_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    vote_count: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    last_date_vote: {
        type: DataTypes.DATE,
        allowNull: false,
    },
  }, {
    tableName: "tbl_topgg_vote",
    timestamps: false
  });

  transactions.associate = function(models) {
    models.userinfo.hasMany(models.topggvote,
        {foreignKey: 'user_info_id'});
  };

  return transactions;
};