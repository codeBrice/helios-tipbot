var cron = require('cron');
const UserInfo = require('../controllers/userinfo.controller');
const USERINFO = new UserInfo();
const TransactionController = require('../controllers/transactions.controller');
const TRANSACTIONCONTROLLER = new TransactionController();
const MessageUtil = require('../util/Discord/Message');
const MESSAGEUTIL = new MessageUtil();
const Helios = require('../middleware/Helios');
const HELIOS = new Helios();
const conf = require("../config.js").jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();

exports.fnRunCrons = function () {
    let cronReceive = cron.job("0 */2 * * * *", function(){
        logger.info('Start receive tx with external cron');
        const users = new Promise( (resolve, reject ) => {
            resolve(USERINFO.findAllUser());
        });
        users.then( async users => {
            for( let user of users ) {
                const receiveTx = await new Promise( ( resolve, reject ) => {
                    resolve( TRANSACTIONCONTROLLER.receiveTransaction({to: user.wallet }, user.keystore_wallet, false, user.id, user.id ) ); 
                })
    
                if( receiveTx.length ) {
                    for( let receive of receiveTx ) {
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
}