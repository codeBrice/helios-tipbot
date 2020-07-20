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

class Tip {
    async tip( msg, isSplit = false ){
        try {
            //console.log( ctx.args[2] );
            const isDm = UTIL.isDmChannel( msg.channel.type );
            if ( isDm ) {
                msg.author.send( msgs.server_message );
            } else {
                let amount = UTIL.parseFloat( ctx.args[1] );
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

                            if(  ( isSplit ? getTotalAmountWithGas : getTotalAmountWithGas*user_tip_id_list.length) > userInfoAuthorBalance ) {
                                msg.author.send( msgs.insufficient_balance + ', remember to have enough gas for the transaction.');
                                MESSAGEUTIL.reaction_fail( msg );
                                return;
                            }

                            if ( isSplit )
                                amount = amount / user_tip_id_list.length;
                            
                            //verified if user has tip the last 10seconds
                            global.clientRedis.get('tip', async function(err, reply) {
                                if ( reply != null ) {
                                    msg.author.send( msgs.limit_exceed );
                                    MESSAGEUTIL.reaction_fail( msg );
                                    return;
                                } else {
                                    global.clientRedis.set( 'tip', 'tip' );
                                    global.clientRedis.expire('tip', 10);
                                    let txs = [];
                                    const userInfoSend = await new Promise( ( resolve, reject ) => {
                                        const getUser = USERINFO.getUser( msg.author.id );
                                        resolve( getUser)
                                    });

                                    txs = await UTIL.arrayTransaction( msg , user_tip_id_list, userInfoSend , amount );
                                    console.log( txs );
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
                                                let receiveTx = await TRANSACTION.receiveTransaction( receive, userInfoReceive.keystore_wallet, true , userInfoSend.id, receive.user_id);
                                                if ( receiveTx.length > 0  ) {
                                                    global.client.fetchUser( receive.user_discord_id_receive , false ).then(user => {
                                                        user.send(MESSAGEUTIL.msg_embed('Tip receive',
                                                        'The user'+ msg.author + ' tip you `' + amount +' HLS`', true, `https://heliosprotocol.io/block-explorer/#main_page-transaction&${receiveTx[0].hash}`) ); 
                                                        MESSAGEUTIL.reaction_complete_tip( msg );
                                                    });
                                                }
                                            }
                                        } else {
                                            msg.author.send( msgs.general_transaction_fail );
                                            MESSAGEUTIL.reaction_fail( msg );
                                            logger.error( error );
                                        }
                                    }).catch( error => {
                                        if( error.message.includes('10 seconds') ) {
                                            msg.author.send( msgs.limit_exceed );
                                            MESSAGEUTIL.reaction_fail( msg );
                                            return;
                                        }
                                        msg.author.send( msgs.general_transaction_fail )
                                        MESSAGEUTIL.reaction_fail( msg );
                                        logger.error( error );
                                    });
                                }
                            });

                        } else {
                            msg.author.send( msgs.invalid_tip_count + ', ' + msgs.example_tip)
                            MESSAGEUTIL.reaction_fail( msg );
                            return;
                        }
                    }).catch( error => {
                        msg.author.send( msgs.general_transaction_fail )
                        MESSAGEUTIL.reaction_fail( msg );
                        logger.error( error );
                    });
                }).catch( error => {
                    logger.error( error );
                    msg.author.send( msgs.general_transaction_fail )
                    MESSAGEUTIL.reaction_fail( msg );
                });
            }
        } catch (error) {
            logger.error( error );
        }
    }
}
module.exports = Tip;