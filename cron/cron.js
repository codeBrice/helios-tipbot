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

exports.fnRunCrons = function () {
    let cronReceive = cron.job("22 */2 * * * *", function(){
        logger.info('Start receive tx with external cron');
        const users = new Promise( (resolve, reject ) => {
            resolve(USERINFO.findAllUser());
        });
        users.then( async users => {
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
                const receiveTx = await new Promise( ( resolve, reject ) => {
                    resolve( TRANSACTIONCONTROLLER.receiveTransaction({to: user.wallet }, user.keystore_wallet, false, user.id, user.id ) ); 
                });
    
                if( receiveTx.length ) {
                    for( let receive of receiveTx ) {
                        global.clientRedis.set( 'receive:'+user.user_discord_id, user.user_discord_id );
                        global.clientRedis.expire('receive:'+user.user_discord_id, 10);
                        global.client.fetchUser( user.user_discord_id , false ).then(async user => {
                            user.send(MESSAGEUTIL.msg_embed('Transaction receive',
                            'The wallet '+ receive.from + ' send you `' + await HELIOS.getAmountFloat(receive.value)  +' HLS`', true, `https://heliosprotocol.io/block-explorer/#main_page-transaction&${receive.hash}`) ); 
                        });
                    }
                }
            }
        }).catch( error => {
            logger.error( error );
        });
    }); 
    cronReceive.start();

    let cronTransactionQueue = cron.job("0/6 * * * * *", async function(){
        try {
            logger.info('Start transaction queue');
            const getQueue = await TRANSACTIONQUEUECONTROLLER.findAll();
            if( getQueue.length ) {
                let queue = 0;
                let transactionQueue = getQueue[0];
                let transactions = JSON.parse(transactionQueue.transactions);
                let msg;
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
                        queue += 1;
                    } else {
                        transactionQueue = getQueue[queue];
                        transactions = JSON.parse(transactionQueue.transactions);
                        break;
                    }
                }
                const transaction = new Promise( (resolve, reject) => {
                    const sendingTx = TRANSACTIONCONTROLLER.sendTransaction( transactions , transactions[0].keystore_wallet);
                    resolve( sendingTx );
                });
                transaction.then( async tx => {
                    if ( tx.length > 0 ) {
                        if ( !transactionQueue.isRain && !transactionQueue.isTip ) {
                            transactionQueue.isProcessed = true;
                            transactionQueue.attemps += 1;
                            await TRANSACTIONQUEUECONTROLLER.update( transactionQueue.dataValues );
                            msg.author.send(MESSAGEUTIL.msg_embed('Withdraw process', msgs.withdraw_success));
                            MESSAGEUTIL.reaction_complete_tip( msg );
                            return; 
                        }
                        for ( let receive of tx ) {
                            global.clientRedis.set( 'tip:'+receive.user_discord_id_send, receive.user_discord_id_send );
                            global.clientRedis.expire('tip:'+receive.user_discord_id_send, 10);
                            let userInfoReceive = await new Promise((resolve, reject) => {
                                const getUser = USERINFO.getUser( receive.user_discord_id_receive );
                                resolve( getUser );
                            });
                            let receiveTx = await TRANSACTIONCONTROLLER.receiveTransaction( receive, userInfoReceive.keystore_wallet, true , receive.user_id_send, receive.user_id_receive);
                            if ( receiveTx.length > 0  ) {
                                global.clientRedis.set( 'receive:'+receive.user_discord_id_receive, receive.user_discord_id_receive );
                                global.clientRedis.expire('receive:'+receive.user_discord_id_receive, 10);
                                transactionQueue.isProcessed = true;
                                transactionQueue.attemps += 1;
                                await TRANSACTIONQUEUECONTROLLER.update( transactionQueue.dataValues );
                                global.client.fetchUser( receive.user_discord_id_receive , false ).then(async user => {
                                    let title = ( transactionQueue.isTip ? 'Tip receive': 'Rain receive');
                                    let titleDescription = ( transactionQueue.isTip ? 'tip you': 'rain you');
                                    user.send(MESSAGEUTIL.msg_embed(title,
                                    'The user'+ msg.author + titleDescription +' `' + receive.helios_amount +' HLS`', true, `https://heliosprotocol.io/block-explorer/#main_page-transaction&${receiveTx[0].hash}`) );
                                    await msg.clearReactions();
                                    if ( transactionQueue.isTip )
                                        MESSAGEUTIL.reaction_complete_tip( msg );
                                    if ( transactionQueue.isRain )
                                        MESSAGEUTIL.reaction_complete_rain( msg );
                                });
                            }
                        }
                    } else {
                        transactionQueue.attemps += 1;
                        if ( transactionQueue.attemps >= 10 ) {
                            transactionQueue.isProcessed = true;
                            transactionQueue.isProcessedFailed = true;
                        } else {
                            transactionQueue.isProcessed = false;
                        }
                        await TRANSACTIONQUEUECONTROLLER.update( transactionQueue.dataValues );
                        logger.error( error );
                        return;
                    }
                }).catch( async error => {
                    transactionQueue.attemps += 1;
                    if ( transactionQueue.attemps >= 10 ) {
                        transactionQueue.isProcessed = true;
                        transactionQueue.isProcessedFailed = true;
                        await msg.clearReactions();
                        msg.author.send(msgs.general_transaction_fail);
                    } else {
                        transactionQueue.isProcessed = false;
                    }
                    TRANSACTIONQUEUECONTROLLER.update( transactionQueue.dataValues );
                    logger.error( error );
                    return;
                });
            }
        } catch (error) {
            logger.error( error );
        }
    });
    cronTransactionQueue.start();
}