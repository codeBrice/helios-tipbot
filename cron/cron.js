const cron = require('cron');
const UserInfo = require('../controllers/userinfo.controller');
const USERINFO = new UserInfo();
const TransactionController = require('../controllers/transactions.controller');
const TRANSACTIONCONTROLLER = new TransactionController();
const MessageUtil = require('../util/Discord/message');
const MESSAGEUTIL = new MessageUtil();
const Helios = require('../middleware/helios');
const HELIOS = new Helios();
const conf = require('../config.js').jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const TransactionQueueController = require('../controllers/transaction.queue.controller');
const TRANSACTIONQUEUECONTROLLER = new TransactionQueueController();
const msgs = require('../util/msg.json');
const Util = require('../util/util');
const UTIL = new Util();
const RouletteHistoricController = require('../controllers/roulette.historic.controller');
const SendTransaction = require('../entities/SendTransactions');
const envConfig = process.env;

exports.fnRunCrons = function() {
  const cronReceive = cron.job('22 */5 * * * *', async function() {
    logger.info('Start receive tx with external cron');
    const users = await USERINFO.findAllUser();
    if ( users.length ) {
      for ( const user of users ) {
        const getReceive = await new Promise( ( resolve, reject ) => {
          return global.clientRedis.get('receive:'+user.user_discord_id, async function(err, receive) {
            resolve(receive);
          });
        });
        const getTip = await new Promise( ( resolve, reject ) => {
          return global.clientRedis.get('tip:'+user.user_discord_id, async function(err, tip) {
            resolve(tip);
          });
        });
        if ( getReceive || getTip) {
          return;
        }
        const receiveTx = await TRANSACTIONCONTROLLER.receiveTransaction({to: user.wallet}, user.keystore_wallet, false, user.id, user.id );
        if ( receiveTx.length ) {
          for ( const receive of receiveTx ) {
            const fetchUser = await global.client.fetchUser( user.user_discord_id, false );
            const botData = await USERINFO.getUser( global.client.user.id );
            if (receive.from === botData.wallet) {
              await fetchUser.send(MESSAGEUTIL.msg_embed('Roulette transaction recieved',
                  'The '+ global.client.user.username + ' Bot sent you `' + await HELIOS.getAmountFloat(receive.value) +' <:HLS:734894854974210182>`', true, `https://heliosprotocol.io/block-explorer/#main_page-transaction&${receive.hash}`) );
            } else {
              await fetchUser.send(MESSAGEUTIL.msg_embed('Transaction receive',
                  'The wallet '+ receive.from + ' send you `' + await HELIOS.getAmountFloat(receive.value) +' <:HLS:734894854974210182>`', true, `https://heliosprotocol.io/block-explorer/#main_page-transaction&${receive.hash}`) );
            }
          }
        }
      }
    }
  });
  cronReceive.start();

  const cronTransactionQueue = cron.job('0/4 * * * * *', async function() {
    let transactionQueue;
    try {
      logger.info('Start transaction queue');
      const getQueue = await TRANSACTIONQUEUECONTROLLER.findAll();
      for ( const queue of getQueue ) {
        transactionQueue = queue;
        const transactions = JSON.parse(transactionQueue.transactions);
        let msg;
        let chainTime = false;
        for ( const transaction of transactions ) {
          const getReceiveUserSend = await new Promise( ( resolve, reject ) => {
            return global.clientRedis.get('receive:'+transaction.user_discord_id_send, async function(err, receive) {
              resolve(receive);
            });
          });
          const getTipUserSend = await new Promise( ( resolve, reject ) => {
            return global.clientRedis.get('tip:'+transaction.user_discord_id_send, async function(err, tip) {
              resolve(tip);
            });
          });
          const getReceiveUserReceive = await new Promise( ( resolve, reject ) => {
            return global.clientRedis.get('receive:'+transaction.user_discord_id_receive, async function(err, receive) {
              resolve(receive);
            });
          });
          const getTipUserReceive = await new Promise( ( resolve, reject ) => {
            return global.clientRedis.get('tip:'+transaction.user_discord_id_receive, async function(err, tip) {
              resolve(tip);
            });
          });
          
          const getTipAuthor = await new Promise( ( resolve, reject ) => {
            return global.clientRedis.get('tip:'+envConfig.DEV_WALLET, async function(err, tip) {
              resolve(tip);
            });
          });

          const msg_discord = JSON.parse(transactionQueue.msg_discord);
          msg = await new Promise( ( resolve, reject ) => {
            return client.channels.get(msg_discord.channel_id).fetchMessage(msg_discord.message_id).then((msg) => {
              resolve( msg );
            });
          });
          if ( getReceiveUserSend || getTipUserSend || getReceiveUserReceive ||getTipUserReceive || getTipAuthor ) {
            chainTime = true;
            break;
          }
        }
        if ( !chainTime ) {
          console.log(chainTime);
          transactionQueue.isProcessed = true;
          transactionQueue.attemps += 1;
          await TRANSACTIONQUEUECONTROLLER.update( transactionQueue.dataValues );
          const transaction = await TRANSACTIONCONTROLLER.sendTransaction( transactions, transactions[0].keystore_wallet);
            if ( transaction.length > 0 ) {
              if ( transactionQueue.isTipAuthor ) {
                await global.clientRedis.set( 'tip:'+envConfig.DEV_WALLET, envConfig.DEV_WALLET);
                await global.clientRedis.expire('tip:'+envConfig.DEV_WALLET, 11);
              }
              if ( !transactionQueue.isRain && !transactionQueue.isTip ) {
                await TRANSACTIONQUEUECONTROLLER.update( transactionQueue.dataValues );
                msg.author.send(MESSAGEUTIL.msg_embed('Withdraw process', msgs.withdraw_success));
                MESSAGEUTIL.reaction_complete_tip( msg );
                return;
              }
              await msg.clearReactions();
              if ( transactionQueue.isRain ) {
                MESSAGEUTIL.reaction_complete_rain( msg );
              } else {
                MESSAGEUTIL.reaction_complete_tip( msg );
              }
              if ( !transactionQueue.isTipAuthor ) {
                await UTIL.receiveTx( transaction, msg, null, true, transactionQueue );
              } else {
                transactionQueue.isProcessed = true;
                transactionQueue.attemps += 1;
                await TRANSACTIONQUEUECONTROLLER.update( transactionQueue.dataValues );
              }
            } else {
              transactionQueue.attemps += 1;
              if ( transactionQueue.attemps >= 10 ) {
                transactionQueue.isProcessed = true;
                transactionQueue.isProcessedFailed = true;
                await msg.clearReactions();
                MESSAGEUTIL.reaction_fail( msg );
              } else {
                transactionQueue.isProcessed = false;
              }
              await TRANSACTIONQUEUECONTROLLER.update( transactionQueue.dataValues );
              logger.error( error );
              return;
            }
        }
      }
    } catch (error) {
      if ( error.code != 50007 ) {
        transactionQueue.isProcessed = true;
        transactionQueue.isProcessedFailed = true;
        transactionQueue.attemps += 1;
        await TRANSACTIONQUEUECONTROLLER.update( transactionQueue.dataValues );
        await msg.clearReactions();
        await MESSAGEUTIL.reaction_fail( msg );
        msg.author.send( msgs.queue_error );
        logger.error( error );
      }
    }
  });
  cronTransactionQueue.start();

  const cronCommission = cron.job('0 0 * * *', async function() {
    const charges = await RouletteHistoricController.getCommissions();
    if (charges.length > 0) {
      let commision = 0;
      for (const charge of charges) {
        const bets = JSON.parse(charge.bets);
        for (const bet of bets) {
          commision += (2 * bet.amount / 100);
        }
      }
      if (commision > 1) {
        const fromBot = await USERINFO.getUser( global.client.user.id );
        const tx = [];
        const transactionEntitie = new SendTransaction();
        transactionEntitie.from = fromBot.wallet;
        transactionEntitie.to = envConfig.COMMISSION;
        transactionEntitie.gasPrice = await HELIOS.toWei(String(await HELIOS.getGasPrice()));
        transactionEntitie.gas = envConfig.GAS;
        transactionEntitie.value = await HELIOS.toWeiEther((String(commision)));
        transactionEntitie.keystore_wallet = fromBot.keystore_wallet;
        tx.push( transactionEntitie );

        const sendTx = await TRANSACTIONCONTROLLER.sendTransaction( tx, fromBot.keystore_wallet);
        if ( sendTx.length > 0 ) {
          await RouletteHistoricController.updateCommissions(charges.map(((x) => x.id)));
        }
      }
    }
  });

  cronCommission.start();
};
