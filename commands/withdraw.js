require('dotenv').config();
const envConfig = process.env;
const TransactionQueueController = require('../controllers/transaction.queue.controller');
const TransactionController = require('../controllers/transactions.controller');
const UserInfoController = require('../controllers/userinfo.controller');
const SendTransaction = require('../entities/SendTransactions');
const Helios = require('../middleware/helios');
const Util = require('../util/util');
const MessageUtil = require('../util/Discord/message');
const conf = require('../config.js').jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const msgs = require('../util/msg.json');

/**
   * tipsplit
   * @date 2020-09-01
   * @param {any} msg
   * @return {any}
   */
exports.execute = async (msg) => {
  try {
    if ( Util.isDmChannel(msg.channel.type) ) {
      const amount = Util.parseFloat( global.ctx.args[1] );

      if ( typeof amount != 'number' || isNaN(amount) ) {
        msg.author.send( msgs.invalid_command + ', the helios amount is not numeric. ' + envConfig.ALIASCOMMAND + 'withdraw 100 0x00000');
        return;
      }
      const userInfoData = await UserInfoController.getUser( msg.author.id );
      if ( userInfoData ) {
        const getTotalAmountWithGas = await UserInfoController.getGasPriceSumAmount( amount );

        if ( getTotalAmountWithGas ) {
          const userInfoAuthorBalance = await UserInfoController.getBalance( msg.author.id );
          if ( userInfoAuthorBalance ) {
            if ( getTotalAmountWithGas >= userInfoAuthorBalance ) {
              msg.author.send( msgs.amount_gas_error + ', remember to have enough gas for the transaction.');
              MessageUtil.reactionFail( msg );
              return;
            }
            const tx = [];
            const transactionEntitie = new SendTransaction();
            transactionEntitie.from = userInfoData.wallet;
            transactionEntitie.to = global.ctx.args[2];
            transactionEntitie.gasPrice = await Helios.toWei(String(await Helios.getGasPrice()));
            transactionEntitie.gas = envConfig.GAS;
            transactionEntitie.value = await Helios.toWeiEther((String(amount)));
            transactionEntitie.keystore_wallet = userInfoData.keystore_wallet;
            tx.push( transactionEntitie );
            const getReceive = await new Promise( ( resolve, reject ) => {
              return global.clientRedis.get('receive:'+msg.author.id, async function(err, receive) {
                resolve(receive);
              });
            });
            const getTip = await new Promise( ( resolve, reject ) => {
              return global.clientRedis.get('tip:'+msg.author.id, async function(err, tip) {
                resolve(tip);
              });
            });
            if ( getReceive || getTip) {
              await TransactionQueueController.create( tx, msg, false, false);
              MessageUtil.reactionTransactionQueue( msg );
              return;
            }
            const sendTx = await TransactionController.sendTransaction( tx, userInfoData.keystore_wallet);
            if ( !sendTx.length ) {
              global.clientRedis.set( 'tip:'+msg.author.id, msg.author.id );
              global.clientRedis.expire('tip:'+msg.author.id, 11);
              msg.author.send( msgs.error_withdraw + envConfig.ALIASCOMMAND + 'withdraw 100 0x00000' );
              logger.error( error );
            } else {
              msg.author.send(MessageUtil.msgEmbed('Withdraw process', msgs.withdraw_success));
            }
          };
        }
      } else {
        msg.author.send( msgs.error_withdraw + envConfig.ALIASCOMMAND + 'withdraw 100 0x00000' );
        MessageUtil.reactionFail( msg );
        logger.error( error );
      }
    } else {
      msg.delete( msg );
      msg.author.send( msgs.direct_message + ' (`withdraw`)' );
    }
  } catch (error) {
    msg.author.send( msgs.error_withdraw + envConfig.ALIASCOMMAND + 'withdraw 100 0x00000');
    MessageUtil.reactionFail( msg );
    logger.error( error );
  }
};

exports.info = {
  alias: ['withdraw'],
};

