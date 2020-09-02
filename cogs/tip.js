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
    async tip( msg, isSplit = false, isRoulette = false ){
        try {
            //console.log( ctx.args[2] );
            const isDm = UTIL.isDmChannel( msg.channel.type );
            if ( isDm ) {
                msg.author.send( msgs.server_message );
            } else {
                let amount = Util.parseFloat( global.ctx.args[1] );
                const userInfoSend = await USERINFO.getUser( msg.author.id );

                if( !userInfoSend ) {
                    msg.author.send( msgs.not_wallet );
                    await MESSAGEUTIL.reaction_fail( msg );
                    return;
                }
                if ( amount < envConfig.MINTIP ) {
                    msg.author.send( msgs.min_tip + '`(' + `${envConfig.MINTIP }` +' HLS)`');
                    await MESSAGEUTIL.reaction_fail( msg );
                    return;
                }
                if( amount > envConfig.MAXTIP ) {
                    msg.author.send( msgs.max_tip + '`(' + `${envConfig.MAXTIP }` +' HLS)`');
                    await MESSAGEUTIL.reaction_fail( msg );
                    return;
                }
                if ( typeof amount != "number" || isNaN(amount) ){
                    msg.author.send( msgs.invalid_command + ', the helios amount is not numeric.' + msgs.example_tip);
                    await MESSAGEUTIL.reaction_fail( msg );
                    return;
                }

                const getTotalAmountWithGas = await USERINFO.getGasPriceSumAmount( amount );
                let txs = [];
                if ( getTotalAmountWithGas ) {
                    const userInfoAuthorBalance = await USERINFO.getBalance( msg.author.id );
                    if ( userInfoAuthorBalance ) {
                        if ( msg.mentions.users.array().length > 0 ) {
                            let user_tip_id_list = [];

                            for( let user of msg.mentions.users.array() ) {
                                if ( user.id != msg.author.id && (user.id != msg.client.user.id || isRoulette))
                                    user_tip_id_list.push( { user_discord_id: user.id, tag: user.tag } );
                            }

                            if ( !user_tip_id_list.length )
                                return;
                                
                            if(  ( isSplit ? getTotalAmountWithGas : getTotalAmountWithGas*user_tip_id_list.length) >= userInfoAuthorBalance ) {
                                msg.author.send( msgs.insufficient_balance + ', remember to have enough gas for the transaction.');
                                await MESSAGEUTIL.reaction_fail( msg );
                                return;
                            }

                            if ( isSplit )
                                amount = amount / user_tip_id_list.length;
                            
                            //transaction object
                            txs = await UTIL.arrayTransaction( msg , user_tip_id_list, userInfoSend , amount, true, false );
                            if ( txs.length > 0 ) {
                            const transaction = await TRANSACTION.sendTransaction( txs , userInfoSend.keystore_wallet);
                                if ( transaction.length > 0 ) {
                                    await MESSAGEUTIL.reaction_complete_tip( msg );
                                    await UTIL.receiveTx( transaction, msg, amount, false, null, false, isRoulette);
                                } else {
                                    await MESSAGEUTIL.reaction_transaction_queue( msg );
                                    return;
                                } 
                            } else {
                                await MESSAGEUTIL.reaction_transaction_queue( msg );
                                return;
                            }
                        } else {
                            msg.author.send( msgs.invalid_tip_count + ', ' + msgs.example_tip)
                            await MESSAGEUTIL.reaction_fail( msg );
                            return;
                        }
                    } else {
                        await msg.author.send( msgs.balance_error );
                        await MESSAGEUTIL.reaction_fail( msg );
                        logger.error('Error get the balance with gas on TIP class');
                        return;
                    }
                } else {
                    await msg.author.send( msgs.balance_error );
                    await MESSAGEUTIL.reaction_fail( msg );
                    logger.error('Error get the balance with gas on TIP class');
                    return;
                };
            }
        } catch (error) {
            if( error.code != 50007 ) {
                await MESSAGEUTIL.reaction_fail( msg );
                msg.author.send( msgs.tip_error );
                logger.error( error );
            }
        }
    }
}
module.exports = Tip;