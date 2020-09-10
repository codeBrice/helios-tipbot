'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([

      queryInterface.addColumn(
          {
            tableName: 'tbl_transaction_queue',
          },
          'isTipAuthor',
          {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false,
          },
      ).then((values) => {
        console.log('Success addColumn isTipAuthor');
      }).catch( (err) => {
        if ( !err.message.indexOf('isTipAuthor') ) {
          console.log(err.message);
        }

        return false;
      }),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn(
          {
            tableName: 'tbl_transaction_queue',
          },
          'isTipAuthor',
          {
            type: Sequelize.BOOLEAN,
          },
      ),
    ]).then((values) => {
      console.log('Success');
    }).catch( (error) => {
      console.log(error);
    });
  },
};
