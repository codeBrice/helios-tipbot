const Helios = require("../middleware/helios");
const SendTransaction = require("../entities/SendTransactions");
const HELIOS = new Helios();
const MessageUtil = require('../util/Discord/message');
const MESSAGEUTIL = new MessageUtil();
const UserInfoController = require('../controllers/userinfo.controller');
const USERINFO = new UserInfoController();
require('dotenv').config();
const envConfig = process.env;
const TransactionQueueController = require('../controllers/transaction.queue.controller');
const TRANSACTIONQUEUECONTROLLER = new TransactionQueueController();
const Transaction = require('../controllers/transactions.controller');
const TRANSACTION = new Transaction();
const conf = require("../config.js").jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();

class Util {

    isDmChannel( channelType ){
        if ( channelType == 'dm' )
            return true;
        else 
            return  false;
    }

    parseFloat( amount ){
        return parseFloat(amount);
    }

    async arrayTransaction( msg , user_tip_id_list, userInfoSend, amount, isTip, isRain ){
        let txs = [];
        for( let i = 0; i < user_tip_id_list.length; i++ ) {
            let transactionEntitie = new SendTransaction();
            let getUserReceive = await USERINFO.getUser( user_tip_id_list[i].user_discord_id );
            if( !getUserReceive ) {
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
            if( isTip )
                await TRANSACTIONQUEUECONTROLLER.create( txs , msg , true , false);
            if ( isRain )
                await TRANSACTIONQUEUECONTROLLER.create( txs , msg , false , true);

            await MESSAGEUTIL.reaction_transaction_queue( msg );
            return txs = [];
        }
        return txs;
    }

    async isQueue( txs , msg ) {
        let isQueue = false;
        let getReceive;
        let getTip;
        let getReceiveSend
        let getTipSend;
        getTipSend = await new Promise( ( resolve, reject ) => {
            return global.clientRedis.get('tip:'+msg.author.id, function(err, tip) { 
                resolve(tip) ;
            });
        });
        if( !getTipSend ) {
            global.clientRedis.set( 'tip:'+msg.author.id, msg.author.id );
            global.clientRedis.expire('tip:'+msg.author.id, 11);
        }
            
        getReceiveSend = await new Promise( ( resolve, reject ) => {
            return global.clientRedis.get('receive:'+msg.author.id, function(err, receive) { 
                resolve(receive) ;
            });
        });
        if ( getTipSend || getReceiveSend ) {
            isQueue = true 
        } else {
            for(let i = 0; i < txs.length; i++ ) {
                if ( !isQueue ) {
    
                    getReceive = await new Promise( ( resolve, reject ) => {
                        return global.clientRedis.get('receive:'+txs[i].user_discord_id_receive, function(err, receive) { 
                            resolve(receive) ;
                        });
                    });
                    getTip = await new Promise( ( resolve, reject ) => {
                        return global.clientRedis.get('tip:'+txs[i].user_discord_id_receive, function(err, tip) { 
                            resolve(tip) ;
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

    async receiveTx( transaction, msg, amount, isQueue = false, transactionQueue, isRain = false ) {
        for ( let receive of transaction ) {
            if ( isQueue ) {
                await global.clientRedis.set( 'tip:'+receive.user_discord_id_send, receive.user_discord_id_send );
                await global.clientRedis.expire('tip:'+receive.user_discord_id_send, 11);
            }
            let userInfoReceive = await USERINFO.getUser( receive.user_discord_id_receive );
            let receiveTx = await TRANSACTION.receiveTransaction( receive, userInfoReceive.keystore_wallet, true , receive.user_id_send, receive.user_id_receive);
            if ( receiveTx.length > 0  ) {
                for ( let receiveTransaction of receiveTx ) {
                    let isWalletBot = await USERINFO.findByWallet( receiveTransaction.from );
                    this.sendMsgReceive( isQueue, isRain, isWalletBot, msg, amount, transactionQueue, receiveTx, receive );
                }
            }
        }
    }

    async sendMsgReceive( isQueue, isRain, isWalletBot, msg, amount, transactionQueue, receiveTx, receive ) {
        try {
            let fetchUser = await global.client.fetchUser( receive.user_discord_id_receive , false );
            if ( isWalletBot ) {
                if ( !isQueue ) {
                    if ( !isRain ) {
                        await fetchUser.send(MESSAGEUTIL.msg_embed('Tip receive',
                            'The user'+ msg.author + ' tip you `' + amount +' HLS`', true, `https://heliosprotocol.io/block-explorer/#main_page-transaction&${receiveTx[0].hash}`) );
                    } else {
                        await fetchUser.send(MESSAGEUTIL.msg_embed('Rain receive',
                            'The user'+ msg.author + ' rain you `' + amount +' HLS`', true, `https://heliosprotocol.io/block-explorer/#main_page-transaction&${receiveTx[0].hash}`) ); 
                    }
    
                } else {
                    transactionQueue.isProcessed = true;
                    transactionQueue.attemps += 1;
                    await TRANSACTIONQUEUECONTROLLER.update( transactionQueue.dataValues );
                    let fetchUser = await global.client.fetchUser( receive.user_discord_id_receive , false );
                    let title = ( transactionQueue.isTip ? 'Tip receive': 'Rain receive');
                    let titleDescription = ( transactionQueue.isTip ? ' tip you': ' rain you');
                    await fetchUser.send(MESSAGEUTIL.msg_embed(title,
                    'The user'+ msg.author + titleDescription +' `' + receive.helios_amount +' HLS`', true, `https://heliosprotocol.io/block-explorer/#main_page-transaction&${receiveTx[0].hash}`) );
                }
            } else {
                await fetchUser.send(MESSAGEUTIL.msg_embed('Transaction receive',
                    'The wallet '+ receiveTransaction.from + ' send you `' + await HELIOS.getAmountFloat(receiveTransaction.value)  +' HLS`', true, `https://heliosprotocol.io/block-explorer/#main_page-transaction&${receiveTx[0].hash}`) );
            }
        } catch (error) {
            if( error.code != 50007 ) {
                logger.error( error );
            }
        }
    }

}
module.exports = Util;