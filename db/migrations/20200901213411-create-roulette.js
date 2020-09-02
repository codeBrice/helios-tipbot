'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tbl_roulettes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_info_id: {
        type: Sequelize.INTEGER,
      },
      helios_amount: {
        type: Sequelize.DECIMAL,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tbl_roulettes');
  },
};
