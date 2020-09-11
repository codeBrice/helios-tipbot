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
const RouletteController = require('../controllers/roulette.controller');

/**
   * tipsplit
   * @date 2020-09-01
   * @param {any} msg
   * @return {any}
   */
exports.execute = async ( msg ) => {
  try {
    logger.info('start withdrawRoulette');
    if ( Util.isDmChannel(msg.channel.type) ) {
      const amount = parseFloat( global.ctx.args[1] );
      // Amount Validate
      if (Util.amountValidator(amount, msg, msgs.invalid_command+
          ` example: ${global.client.config.PREFIX}rwithdraw 10`)) return;

      const amountGas = await UserInfoController.getGasPriceSumAmount( amount );

      if (await Util.rouletteBalanceValidator(amountGas, msg,
          msgs.amount_gas_error +
            ', remember to have enough gas for the transaction.')) return;

      if (await Util.botBalanceValidator(amountGas, msg,
          msgs.bot_amount_gas_error)) return;

      const userTipIdList = [];
      const botData = await UserInfoController.getUser( msg.client.user.id );
      userTipIdList.push( {user_discord_id: msg.author.id,
        tag: msg.author.username} );
      // transaction object
      const toUser = await UserInfoController.getUser( msg.author.id );
      const tx = [];
      const transactionEntitie = new SendTransaction();
      transactionEntitie.from = botData.wallet;
      transactionEntitie.to = toUser.wallet;
      transactionEntitie.gasPrice = await Helios.toWei(String(await Helios.getGasPrice()));
      transactionEntitie.gas = envConfig.GAS;
      transactionEntitie.value = await Helios.toWeiEther((String(amount)));
      transactionEntitie.keystore_wallet = botData.keystore_wallet;
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
      const sendTx = await TransactionController.sendTransaction( tx, botData.keystore_wallet);
      if ( !sendTx.length ) {
        global.clientRedis.set( 'tip:'+msg.author.id, msg.author.id );
        global.clientRedis.expire('tip:'+msg.author.id, 11);
        msg.author.send( msgs.error_withdraw + envConfig.ALIASCOMMAND + 'withdraw 100 0x00000' );
        logger.error( error );
      } else {
        await RouletteController.updateBalance(msg.author.id, amountGas, false);
        msg.author.send(MessageUtil.msgEmbed('Withdraw process', msgs.withdraw_success));
      }
    } else {
      msg.delete( msg );
      msg.author.send( msgs.direct_message + ' (`rwithdraw`)' );
    }
  } catch (error) {
    logger.error( error );
  }
};

exports.info = {
  alias: ['rwithdraw'],
};

