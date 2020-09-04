var cron = require('cron');
const UserInfo = require('../controllers/userinfo.controller');
const USERINFO = new UserInfo();
const TransactionController = require('../controllers/transactions.controller');
const TRANSACTIONCONTROLLER = new TransactionController();
const MessageUtil = require('../util/Discord/message');
const MESSAGEUTIL = new MessageUtil();
const Helios = require('../middleware/helios');
const HELIOS = new Helios();
const conf = require("../config.js").jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const TransactionQueueController = require('../controllers/transaction.queue.controller');
const TRANSACTIONQUEUECONTROLLER = new TransactionQueueController();
const msgs = require('../util/msg.json');
const Util = require('../util/util');
const UTIL = new Util();

exports.fnRunCrons = function () {
    let cronReceive = cron.job("22 */5 * * * *", async function(){
        logger.info('Start receive tx with external cron');
        const users = await USERINFO.findAllUser();
        if ( users.length ) {
            for( let user of users ) {
                let getReceive = await new Promise( ( resolve, reject ) => {
                    return global.clientRedis.get('receive:'+user.user_discord_id, async function(err, receive) { 
                        resolve(receive) ;
                    });
                });
                let getTip = await new Promise( ( resolve, reject ) => {
                    return global.clientRedis.get('tip:'+user.user_discord_id, async function(err, tip) { 
                        resolve(tip) ;
                    });
                });
                if ( getReceive || getTip) {
                    return;
                }
                const receiveTx = await TRANSACTIONCONTROLLER.receiveTransaction({to: user.wallet }, user.keystore_wallet, false, user.id, user.id );
                if( receiveTx.length ) {
                    for( let receive of receiveTx ) {
                        let fetchUser = await global.client.fetchUser( user.user_discord_id , false );
                        const botData = await USERINFO.getUser( global.client.user.id );
                        if (receive.from === botData.wallet) {
                            await fetchUser.send(MESSAGEUTIL.msg_embed('Transaction roulette receive',
                                'The Bot '+ global.client.user.username + ' send you `' + await HELIOS.getAmountFloat(receive.value)  +' HLS`', true, `https://heliosprotocol.io/block-explorer/#main_page-transaction&${receive.hash}`) ); 
                        } else {
                            await fetchUser.send(MESSAGEUTIL.msg_embed('Transaction receive',
                                'The wallet '+ receive.from + ' send you `' + await HELIOS.getAmountFloat(receive.value)  +' HLS`', true, `https://heliosprotocol.io/block-explorer/#main_page-transaction&${receive.hash}`) ); 
                        }
                    }
                }
            }
        }
    }); 
    cronReceive.start();

    let cronTransactionQueue = cron.job("0/2 * * * * *", async function() {
        try {
            logger.info('Start transaction queue');
            const getQueue = await TRANSACTIONQUEUECONTROLLER.findAll();
            for ( let queue of getQueue ) {
                let transactionQueue = queue;
                let transactions = JSON.parse(transactionQueue.transactions);
                let msg;
                let chainTime = false ;
                for( let transaction of transactions ) {
                    let getReceiveUserSend = await new Promise( ( resolve, reject ) => {
                        return global.clientRedis.get('receive:'+transaction.user_discord_id_send, async function(err, receive) { 
                            resolve(receive) ;
                        });
                    });
                    let getTipUserSend = await new Promise( ( resolve, reject ) => {
                        return global.clientRedis.get('tip:'+transaction.user_discord_id_send, async function(err, tip) { 
                            resolve(tip) ;
                        });
                    });
                    let getReceiveUserReceive = await new Promise( ( resolve, reject ) => {
                        return global.clientRedis.get('receive:'+transaction.user_discord_id_receive, async function(err, receive) { 
                            resolve(receive) ;
                        });
                    });
                    let getTipUserReceive = await new Promise( ( resolve, reject ) => {
                        return global.clientRedis.get('tip:'+transaction.user_discord_id_receive, async function(err, tip) { 
                            resolve(tip) ;
                        });
                    });
                    let msg_discord = JSON.parse(transactionQueue.msg_discord);
                    msg = await new Promise( ( resolve, reject ) => {
                        return client.channels.get(msg_discord.channel_id).fetchMessage(msg_discord.message_id).then(msg => { 
                            resolve( msg );
                         });
                    });
                    if ( getReceiveUserSend || getTipUserSend || getReceiveUserReceive ||getTipUserReceive ) {
                        chainTime = true;
                        break;
                    }
                }
                if ( !chainTime ) {
                    const transaction = await TRANSACTIONCONTROLLER.sendTransaction( transactions , transactions[0].keystore_wallet);
                    if ( transaction.length > 0 ) {
                        if ( !transactionQueue.isRain && !transactionQueue.isTip ) {
                            transactionQueue.isProcessed = true;
                            transactionQueue.attemps += 1;
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
                        await UTIL.receiveTx( transaction, msg, null, true, transactionQueue );
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
            if( error.code != 50007 ) {
                await msg.clearReactions();
                await MESSAGEUTIL.reaction_fail( msg );
                msg.author.send( msgs.queue_error );
                logger.error( error );
            }
        }
    });
    cronTransactionQueue.start();
}