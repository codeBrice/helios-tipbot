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
            global.clientRedis.set( 'tip:'+userInfoSend.user_discord_id, userInfoSend.user_discord_id );
            global.clientRedis.expire('tip:'+userInfoSend.user_discord_id, 20);
            let transactionEntitie = new SendTransaction();
            let getUserReceive = await USERINFO.getUser( user_tip_id_list[i].user_discord_id );
            if( !getUserReceive ) {
                msg.author.send(`The user ${user_tip_id_list[i].tag} has not generated an account in Helios TipBot.`);
                MESSAGEUTIL.reaction_fail( msg );
                return;
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

            MESSAGEUTIL.reaction_transaction_queue( msg );
            return txs = [];
        }
        return txs;
    }

    async isQueue( txs , msg ) {
        let isQueue = false;
        let getReceive;
        let getTip;
        let getReceiveSend
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

                getReceiveSend = await new Promise( ( resolve, reject ) => {
                    return global.clientRedis.get('receive:'+msg.author.id, function(err, receive) { 
                        resolve(receive) ;
                    });
                });

                if ( getReceive || getTip || getReceiveSend ) {
                    isQueue = true;
                }
            } else {
                break;
            }
        }
        return isQueue;
    }

}
module.exports = Util;