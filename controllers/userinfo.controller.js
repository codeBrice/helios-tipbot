require('dotenv').config();
const envConfig = process.env;
const UserInfoDao = require("../dao/user.info.dao");
const Helios = require("../middleware/helios");
const USERINFODAO = new UserInfoDao();
const HELIOS = new Helios();

class UserInfoController {

    constructor(){}

    async generateUserWallet( user_discord_id ) {
        const userDiscordId = await this.getUser( user_discord_id );
        if ( userDiscordId == null ) {
            const account = await HELIOS.accountCreate( envConfig.ENCRYPT_KEYSTORE );
            await USERINFODAO.create( user_discord_id, account.account.address , JSON.stringify(account.encrypt));
            return account;
        }
        return false;
    }

    async findAllUser() {
        return await USERINFODAO.findAdll();
    }

    async getUser( user_discord_id ) {
        return await USERINFODAO.findByUserDiscordId( user_discord_id );
    }

    async getBalance( user_discord_id ){
        const userInfo = await this.getUser( user_discord_id );
        return await HELIOS.getBalance( userInfo.wallet );
    }

    async getBalanceInWei( user_discord_id ){
        const userInfo = await USERINFODAO.findByUserDiscordId( user_discord_id );
        return await HELIOS.getBalanceInwei( userInfo.wallet );
    }

    async getPrivateKey( user_discord_id ){
        const userInfo = await USERINFODAO.findByUserDiscordId( user_discord_id );
        const privateKey = await HELIOS.jsonToAccount( userInfo.keystore_wallet , envConfig.ENCRYPT_KEYSTORE);
        return privateKey.privateKey;
    }

    async getWallet( user_discord_id ){
        const userInfoWallet = await USERINFODAO.findByUserDiscordId( user_discord_id );
        return userInfoWallet.wallet;
    }

    async getGasPriceSumAmount( amount ){
        const sumAmount = await HELIOS.gasPriceSumAmount( amount, envConfig.GAS );
        return sumAmount;
    }

}
module.exports = UserInfoController;