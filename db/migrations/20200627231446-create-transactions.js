'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tbl_transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      from_user_info_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: 'tbl_user_info'
          },
          key: 'id'
        },
      },
      to_user_info_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: 'tbl_user_info'
          },
          key: 'id'
        },
      },
      helios_amount: {
        type: Sequelize.DECIMAL
      },
      send_status: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      transaction_hash: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      isTip: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      date : {
        type: Sequelize.DATE,
        allowNull: false,
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tbl_transactions');
  }
};