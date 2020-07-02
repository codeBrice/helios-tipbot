'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tbl_user_info', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_discord_id: {
        type: Sequelize.STRING(200),
        allowNull: false,
        unique: true
      },
      wallet: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      keystore_wallet: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      create_date: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tbl_user_info');
  }
};