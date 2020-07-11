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
    async tip( ctx, msg, isSplit = false, client){
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
                        if(  getTotalAmountWithGas > userInfoAuthorBalance ) {
                            msg.author.send( msgs.insufficient_balance + ', remember to have enough gas for the transaction.');
                            MESSAGEUTIL.reaction_fail( msg );
                            return;
                        }
                        if ( msg.mentions.users.array().length > 0 ) {
                            if ( amount > userInfoAuthorBalance ){
                                msg.author.send( msgs.insufficient_balance + ' to tip.');
                                return;
                            }
                            let user_tip_id_list = [];
                            for( let user of msg.mentions.users.array() ) {
                                if ( user.id != msg.author.id && user.id != msg.client.user.id)
                                    user_tip_id_list.push( { user_discord_id: user.id, tag: user.tag } );
                            }
                            if ( isSplit ) 
                                amount = amount / user_tip_id_list.length;
                                
                            for( let user of user_tip_id_list ) {
                                const userInfoSend = new Promise((resolve, reject) => {
                                    const getUser = USERINFO.getUser( user.user_discord_id );
                                    resolve( getUser );
                                });
                                userInfoSend.then( userInfoSend => {
                                    if( !userInfoSend.length ) {
                                        msg.author.send(`The user ${user.tag} has not generated an account in Helios TipBot.`);
                                        MESSAGEUTIL.reaction_fail( msg );
                                        return;
                                    }
                                    const transaction = new Promise( (resolve, reject) => {
                                        const sendingTx = TRANSACTION.sendTransaction( msg.author.id, userInfoSend[0], amount);
                                        resolve( sendingTx );
                                    })
                                    transaction.then( tx => {
                                        if ( tx ) {
                                            client.fetchUser(userInfoSend[0].user_discord_id,false).then(user => {
                                                user.send(MESSAGEUTIL.msg_embed('Tip receive',
                                                'The user'+ msg.author + 'tip you `' + amount +' HLS`')); 
                                            MESSAGEUTIL.reaction_complete_tip( msg );
                                        });
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
                                });
                            }
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