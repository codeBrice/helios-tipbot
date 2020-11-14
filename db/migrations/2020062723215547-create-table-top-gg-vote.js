'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tbl_topgg_vote', {
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
      user_info_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: 'tbl_user_info'
          },
          key: 'id'
        },
      },
      vote_count: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      last_date_vote: {
        type: Sequelize.DATE,
        allowNull: false,
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tbl_topgg_vote');
  }
};