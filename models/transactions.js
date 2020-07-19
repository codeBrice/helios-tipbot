'use strict';
module.exports = (sequelize, DataTypes) => {
  const transactions = sequelize.define('transactions', {
    from_user_info_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    to_user_info_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    helios_amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    send_status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    transaction_hash: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    isTip: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: "tbl_transactions",
    timestamps: false
  });

  transactions.associate = function(models) {
    models.userinfo.hasMany(models.transactions,
        {foreignKey: 'from_user_info_id'});
        models.userinfo.hasMany(models.transactions,
          {foreignKey: 'to_user_info_id'});
  };

  return transactions;
};