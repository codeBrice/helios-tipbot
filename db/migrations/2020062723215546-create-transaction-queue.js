'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tbl_transaction_queue', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      transactions: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      isProcessed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      isTip: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      isRain: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      date : {
        type: Sequelize.DATE,
        allowNull: false,
      },
      msg_discord: {
        type: Sequelize.TEXT,
        allowNull:false
      },
      isProcessedFailed: {
        type: Sequelize.BOOLEAN,
        allowNull:false
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tbl_transaction_queue');
  }
};