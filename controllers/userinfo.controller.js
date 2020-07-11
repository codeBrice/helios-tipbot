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
            const account = await HELIOS.accountCreate( envConfig.ENCRYPT_KEYSTORE );
            USERINFODAO.create( user_discord_id, account.account.address , JSON.stringify(account.encrypt));
            return account;
        }
        return false;
    }

    async getUser( user_discord_id ) {
        return await USERINFODAO.findByUserDiscordId( user_discord_id );
    }

    async getBalance( user_discord_id ){
        const userInfo = await USERINFODAO.findByUserDiscordId( user_discord_id );
        return await HELIOS.getBalance( userInfo[0].wallet );
    }

    async getBalanceInWei( user_discord_id ){
        const userInfo = await USERINFODAO.findByUserDiscordId( user_discord_id );
        return await HELIOS.getBalanceInwei( userInfo[0].wallet );
    }

    async getPrivateKey( user_discord_id ){
        const userInfo = await USERINFODAO.findByUserDiscordId( user_discord_id );
        const privateKey = await HELIOS.jsonToAccount( userInfo[0].keystore_wallet , envConfig.ENCRYPT_KEYSTORE);
        return privateKey.privateKey;
    }

    async getWallet( user_discord_id ){
        const userInfoWallet = await USERINFODAO.findByUserDiscordId( user_discord_id );
        return userInfoWallet[0].wallet;
    }

    async getGasPriceSumAmount( amount ){
        const sumAmount = await HELIOS.gasPriceSumAmount( amount, envConfig.GAS );
        return sumAmount;
    }

}
module.exports = UserInfoController;