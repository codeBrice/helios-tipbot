require('dotenv').config();
const envConfig = process.env;
const UserInfoDao = require("../dao/user.info.dao");
const Helios = require("../middleware/helios");
const USERINFODAO = new UserInfoDao();
const HELIOS = new Helios();

class UserInfoController {

    constructor(){}

    async generateUserWallet( user_discord_id ) {
        const userDiscordId = await USERINFODAO.findByUserDiscordId( user_discord_id );
        if ( userDiscordId.length == 0 ) {
            const account  = await HELIOS.accountCreate( envConfig.ENCRYPT_KEYSTORE );
            USERINFODAO.create( user_discord_id, account.account.address , JSON.stringify(account.encrypt));
            return account;
        }
        return false;
    }

    async getUser( user_discord_id ) {
        return await USERINFODAO.findByUserDiscordId( user_discord_id );
    }

    async sendTransaction( tx ){

    }

    async getBalance( user_discord_id ){
        const userInfo= await USERINFODAO.findByUserDiscordId( user_discord_id );
        return await HELIOS.getBalance( userInfo[0].wallet );
    }

}
module.exports = UserInfoController;