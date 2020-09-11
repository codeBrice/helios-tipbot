const TransactionQueueDao = require('../dao/transaction.queue.dao');
const moment = require('moment');

/**
     * TransactionQueueController
     * @date 2020-09-10
     */
class TransactionQueueController {
  /**
     * 描述
     * @date 2020-09-10
     * @param {any} txs
     * @param {any} msgDiscord
     * @param {any} isTip=false
     * @param {any} isRain=false
     * @param {any} isTipAuthor=false
     * @return {any}
     */
  static async create( txs, msgDiscord, isTip = false, isRain = false, isTipAuthor = false ) {
    const queue = await TransactionQueueDao.create( JSON.stringify(txs), false,
        moment().utc().toDate(), JSON.stringify({message_id: msgDiscord.id,
          channel_id: msgDiscord.channel.id}), isTip, isRain, isTipAuthor );
    return queue;
  }

  /**
   * findAll
   * @date 2020-09-10
   * @return {any}
   */
  static async findAll() {
    return await TransactionQueueDao.findAll();
  }

  /**
   * update
   * @date 2020-09-10
   * @param {any} tx
   * @return {any}
   */
  static async update( tx ) {
    return await TransactionQueueDao.update( tx );
  }
}
module.exports = TransactionQueueController;
