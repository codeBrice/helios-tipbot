require('dotenv').config();
const envConfig = process.env;
const TransactionDao = require('../dao/transaction.dao');
const Helios = require('../middleware/helios');
const moment = require('moment');
const Transaction = require('../entities/Transaction');
/**
   * TransactionController
   * @date 2020-09-10
   */
class TransactionController {
  /**
   * sendTransaction
   * @date 2020-09-10
   * @param {any} txs
   * @param {any} keystoreWallet
   * @return {any}
   */
  static async sendTransaction( txs, keystoreWallet ) {
    const privateKey = await Helios.jsonToAccount( keystoreWallet, envConfig.ENCRYPT_KEYSTORE);
    const sendTx = await Helios.sendTransaction( txs, privateKey.privateKey );
    if ( sendTx ) {
      return txs;
    }
    return null;
  }

  /**
   * receiveTransaction
   * @date 2020-09-10
   * @param {any} receive
   * @param {any} keystore
   * @param {any} isTip=false
   * @param {any} userIdSend
   * @param {any} userIdReceive
   * @return {any}
   */
  static async receiveTransaction( receive, keystore, isTip = false, userIdSend, userIdReceive ) {
    const getReceive = await new Promise( ( resolve, reject ) => {
      return global.clientRedis.get('receive:'+receive.user_discord_id_receive, async function(err, receive) {
        resolve(receive);
      });
    });
    const getTip = await new Promise( ( resolve, reject ) => {
      return global.clientRedis.get('tip:'+receive.user_discord_id_receive, async function(err, tip) {
        resolve(tip);
      });
    });

    if ( getReceive || getTip ) {
      return [];
    }

    const privateKey = await Helios.jsonToAccount( keystore, envConfig.ENCRYPT_KEYSTORE );
    const receiveTxs = await Helios.getReceivableTransactions( receive.to, privateKey.privateKey );
    if ( receiveTxs.length ) {
      global.clientRedis.set( 'receive:'+receive.user_discord_id_receive, userIdReceive );
      global.clientRedis.expire('receive:'+receive.user_discord_id_receive, 11);
      const transaction = new Transaction();
      transaction.send_status = true;
      transaction.date = moment().utc().toDate();
      if ( isTip ) {
        transaction.isTip = true;
        transaction.to_user_info_id = userIdReceive;
        transaction.from_user_info_id = userIdSend;
        transaction.helios_amount = receive.helios_amount;
        transaction.transaction_hash = receiveTxs[0].hash;
        await TransactionDao.create( transaction );
      } else {
        transaction.to_user_info_id = userIdReceive;
        transaction.from_user_info_id = userIdReceive;
        transaction.isTip = false;
        for ( const receive of receiveTxs ) {
          transaction.helios_amount = await Helios.getAmountFloat(receive.value);
          transaction.transaction_hash = receive.hash;
          await TransactionDao.create( transaction );
        }
      }
    }
    return receiveTxs;
  }
}
module.exports = TransactionController;
