const Helios = require("../middleware/helios");
const SendTransaction = require("../entities/SendTransactions");
const HELIOS = new Helios();
const MessageUtil = require('../util/Discord/Message');
const MESSAGEUTIL = new MessageUtil();
const UserInfoController = require('../controllers/userinfo.controller');
const USERINFO = new UserInfoController();
require('dotenv').config();
const envConfig = process.env;

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

    async arrayTransaction( msg , user_tip_id_list, userInfoSend, amount ){
        let txs = [];
        let userInfoReceive;
        for( let user of user_tip_id_list) {
            let transactionEntitie = new SendTransaction();
            userInfoReceive = await new Promise((resolve, reject) => {
                const getUser = USERINFO.getUser( user.user_discord_id );
                resolve( getUser );
            });
            if( !userInfoReceive ) {
                msg.author.send(`The user ${user.tag} has not generated an account in Helios TipBot.`);
                MESSAGEUTIL.reaction_fail( msg );
                return;
            }

            transactionEntitie.from = userInfoSend.wallet;
            transactionEntitie.to = userInfoReceive.wallet;
            transactionEntitie.gasPrice = await HELIOS.toWei(String(await HELIOS.getGasPrice()));
            transactionEntitie.gas = envConfig.GAS;
            transactionEntitie.value = await HELIOS.toWeiEther((String(amount)));
            transactionEntitie.user_discord_id_receive = userInfoReceive.user_discord_id;
            transactionEntitie.user_id = userInfoReceive.id;
            transactionEntitie.helios_amount = amount;
            txs.push( transactionEntitie );
        }
        return txs;
    }

}
module.exports = Util;