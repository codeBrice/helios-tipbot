const UserInfoController = require("../controllers/userinfo.controller");
const userInfoController = new UserInfoController();
const Util = require('../util/util');
const UTIL = new Util();
const conf = require("../config.js").jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const msgs = require('../util/msg.json');

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
                        msg.author.send( 'Your wallet is: '+ '`'+userInfo.account.address+'`');
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
}
module.exports = Account;