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
  static isDmChannel( channelType ) {
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
  async arrayTransaction( msg, user_tip_id_list, userInfoSend, amount, isTip, isRain, isTipAuthor = false ) {
    let txs = [];
    if ( !isTipAuthor ) {
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
    } else {
      const transactionEntitie = new SendTransaction();
      transactionEntitie.from = userInfoSend.wallet;
      transactionEntitie.to = envConfig.DEV_WALLET;
      transactionEntitie.keystore_wallet = userInfoSend.keystore_wallet;
      transactionEntitie.user_discord_id_send = userInfoSend.user_discord_id;
      transactionEntitie.user_id_send = userInfoSend.id;
      transactionEntitie.gasPrice = await HELIOS.toWei(String(await HELIOS.getGasPrice()));
      transactionEntitie.gas = envConfig.GAS;
      transactionEntitie.value = await HELIOS.toWeiEther((String(amount)));
      transactionEntitie.user_discord_id_receive = null;
      transactionEntitie.user_id_receive = null;
      transactionEntitie.helios_amount = amount;
      transactionEntitie.isTipAuthor = true;
      txs.push( transactionEntitie );
    }
    let isQueue;
    isQueue = await this.isQueue( txs, msg, isTipAuthor );
    if ( isQueue ) {
      if ( isTip ) {
        if ( isTipAuthor ) {
          await TRANSACTIONQUEUECONTROLLER.create( txs, msg, true, false, true);
        } else {
          await TRANSACTIONQUEUECONTROLLER.create( txs, msg, true, false);
        }
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
  async isQueue( txs, msg, isTipAuthor ) {
    let isQueue = false;
    let getReceive;
    let getTip;
    let getReceiveSend;
    let getTipSend;
    let getTipAuthor;
    getTipSend = await new Promise( ( resolve, reject ) => {
      return global.clientRedis.get('tip:'+msg.author.id, function(err, tip) {
        resolve(tip);
      });
    });
    if ( !getTipSend ) {
      global.clientRedis.set( 'tip:'+msg.author.id, msg.author.id );
      global.clientRedis.expire('tip:'+msg.author.id, 11);
    }

    getTipAuthor = await new Promise( ( resolve, reject ) => {
      return global.clientRedis.get('tip:'+envConfig.DEV_WALLET, function(err, tip) {
        resolve(tip);
      });
    });

    if ( !getTipAuthor ) {
      global.clientRedis.set( 'tip:'+envConfig.DEV_WALLET, envConfig.DEV_WALLET );
      global.clientRedis.expire('tip:'+envConfig.DEV_WALLET, 11);
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
   * @param {any} isTipFaucet=false
   * @return {any}
   */
  async receiveTx( transaction, msg, amount, isQueue = false, transactionQueue, isRain = false, isTipFaucet = false ) {
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
          if( !isTipFaucet ) {
            this.sendMsgReceive( isQueue, isRain, isWalletBot, msg, amount, transactionQueue, receiveTx, receive);
          } else {
            const fetchUser = await global.client.fetchUser( receive.user_discord_id_receive, false );
            let exampleEmbed = new Discord.RichEmbed()
              .setColor('#e6d46a')
              .setTitle('Vote Succeeded')
              .setDescription(`You have received ${receive.helios_amount.toLocaleString(undefined,{ minimumFractionDigits: 5 })} HLS <:CoinHelios:768201645884178492> as a thank you! \n [View Transaction](https://heliosprotocol.io/block-explorer/#main_page-transaction&${receiveTransaction.hash})`)
            await fetchUser.send(exampleEmbed);
          }
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
                  `You were tipped ${amount} from ${msg.author}`, true, `https://heliosprotocol.io/block-explorer/#main_page-transaction&${receiveTx[0].hash}`) );
            }
            if (msg.mentions.users.has(msg.client.user.id) && msg.mentions.users.array().length === 1) {
              logger.info('init deposit roulette');
              await RouletteController.deposit(msg.author.id, amount);
            }
          } else {
            await fetchUser.send(MESSAGEUTIL.msg_embed('Rain receive',
                `You were rained ${amount} from ${msg.author}`, true, `https://heliosprotocol.io/block-explorer/#main_page-transaction&${receiveTx[0].hash}`) );
          }
        } else {
          const fetchUser = await global.client.fetchUser( receive.user_discord_id_receive, false );
          const title = ( transactionQueue.isTip ? 'Tip receive': 'Rain receive');
          const titleDescription = ( transactionQueue.isTip ? `tipped ${receive.helios_amount} from ${msg.author}`: ` rained ${receive.helios_amount} from ${msg.author}`);
          if (receive.user_discord_id_receive !== msg.client.user.id) {
            await fetchUser.send(MESSAGEUTIL.msg_embed(title,
                'You were ' + titleDescription , true, `https://heliosprotocol.io/block-explorer/#main_page-transaction&${receiveTx[0].hash}`) );
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
              'The '+ global.client.user.username + ' Bot sent you `' + await HELIOS.getAmountFloat(receiveTransaction.value) +'`', true, `https://heliosprotocol.io/block-explorer/#main_page-transaction&${receiveTx[0].hash}`) );
        } else {
          await fetchUser.send(MESSAGEUTIL.msg_embed('Transaction receive',
              'The wallet '+ receiveTransaction.from + ' send you `' + await HELIOS.getAmountFloat(receiveTransaction.value) +'`', true, `https://heliosprotocol.io/block-explorer/#main_page-transaction&${receiveTx[0].hash}`) );
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

    /**
   * min Max Validator
   * @date 2020-09-01
   * @param {any} amount
   * @param {any} msg
   * @return {any}
   */
  static minMaxValidator( amount, msg ) {
    if ( amount < envConfig.MINTIP ) {
      msg.author.send( msgs.min_tip + '`(' + `${envConfig.MINTIP }` +' <:HLS:734894854974210182>)`');
      MESSAGEUTIL.reaction_fail( msg );
      return true;
    }
    if ( amount > envConfig.MAXTIP ) {
      msg.author.send( msgs.max_tip + '`(' + `${envConfig.MAXTIP }` +' <:HLS:734894854974210182>)`');
      MESSAGEUTIL.reaction_fail( msg );
      return true;
    }
    return false;
  }

  /**
   * maintenance
   * @date 2020-09-09
   * @param {any} message
   * @return {any}
   */
  static async maintenance(message) {
    global.clientRedis.get('maintenance', async (err, redisData) => {
      if (redisData == null) {
        global.clientRedis.set('maintenance', true);
        MESSAGEUTIL.maintenanceInit( message );
      } else {
        global.clientRedis.del('maintenance');
        MESSAGEUTIL.maintenanceFinish( message );
      }
    });
  }

  /**
   * rolesValidator
   * @date 2020-09-09
   * @param {any} msg
   * @param {any} rolesString
   * @return {any}
   */
  static rolesValidator( msg, rolesString ) {
    const msgRoleIds= msg.member.roles.array().map((x) => x.id);
    const rolesIds= JSON.parse(rolesString);
    if (!msgRoleIds.some((x)=> rolesIds.includes(x))) {
      return true;
    }
    return false;
  }
}

module.exports = Util;
