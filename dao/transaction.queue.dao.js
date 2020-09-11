const {transaction_queue} = require('../models');
const conf = require('../config.js').jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();

/**
     * TransactionQueueDao
     * @date 2020-09-10
     */
class TransactionQueueDao {
  /**
     * 描述
     * @date 2020-09-10
     * @param {any} txs
     * @param {any} isProcessed
     * @param {any} date
     * @param {any} msgDiscord
     * @param {any} isTip
     * @param {any} isRain
     * @param {any} isTipAuthor
     * @return {any}
     */
  static async create( txs, isProcessed, date, msgDiscord, isTip, isRain, isTipAuthor ) {
    try {
      return transaction_queue.create({transactions: txs, isProcessed: isProcessed, date: date,
        msg_discord: msgDiscord, isTip: isTip, isRain: isRain, isProcessedFailed: false,
        attemps: 0, isTipAuthor: isTipAuthor});
    } catch (error) {
      logger.error( error );
    }
  }

  /**
   * update
   * @date 2020-09-10
   * @param {any} tx
   * @return {any}
   */
  static async update( tx ) {
    try {
      return transaction_queue.update( tx, {
        where: {
          id: tx.id,
        },
      });
    } catch (error) {
      logger.error( error );
    }
  }

  /**
   * delete
   * @date 2020-09-10
   * @return {any}
   */
  static async delete() {
    try {
      return transaction_queue.delete({
        where: {
          isProcessed: true,
        },
      });
    } catch (error) {
      logger.error( error );
    }
  }

  /**
   * findById
   * @date 2020-09-10
   * @param {any} id
   * @return {any}
   */
  static async findById( id ) {
    try {
      return transaction_queue.findOne({
        where: {
          id: id,
        },
      });
    } catch (error) {
      logger.error( error );
    }
  }

  /**
   * findAll
   * @date 2020-09-10
   * @return {any}
   */
  static async findAll() {
    try {
      return transaction_queue.findAll({
        where: {
          isProcessed: false,
        },
      });
    } catch (error) {
      logger.error( error );
    }
  }
}
module.exports = TransactionQueueDao;
