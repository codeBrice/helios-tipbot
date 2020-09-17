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
const RouletteController = require('../controllers/roulette.controller');

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
  async getWallet( msg, isWfu = false, user_discord_id = null ) {
    try {
      const userInfoWallet = await userInfoController.getWallet( ( isWfu ? user_discord_id : msg.author.id ) );
      if ( userInfoWallet ) {
        if ( isWfu ) {
          const fetchUser = await global.client.fetchUser( user_discord_id, false );
          console.log(fetchUser);
          msg.channel.send( MESSAGEUTIL.msg_embed('Wallet for user info',
           'User: '+fetchUser+
           ' \n Wallet: `'+userInfoWallet+'`', false,
          'https://heliosprotocol.io/block-explorer/#main_page-address&'+userInfoWallet, true));
        } else {
          msg.author.send( MESSAGEUTIL.msg_embed('Wallet info', msgs.wallet +'`'+userInfoWallet+'`'));
        }
      } else {
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

  /**
   * getRouletteBalance
   * @date 2020-09-01
   * @param {any} msg
   * @return {any}
   */
  async getRouletteBalance( msg ) {
    try {
      logger.info('start getRouletteBalance');
      const user = await userInfoController.getUser( msg.author.id );
      if ( !user ) {
        await userInfoController.generateUserWallet( msg.author.id );
        msg.author.send( MESSAGEUTIL.msg_embed('Roulette Balance',
            msgs.balance + 0 + ' HLS') );
        return;
      }
      const userBalance = await RouletteController.getBalance(user.id);
      if ( userBalance != null ) {
        msg.author.send( MESSAGEUTIL.msg_embed('Roulette Balance',
            msgs.balance + userBalance + ' HLS') );
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
   * withdrawRoulette
   * @date 2020-09-01
   * @param {any} msg
   * @return {any}
   */
  async withdrawRoulette( msg ) {
    try {
      logger.info('start withdrawRoulette');
      if ( Util.isDmChannel(msg.channel.type) ) {
        const amount = Util.parseFloat( global.ctx.args[1] );
        // Amount Validate
        if (Util.amountValidator(amount, msg, msgs.invalid_command+
          ` example: ${global.client.config.PREFIX}rwithdraw 10`)) return;

        const amountGas = await userInfoController.getGasPriceSumAmount( amount );

        if (await Util.rouletteBalanceValidator(amountGas, msg,
            msgs.amount_gas_error +
            ', remember to have enough gas for the transaction.')) return;

        if (await Util.botBalanceValidator(amountGas, msg,
            msgs.bot_amount_gas_error)) return;

        const userTipIdList = [];
        const botData = await userInfoController.getUser( msg.client.user.id );
        userTipIdList.push( {user_discord_id: msg.author.id,
          tag: msg.author.username} );
        // transaction object
        const toUser = await userInfoController.getUser( msg.author.id );
        const tx = [];
        const transactionEntitie = new SendTransaction();
        transactionEntitie.from = botData.wallet;
        transactionEntitie.to = toUser.wallet;
        transactionEntitie.gasPrice = await HELIOS.toWei(String(await HELIOS.getGasPrice()));
        transactionEntitie.gas = envConfig.GAS;
        transactionEntitie.value = await HELIOS.toWeiEther((String(amount)));
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
          await TRANSACTIONQUEUECONTROLLER.create( tx, msg, false, false);
          MESSAGEUTIL.reaction_transaction_queue( msg );
          return;
        }
        const sendTx = await TRANSACTIONCONTROLLER.sendTransaction( tx, botData.keystore_wallet);
        if ( !sendTx.length ) {
          global.clientRedis.set( 'tip:'+msg.author.id, msg.author.id );
          global.clientRedis.expire('tip:'+msg.author.id, 11);
          msg.author.send( msgs.error_withdraw + envConfig.ALIASCOMMAND + 'withdraw 100 0x00000' );
          logger.error( error );
        } else {
          await RouletteController.updateBalance(msg.author.id, amountGas, false);
          msg.author.send(MESSAGEUTIL.msg_embed('Withdraw process', msgs.withdraw_success));
        }
      } else {
        msg.delete( msg );
        msg.author.send( msgs.direct_message + ' (`rwithdraw`)' );
      }
    } catch (error) {
      logger.error( error );
    }
  }
}
module.exports = Account;
