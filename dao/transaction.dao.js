const {transactions} = require('../models');
const conf = require('../config.js').jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();

/**
     * TransactionDao
     * @date 2020-09-10
     */
class TransactionDao {
  /**
     * create
     * @date 2020-09-10
     * @param {any} transaction
     * @return {any}
     */
  static async create( transaction ) {
    try {
      return transactions.create(transaction);
    } catch (error) {
      logger.error( error );
    }
  }

  /**
     * bulkCreate
     * @date 2020-09-10
     * @param {any} txs
     * @return {any}
     */
  static async bulkCreate( txs ) {
    try {
      transactions.bulkCreate( txs ).then( (tx) => {
        return tx;
      }).catch( (error) => {
        logger.error( error );
      });
    } catch (error) {
      logger.error( error );
    }
  }
}
module.exports = TransactionDao;
