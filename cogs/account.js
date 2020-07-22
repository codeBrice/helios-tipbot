require('dotenv').config();
const envConfig = process.env;
const UserInfoController = require("../controllers/userinfo.controller");
const userInfoController = new UserInfoController();
const Util = require('../util/Util');
const UTIL = new Util();
const conf = require("../config.js").jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const msgs = require('../util/msg.json');
const MessageUtil = require('../util/Discord/Message');
const MESSAGEUTIL = new MessageUtil();
const TransactionController = require('../controllers/transactions.controller');
const TRANSACTIONCONTROLLER = new TransactionController();
const SendTransaction = require('../entities/SendTransactions');
const Helios = require('../middleware/Helios');
const HELIOS = new Helios();

class Account {
    async generateAccount( msg ){
        try {
            //console.log( 'msg guild id: ' + msg.guild + ' msg author id: ' + msg.author.id );
            const isDm = UTIL.isDmChannel( msg.channel.type );
            if ( isDm ){
                const userInfo = new Promise((resolve, reject) => {
                    const generateWallet = userInfoController.generateUserWallet( msg.author.id );
                    resolve ( generateWallet );
                });
                userInfo.then( userInfo => {
                    if ( userInfo )
                        msg.author.send( MESSAGEUTIL.msg_embed('Generate account', 'Your wallet is: '+ '`'+userInfo.account.address+'`') );
                    else 
                        msg.author.send('You already have a wallet, please use the `.wallet` command to know it.')
                }).catch( error => {
                    logger.error( error );
                });
            } else {
                msg.delete( msg );
                msg.author.send( msgs.direct_message + ' (`' + msg.content + '`)' );
            }
        } catch (error) {
            logger.error( error );
        }
    }

    async getPrivateKey( msg ) {
        try {
            //console.log( 'msg guild id: ' + msg.guild + ' msg author id: ' + msg.author.id );
            const isDm = UTIL.isDmChannel( msg.channel.type );
            if ( isDm ){
                const userInfoPrivateKey = new Promise((resolve, reject) => {
                    const getPrivateKey = userInfoController.getPrivateKey( msg.author.id );
                    resolve ( getPrivateKey );
                });
                userInfoPrivateKey.then( privateKey => {
                    if ( privateKey )
                        msg.author.send( MESSAGEUTIL.msg_embed( 'Private key' , 'Your private key is: '+ '`'+ privateKey +'`'))
                    else
                        msg.author.send('You dont have a account.')
                }).catch( error => {
                    logger.error( error );
                });
            } else {
                msg.delete( msg );
                msg.author.send( msgs.direct_message + ' (`' + msg.content + '`)' );
            }
        } catch (error) {
            logger.error( error );
        }
    }

    async getBalance( msg ){
        try {
            const userInfoBalance = new Promise((resolve, reject) => {
                const getBalance = userInfoController.getBalance( msg.author.id );
                resolve ( getBalance );
            });
            userInfoBalance.then( userInfoBalance => {
                msg.author.send( MESSAGEUTIL.msg_embed('Balance' , msgs.balance + userInfoBalance + ' HLS') );
                const isDm = UTIL.isDmChannel( msg.channel.type );
                if ( !isDm ){
                    MESSAGEUTIL.reaction_dm( msg );
                }
            }).catch( error => {
                msg.author.send( msgs.balance_error );
                logger.error( error );
            })
        } catch (error) {
            logger.error( error );
        }
    }

    async getWallet( msg ){
        try {
            const userInfoWallet = new Promise((resolve, reject) => {
                const getWallet = userInfoController.getWallet( msg.author.id );
                resolve ( getWallet );
            });
            userInfoWallet.then( wallet => {
                msg.author.send( MESSAGEUTIL.msg_embed('Wallet info', msgs.wallet +'`'+wallet+'`'));
                const isDm = UTIL.isDmChannel( msg.channel.type );
                if ( !isDm ){
                    MESSAGEUTIL.reaction_dm( msg );
                }
            }).catch( error => {
                msg.author.send( msgs.wallet_error);
                MESSAGEUTIL.reaction_fail( msg );
                logger.error( error );
            })
        } catch (error) {
            msg.author.send( msgs.wallet_error);
            MESSAGEUTIL.reaction_fail( msg );
            logger.error( error );
        }
    }

    async withdraw( msg ) {
        try {
            if ( UTIL.isDmChannel(msg.channel.type) ) {
                let amount = UTIL.parseFloat( global.ctx.args[1] );
    
                if ( typeof amount != "number" || isNaN(amount) ){
                    msg.author.send( msgs.invalid_command + ', the helios amount is not numeric. ' + envConfig.ALIASCOMMAND + 'withdraw 100 0x00000');
                    return;
                }
    
                const userInfo = new Promise( ( resolve, reject ) => {
                    resolve( userInfoController.getUser( msg.author.id ) );
                })
                userInfo.then( async userInfoData => {
                    if( userInfoData ) {
                        let tx = [];
                        let transactionEntitie = new SendTransaction();
                        transactionEntitie.from = userInfoData.wallet;
                        transactionEntitie.to = global.ctx.args[2];
                        transactionEntitie.gasPrice = await HELIOS.toWei(String(await HELIOS.getGasPrice()));
                        transactionEntitie.gas = envConfig.GAS;
                        transactionEntitie.value = await HELIOS.toWeiEther((String(amount)));
                        tx.push( transactionEntitie );
                        const sendTx = await new Promise( ( resolve, reject ) => {
                            resolve( TRANSACTIONCONTROLLER.sendTransaction( tx , userInfoData.keystore_wallet) ) 
                        })
                        if ( !sendTx.length ) {
                            msg.author.send( msgs.error_withdraw + envConfig.ALIASCOMMAND + 'withdraw 100 0x00000' );
                            logger.error( error );
                        } else {
                            msg.author.send(MESSAGEUTIL.msg_embed('Withdraw process', msgs.withdraw_success)); 
                        }
                    }
                }).catch( error => {
                    msg.author.send( msgs.error_withdraw + envConfig.ALIASCOMMAND + 'withdraw 100 0x00000' );
                    MESSAGEUTIL.reaction_fail( msg );
                    logger.error( error );
                });
            } else {
                msg.delete( msg );
                msg.author.send( msgs.direct_message + ' (`.withdraw`)' );
            }
        } catch (error) {
            msg.author.send( msgs.error_withdraw + envConfig.ALIASCOMMAND + 'withdraw 100 0x00000') ;
            MESSAGEUTIL.reaction_fail( msg );
            logger.error( error );
        }
    }
}
module.exports = Account;