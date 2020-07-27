require('dotenv').config();
const envConfig = process.env;
const Util = require('../util/util');
const UTIL = new Util();
const conf = require("../config.js").jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const msgs = require('../util/msg.json');
const UserInfoController = require('../controllers/userinfo.controller');
const USERINFO = new UserInfoController();
const MessageUtil = require('../util/Discord/message');
const MESSAGEUTIL = new MessageUtil();
const Transaction = require('../controllers/transactions.controller');
const TRANSACTION = new Transaction();
const TransactionQueueController = require('../controllers/transaction.queue.controller');
const TRANSACTIONQUEUECONTROLLER = new TransactionQueueController();

class Tip {
    async tip( msg, isSplit = false ){
        try {
            //console.log( ctx.args[2] );
            const isDm = UTIL.isDmChannel( msg.channel.type );
            if ( isDm ) {
                msg.author.send( msgs.server_message );
            } else {
                let amount = UTIL.parseFloat( global.ctx.args[1] );
                if ( amount < envConfig.MINTIP ) {
                    msg.author.send( msgs.min_tip + '`(' + `${envConfig.MINTIP }` +' HLS)`');
                    MESSAGEUTIL.reaction_fail( msg );
                    return;
                }
                if( amount > envConfig.MAXTIP ) {
                    msg.author.send( msgs.max_tip + '`(' + `${envConfig.MAXTIP }` +' HLS)`');
                    MESSAGEUTIL.reaction_fail( msg );
                    return;
                }
                if ( typeof amount != "number" || isNaN(amount) ){
                    msg.author.send( msgs.invalid_command + ', the helios amount is not numeric.' + msgs.example_tip);
                    MESSAGEUTIL.reaction_fail( msg );
                    return;
                }
                const getTotalAmountWithGas = new Promise( (resolve, reject) => {
                    const userInfo = USERINFO.getGasPriceSumAmount( amount );
                    resolve( userInfo );
                });
                let txs = [];
                getTotalAmountWithGas.then( getTotalAmountWithGas => {
                    const userInfoAuthorBalance = new Promise( (resolve, reject) => {
                        const userInfoAuthor = USERINFO.getBalance( msg.author.id );
                        resolve( userInfoAuthor );
                    });
                    userInfoAuthorBalance.then( async userInfoAuthorBalance => {
                        //console.log( 'menciones', msg.mentions.users.array() );
                        if ( msg.mentions.users.array().length > 0 ) {
                            let user_tip_id_list = [];

                            for( let user of msg.mentions.users.array() ) {
                                if ( user.id != msg.author.id && user.id != msg.client.user.id)
                                    user_tip_id_list.push( { user_discord_id: user.id, tag: user.tag } );
                            }

                            if ( !user_tip_id_list.length )
                                return;
                                
                            if(  ( isSplit ? getTotalAmountWithGas : getTotalAmountWithGas*user_tip_id_list.length) >= userInfoAuthorBalance ) {
                                msg.author.send( msgs.insufficient_balance + ', remember to have enough gas for the transaction.');
                                MESSAGEUTIL.reaction_fail( msg );
                                return;
                            }

                            if ( isSplit )
                                amount = amount / user_tip_id_list.length;
                            
                            const userInfoSend = await USERINFO.getUser( msg.author.id );
                            //transaction object
                            txs = await UTIL.arrayTransaction( msg , user_tip_id_list, userInfoSend , amount );
                            
                            if ( txs.length > 0 ) {
                                const transaction = new Promise( (resolve, reject) => {
                                    const sendingTx = TRANSACTION.sendTransaction( txs , userInfoSend.keystore_wallet);
                                    resolve( sendingTx );
                                });
                                transaction.then( async tx => {
                                    if ( tx.length > 0 ) {
                                        for ( let receive of tx ) {
                                            let userInfoReceive = await new Promise((resolve, reject) => {
                                                const getUser = USERINFO.getUser( receive.user_discord_id_receive );
                                                resolve( getUser );
                                            });
                                            let receiveTx = await TRANSACTION.receiveTransaction( receive, userInfoReceive.keystore_wallet, true , receive.user_id_send, receive.user_id_receive);
                                            if ( receiveTx.length > 0  ) {
                                                global.clientRedis.set( 'receive:'+receive.user_discord_id_receive, receive.user_discord_id_receive );
                                                global.clientRedis.expire('receive:'+receive.user_discord_id_receive, 10);
                                                global.client.fetchUser( receive.user_discord_id_receive , false ).then(user => {
                                                    user.send(MESSAGEUTIL.msg_embed('Tip receive',
                                                    'The user'+ msg.author + ' tip you `' + amount +' HLS`', true, `https://heliosprotocol.io/block-explorer/#main_page-transaction&${receiveTx[0].hash}`) ); 
                                                    MESSAGEUTIL.reaction_complete_tip( msg );
                                                });
                                            }
                                        }
                                    } else {
                                        await TRANSACTIONQUEUECONTROLLER.create( txs , msg , true , false);
                                        MESSAGEUTIL.reaction_transaction_queue( msg );
                                        logger.error( error );
                                        return;
                                    }
                                }).catch( async error => {
                                    await TRANSACTIONQUEUECONTROLLER.create( txs , msg , true , false);
                                    MESSAGEUTIL.reaction_transaction_queue( msg );
                                    logger.error( error );
                                    return;
                                });   
                            }
                        } else {
                            msg.author.send( msgs.invalid_tip_count + ', ' + msgs.example_tip)
                            MESSAGEUTIL.reaction_fail( msg );
                            return;
                        }
                    }).catch( async error => {
                        await TRANSACTIONQUEUECONTROLLER.create( txs , msg , true , false);
                        MESSAGEUTIL.reaction_transaction_queue( msg );
                        logger.error( error );
                    });
                }).catch( async error => {
                    await TRANSACTIONQUEUECONTROLLER.create( txs , msg , true , false);
                    MESSAGEUTIL.reaction_transaction_queue( msg );
                    MESSAGEUTIL.reaction_fail( msg );
                });
            }
        } catch (error) {
            logger.error( error );
        }
    }
}
module.exports = Tip;