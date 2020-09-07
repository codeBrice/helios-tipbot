const Helios = require('../middleware/helios');
const SendTransaction = require('../entities/SendTransactions');
const HELIOS = new Helios();
const MessageUtil = require('../util/Discord/message');
const MESSAGEUTIL = new MessageUtil();
const UserInfoController = require('../controllers/userinfo.controller');
const USERINFO = new UserInfoController();
const RouletteController = require('../controllers/roulette.controller');
require('dotenv').config();
const envConfig = process.env;
const TransactionQueueController = require('../controllers/transaction.queue.controller');
const TRANSACTIONQUEUECONTROLLER = new TransactionQueueController();
const Transaction = require('../controllers/transactions.controller');
const TRANSACTION = new Transaction();
const conf = require('../config.js').jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const msgs = require('../util/msg.json');
const RouletteHistoricController = require('../controllers/roulette.historic.controller');
const Discord = require('discord.js');

/**
 * Bot Utils
 * @date 2020-08-28
 */
class Util {
  /**
   * Is Dm Channel
   * @date 2020-08-28
   * @param {string} channelType
   * @return {boolean}
   */
  isDmChannel( channelType ) {
    if ( channelType == 'dm' ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Parse Float
   * @date 2020-08-28
   * @param {string} amount
   * @return {number}
   */
  static parseFloat( amount ) {
    return parseFloat(amount);
  }

  /**
   * Array Transaction
   * @date 2020-08-28
   * @param {Message} msg
   * @param {any} user_tip_id_list
   * @param {any} userInfoSend
   * @param {number} amount
   * @param {boolean} isTip
   * @param {boolean} isRain
   * @return {SendTransaction[]}
   */
  async arrayTransaction( msg, user_tip_id_list, userInfoSend, amount, isTip, isRain ) {
    let txs = [];
    for ( let i = 0; i < user_tip_id_list.length; i++ ) {
      const transactionEntitie = new SendTransaction();
      let getUserReceive = await USERINFO.getUser( user_tip_id_list[i].user_discord_id );
      if ( !getUserReceive ) {
        await USERINFO.generateUserWallet( user_tip_id_list[i].user_discord_id );
        getUserReceive = await USERINFO.getUser( user_tip_id_list[i].user_discord_id );
      }

      transactionEntitie.from = userInfoSend.wallet;
      transactionEntitie.to = getUserReceive.wallet;
      transactionEntitie.keystore_wallet = userInfoSend.keystore_wallet;
      transactionEntitie.user_discord_id_send = userInfoSend.user_discord_id;
      transactionEntitie.user_id_send = userInfoSend.id;
      transactionEntitie.gasPrice = await HELIOS.toWei(String(await HELIOS.getGasPrice()));
      transactionEntitie.gas = envConfig.GAS;
      transactionEntitie.value = await HELIOS.toWeiEther((String(amount)));
      transactionEntitie.user_discord_id_receive = getUserReceive.user_discord_id;
      transactionEntitie.user_id_receive = getUserReceive.id;
      transactionEntitie.helios_amount = amount;
      txs.push( transactionEntitie );
    }
    let isQueue;
    isQueue = await this.isQueue( txs, msg );
    if ( isQueue ) {
      if ( isTip ) {
        await TRANSACTIONQUEUECONTROLLER.create( txs, msg, true, false);
      }
      if ( isRain ) {
        await TRANSACTIONQUEUECONTROLLER.create( txs, msg, false, true);
      }

      await MESSAGEUTIL.reaction_transaction_queue( msg );
      return txs = [];
    }
    return txs;
  }

  /**
   * Is Queue
   * @date 2020-08-28
   * @param {SendTransaction[]} txs
   * @param {Message} msg
   * @return {boolean}
   */
  async isQueue( txs, msg ) {
    let isQueue = false;
    let getReceive;
    let getTip;
    let getReceiveSend;
    let getTipSend;
    getTipSend = await new Promise( ( resolve, reject ) => {
      return global.clientRedis.get('tip:'+msg.author.id, function(err, tip) {
        resolve(tip);
      });
    });
    if ( !getTipSend ) {
      global.clientRedis.set( 'tip:'+msg.author.id, msg.author.id );
      global.clientRedis.expire('tip:'+msg.author.id, 11);
    }

    getReceiveSend = await new Promise( ( resolve, reject ) => {
      return global.clientRedis.get('receive:'+msg.author.id, function(err, receive) {
        resolve(receive);
      });
    });
    if ( getTipSend || getReceiveSend ) {
      isQueue = true;
    } else {
      for (let i = 0; i < txs.length; i++ ) {
        if ( !isQueue ) {
          getReceive = await new Promise( ( resolve, reject ) => {
            return global.clientRedis.get('receive:'+txs[i].user_discord_id_receive, function(err, receive) {
              resolve(receive);
            });
          });
          getTip = await new Promise( ( resolve, reject ) => {
            return global.clientRedis.get('tip:'+txs[i].user_discord_id_receive, function(err, tip) {
              resolve(tip);
            });
          });
          if ( getReceive || getTip ) {
            isQueue = true;
          }
        } else {
          break;
        }
      }
    }
    return isQueue;
  }

  /**
   * receiveTx
   * @date 2020-09-01
   * @param {any} transaction
   * @param {any} msg
   * @param {any} amount
   * @param {any} isQueue=false
   * @param {any} transactionQueue
   * @param {any} isRain=false
   * @return {any}
   */
  async receiveTx( transaction, msg, amount, isQueue = false, transactionQueue, isRain = false) {
    for ( const receive of transaction ) {
      if ( isQueue ) {
        await global.clientRedis.set( 'tip:'+receive.user_discord_id_send, receive.user_discord_id_send );
        await global.clientRedis.expire('tip:'+receive.user_discord_id_send, 11);
      }
      const userInfoReceive = await USERINFO.getUser( receive.user_discord_id_receive );
      const receiveTx = await TRANSACTION.receiveTransaction( receive, userInfoReceive.keystore_wallet, true, receive.user_id_send, receive.user_id_receive);
      if ( receiveTx.length > 0 ) {
        for ( const receiveTransaction of receiveTx ) {
          const isWalletBot = await USERINFO.findByWallet( receiveTransaction.from );
          this.sendMsgReceive( isQueue, isRain, isWalletBot, msg, amount, transactionQueue, receiveTx, receive);
        }
      }
    }
  }

  /**
   * sendMsgReceive
   * @date 2020-09-01
   * @param {any} isQueue
   * @param {any} isRain
   * @param {any} isWalletBot
   * @param {any} msg
   * @param {any} amount
   * @param {any} transactionQueue
   * @param {any} receiveTx
   * @param {any} receive
   * @return {any}
   */
  async sendMsgReceive( isQueue, isRain, isWalletBot, msg, amount, transactionQueue, receiveTx, receive) {
    try {
      const fetchUser = await global.client.fetchUser( receive.user_discord_id_receive, false );
      if ( isWalletBot ) {
        logger.info('init sendMsgReceive isQueue:'+isQueue+' isRain:'+isRain);
        if ( !isQueue ) {
          if ( !isRain ) {
            if (receive.user_discord_id_receive !== msg.client.user.id) {
              await fetchUser.send(MESSAGEUTIL.msg_embed('Tip receive',
                  'The user'+ msg.author + ' tip you `' + amount +' HLS`', true, `https://heliosprotocol.io/block-explorer/#main_page-transaction&${receiveTx[0].hash}`) );
            }
            if (msg.mentions.users.has(msg.client.user.id) && msg.mentions.users.array().length === 1) {
              logger.info('init deposit roulette');
              await RouletteController.deposit(msg.author.id, amount);
            }
          } else {
            await fetchUser.send(MESSAGEUTIL.msg_embed('Rain receive',
                'The user'+ msg.author + ' rain you `' + amount +' HLS`', true, `https://heliosprotocol.io/block-explorer/#main_page-transaction&${receiveTx[0].hash}`) );
          }
        } else {
          transactionQueue.isProcessed = true;
          transactionQueue.attemps += 1;
          await TRANSACTIONQUEUECONTROLLER.update( transactionQueue.dataValues );
          const fetchUser = await global.client.fetchUser( receive.user_discord_id_receive, false );
          const title = ( transactionQueue.isTip ? 'Tip receive': 'Rain receive');
          const titleDescription = ( transactionQueue.isTip ? ' tip you': ' rain you');
          if (receive.user_discord_id_receive !== msg.client.user.id) {
            await fetchUser.send(MESSAGEUTIL.msg_embed(title,
                'The user'+ msg.author + titleDescription +' `' + receive.helios_amount +' HLS`', true, `https://heliosprotocol.io/block-explorer/#main_page-transaction&${receiveTx[0].hash}`) );
          }
          if (msg.mentions.users.has(msg.client.user.id) && msg.mentions.users.array().length === 1) {
            logger.info('init deposit roulette');
            await RouletteController.deposit(msg.author.id, receive.helios_amount);
          }
        }
      } else {
        const botData = await USERINFO.getUser( global.client.user.id );
        if (receiveTransaction.from === botData.wallet) {
          await fetchUser.send(MESSAGEUTIL.msg_embed('Roulette transaction recieved',
              'The '+ global.client.user.username + ' Bot sent you `' + await HELIOS.getAmountFloat(receiveTransaction.value) +' HLS`', true, `https://heliosprotocol.io/block-explorer/#main_page-transaction&${receiveTx[0].hash}`) );
        } else {
          await fetchUser.send(MESSAGEUTIL.msg_embed('Transaction receive',
              'The wallet '+ receiveTransaction.from + ' send you `' + await HELIOS.getAmountFloat(receiveTransaction.value) +' HLS`', true, `https://heliosprotocol.io/block-explorer/#main_page-transaction&${receiveTx[0].hash}`) );
        }
      }
    } catch (error) {
      if ( error.code != 50007 ) {
        logger.error( error );
      }
    }
  }

  /**
     * Amount Validator
     * @date 2020-08-28
     * @param {number} amount
     * @param {Message} message
     * @return {boolean}
     * @param {string} text
     */
  static amountValidator( amount, message, text ) {
    if ( typeof amount != 'number' || isNaN(amount)) {
      message.author.send(text);
      MESSAGEUTIL.reaction_fail( message );
      return true;
    }
  }

  /**
 * roulette Balance Validator
 * @date 2020-08-28
 * @param {number} amount
 * @param {Message} message
 * @param {string} text
 * @return {boolean}
 */
  static async rouletteBalanceValidator( amount, message, text ) {
    logger.info('start rouletteBalanceValidator');
    let user = await USERINFO.getUser( message.author.id );
    if ( !user ) {
      user = await USERINFO.generateUserWallet( message.author.id );
      message.author.send(text);
      MESSAGEUTIL.reaction_fail( message );
      return true;
    }
    const userBalance = await RouletteController.getBalance(user.id);
    if ( amount > userBalance ) {
      message.author.send(text);
      MESSAGEUTIL.reaction_fail( message );
      return true;
    }
  }

  /**
 * bot Balance Validator
 * @date 2020-08-28
 * @param {number} amount
 * @param {Message} message
 * @param {string} text
 * @return {boolean}
 */
  static async botBalanceValidator( amount, message, text ) {
    logger.info('start botBalanceValidator');
    const botBalance = await USERINFO.getBalance( message.client.user.id );
    if ( !botBalance ) {
      await USERINFO.generateUserWallet( message.client.user.id );
    }
    if ( amount >= this.parseFloat(botBalance) ) {
      message.author.send(text);
      MESSAGEUTIL.reaction_fail( message );
      return true;
    }
  }

  /**
   * min Max Validator
   * @date 2020-09-01
   * @param {any} amount
   * @param {any} msg
   * @return {any}
   */
  static minMaxValidatorRoulette( amount, msg ) {
    if ( amount < envConfig.MINTIP_BET ) {
      msg.author.send( msgs.min_tip_roulette + '`(' + `${envConfig.MINTIP_BET }` +' HLS)`');
      MESSAGEUTIL.reaction_fail( msg );
      return true;
    }
    if ( amount > envConfig.MAXTIP_BET ) {
      msg.author.send( msgs.max_tip_roulette + '`(' + `${envConfig.MAXTIP_BET }` +' HLS)`');
      MESSAGEUTIL.reaction_fail( msg );
      return true;
    }
    return false;
  }

  /**
   * channel Validator
   * @date 2020-09-02
   * @param {any} msg
   * @param {any} channels
   * @return {any}
   */
  static channelValidator( msg, channels ) {
    logger.info('Channel validator channels:'+
      channels.toString()+' channel id:'+msg.channel.id);
    if (!channels.includes(msg.channel.id)) {
      return true;
    }
    return false;
  }

  /**
   * bankroll Validator
   * @date 2020-09-06
   * @param {any} bets
   * @param {any} message
   * @param {any} win
   * @param {any} text
   * @return {any}
   */
  static async bankrollValidator( bets, message, win, text ) {
    logger.info('start bankroll Validator');
    const botBalance = await USERINFO.getBalance( message.client.user.id );

    if ( !botBalance ) {
      await USERINFO.generateUserWallet( message.client.user.id );
      message.channel.send(text);
      return true;
    }

    let sum = 0;
    for (const bet of bets) {
      if (bet.command === win) {
        sum += this.winnerAmount(bet.command, bet.amount) - bet.amount;
      }
    }

    const total = await RouletteController.getAllBalance();

    if (this.parseFloat(botBalance) - total - sum < 0) {
      message.channel.send(text);
      return true;
    }
    return false;
  }

  /**
   * winnerAmount
   * @date 2020-09-07
   * @param {any} command
   * @param {any} amount
   * @return {any}
   */
  static winnerAmount(command, amount) {
    return (command !== 'sg') ? amount*2 : amount*14;
  }

  /**
  * lastWins
  * @date 2020-09-07
  * @param {any} message
  * @return {any}
  */
  static async lastWins(message) {
    const list = await RouletteHistoricController.getLastWins();
    const msg = list.map((currentValue, index, array) => {
      return this.color(this.parseFloat(currentValue.winNumber),
          (index+1)+'. 🟩\n',
          (index+1)+'. 🟥\n',
          (index+1)+'. ⬛\n');
    });
    const title = 'Last 10 roll result';
    const embed = Util.embedConstructor(title, msg);
    await message.channel.send(embed);
  }

  /**
   * 描述
   * @date 2020-09-07
   * @param {any} message
   * @param {any} text
   * @return {any}
   */
  static async bankroll(message) {
    logger.info('start bankroll');

    const channels = JSON.parse(envConfig.ONLY_CHANNELS_ROULETTE);
    if (this.channelValidator(message, channels)) return;

    const botBalance = await USERINFO.getBalance( message.client.user.id );
    if ( !botBalance ) {
      await USERINFO.generateUserWallet( message.client.user.id );
      return true;
    }

    const total = await RouletteController.getAllBalance();

    const title = 'BankRoll:';
    const embed = this.embedConstructor(title, (this.parseFloat(botBalance) - total)+' HLS');
    await message.channel.send(embed);
  }

  /**
 * create a Discord Rich Embed
 * @date 2020-08-27
 * @param {string} title
 * @param {string} msg
 * @return {RichEmbed}
 */
  static embedConstructor(title, msg) {
    return new Discord.RichEmbed()
        .setColor(9955331)
        .setTitle(title)
        .setDescription(msg);
  }


  /**
 * Color logic
 * @date 2020-08-27
 * @param {number} number
 * @param {any} g
 * @param {any} r
 * @param {any} b
 * @return {any}
 */
  static color(number, g, r, b) {
    return (number === 0) ? g : (number % 2 === 0) ? r : b;
  }

  /**
  * wait
  * @date 2020-09-03
  * @param {any} ms
  * @return {any}
  */
  static async wait(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}

module.exports = Util;
