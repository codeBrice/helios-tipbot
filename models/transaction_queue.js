'use strict';
module.exports = (sequelize, DataTypes) => {
  const transactionsQueue = sequelize.define('transaction_queue', {
    transactions: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isProcessed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    msg_discord: {
        type: DataTypes.TEXT,
        allowNull:false
    },
    isTip: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    }, 
    isRain: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    isProcessedFailed: {
      type: DataTypes.BOOLEAN,
      allowNull:false
    },
    attemps: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    isTipAuthor: {
      type: DataTypes.BOOLEAN,
      allowNull:false
    },
  }, {
    tableName: "tbl_transaction_queue",
    timestamps: false
  });

  return transactionsQueue;
};