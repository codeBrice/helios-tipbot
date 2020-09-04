'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tbl_roulette_historics', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      bets: {
        type: Sequelize.TEXT,
      },
      winNumber: {
        type: Sequelize.STRING,
      },
      isFinish: {
        type: Sequelize.BOOLEAN,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tbl_roulette_historics');
  },
};
