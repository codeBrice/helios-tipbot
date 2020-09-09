require('dotenv').config();
const envConfig = process.env;
const UserInfoController = require('../controllers/userinfo.controller');
const userInfoController = new UserInfoController();
const Util = require('../util/util');
const conf = require('../config.js').jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const msgs = require('../util/msg.json');
const MessageUtil = require('../util/Discord/message');
const MESSAGEUTIL = new MessageUtil();
const TransactionController = require('../controllers/transactions.controller');
const TRANSACTIONCONTROLLER = new TransactionController();
const SendTransaction = require('../entities/SendTransactions');
const Helios = require('../middleware/helios');
const HELIOS = new Helios();
const TransactionQueueController = require('../controllers/transaction.queue.controller');
const TRANSACTIONQUEUECONTROLLER = new TransactionQueueController();

/**
   * Account class
   */
class Account {
  /**
   * 描述
   * @date 2020-09-01
   * @param {any} msg
   * @return {any}
   */
  async generateAccount( msg ) {
    try {
      // console.log( 'msg guild id: ' + msg.guild + ' msg author id: ' + msg.author.id );
      const isDm = Util.isDmChannel( msg.channel.type );
      if ( isDm ) {
        const userInfo = await userInfoController.generateUserWallet( msg.author.id );
        if ( userInfo ) {
          await msg.author.send( MESSAGEUTIL.msg_embed('Generate account', 'Your wallet is: '+ '`'+userInfo.account.address+'`') );
        } else {
          msg.author.send('You already have a wallet, please use the `wallet` command to know it.');
        }
      } else {
        msg.delete( msg );
        msg.author.send( msgs.direct_message + ' (`' + msg.content + '`)' );
      }
    } catch (error) {
      logger.error( error );
    }
  }

  /**
   * getPrivateKey
   * @date 2020-09-01
   * @param {any} msg
   * @return {any}
   */
  async getPrivateKey( msg ) {
    try {
      // console.log( 'msg guild id: ' + msg.guild + ' msg author id: ' + msg.author.id );
      const isDm = Util.isDmChannel( msg.channel.type );
      if ( isDm ) {
        const userInfoPrivateKey = await userInfoController.getPrivateKey( msg.author.id );
        if ( userInfoPrivateKey ) {
          await msg.author.send( MESSAGEUTIL.msg_embed( 'Private key', 'Your private key is: '+ '`'+ userInfoPrivateKey +'`'));
        } else {
          await msg.author.send('You dont have a account.');
        };
      } else {
        msg.delete( msg );
        msg.author.send( msgs.direct_message + ' (`' + msg.content + '`)' );
      }
    } catch (error) {
      logger.error( error );
    }
  }

  /**
   * getBalance
   * @date 2020-09-01
   * @param {any} msg
   * @return {any}
   */
  async getBalance( msg ) {
    try {
      const userInfo = await userInfoController.getUser( msg.author.id );
      if ( !userInfo ) {
        await msg.author.send('You dont have a account.');
        return;
      }
      const userInfoBalance = await userInfoController.getBalance( msg.author.id );
      if ( userInfoBalance ) {
        msg.author.send( MESSAGEUTIL.msg_embed('Balance', msgs.balance + userInfoBalance + ' HLS') );
        const isDm = Util.isDmChannel( msg.channel.type );
        if ( !isDm ) {
          MESSAGEUTIL.reaction_dm( msg );
        }
      } else {
        msg.author.send( msgs.balance_error );
      }
    } catch (error) {
      logger.error( error );
    }
  }
  /**
   * getWallet
   * @date 2020-09-01
   * @param {any} msg
   * @return {any}
   */
  async getWallet( msg ) {
    try {
      const userInfoWallet = await userInfoController.getWallet( msg.author.id );
      if ( userInfoWallet ) {
        msg.author.send( MESSAGEUTIL.msg_embed('Wallet info', msgs.wallet +'`'+userInfoWallet+'`'));
        const isDm = Util.isDmChannel( msg.channel.type );
        if ( !isDm ) {
          MESSAGEUTIL.reaction_dm( msg );
        }
      } else {
        msg.author.send( msgs.wallet_error);
        MESSAGEUTIL.reaction_fail( msg );
      }
    } catch (error) {
      msg.author.send( msgs.wallet_error);
      MESSAGEUTIL.reaction_fail( msg );
      logger.error( error );
    }
  }

  /**
   * withdraw
   * @date 2020-09-01
   * @param {any} msg
   * @return {any}
   */
  async withdraw( msg ) {
    try {
      if ( Util.isDmChannel(msg.channel.type) ) {
        const amount = Util.parseFloat( global.ctx.args[1] );

        if ( typeof amount != 'number' || isNaN(amount) ) {
          msg.author.send( msgs.invalid_command + ', the helios amount is not numeric. ' + envConfig.ALIASCOMMAND + 'withdraw 100 0x00000');
          return;
        }
        const userInfoData = await userInfoController.getUser( msg.author.id );
        if ( userInfoData ) {
          const getTotalAmountWithGas = await userInfoController.getGasPriceSumAmount( amount );

          if ( getTotalAmountWithGas ) {
            const userInfoAuthorBalance = await userInfoController.getBalance( msg.author.id );
            if ( userInfoAuthorBalance ) {
              if ( getTotalAmountWithGas >= userInfoAuthorBalance ) {
                msg.author.send( msgs.amount_gas_error + ', remember to have enough gas for the transaction.');
                MESSAGEUTIL.reaction_fail( msg );
                return;
              }
              const tx = [];
              const transactionEntitie = new SendTransaction();
              transactionEntitie.from = userInfoData.wallet;
              transactionEntitie.to = global.ctx.args[2];
              transactionEntitie.gasPrice = await HELIOS.toWei(String(await HELIOS.getGasPrice()));
              transactionEntitie.gas = envConfig.GAS;
              transactionEntitie.value = await HELIOS.toWeiEther((String(amount)));
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
                await TRANSACTIONQUEUECONTROLLER.create( tx, msg, false, false);
                MESSAGEUTIL.reaction_transaction_queue( msg );
                return;
              }
              const sendTx = await TRANSACTIONCONTROLLER.sendTransaction( tx, userInfoData.keystore_wallet);
              if ( !sendTx.length ) {
                global.clientRedis.set( 'tip:'+msg.author.id, msg.author.id );
                global.clientRedis.expire('tip:'+msg.author.id, 11);
                msg.author.send( msgs.error_withdraw + envConfig.ALIASCOMMAND + 'withdraw 100 0x00000' );
                logger.error( error );
              } else {
                msg.author.send(MESSAGEUTIL.msg_embed('Withdraw process', msgs.withdraw_success));
              }
            };
          }
        } else {
          msg.author.send( msgs.error_withdraw + envConfig.ALIASCOMMAND + 'withdraw 100 0x00000' );
          MESSAGEUTIL.reaction_fail( msg );
          logger.error( error );
        }
      } else {
        msg.delete( msg );
        msg.author.send( msgs.direct_message + ' (`withdraw`)' );
      }
    } catch (error) {
      msg.author.send( msgs.error_withdraw + envConfig.ALIASCOMMAND + 'withdraw 100 0x00000');
      MESSAGEUTIL.reaction_fail( msg );
      logger.error( error );
    }
  }
}
module.exports = Account;
