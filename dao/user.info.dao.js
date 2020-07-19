const conf = require("../config.js").jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const moment = require("moment");
const { userinfo } = require("../models");

class UserInfoDao{
    
    constructor() {

    }

    async create ( user_discord_id , wallet , keystore_wallet) {
        try {
            return userinfo.create({
                user_discord_id: user_discord_id,
                wallet: wallet,
                keystore_wallet: keystore_wallet, 
                create_date: moment().utc().toDate()
              });
        } catch (error) {
            logger.error( error );
        }
    }

    async findByUserDiscordId ( user_discord_id ) {
        try {
            return userinfo.findOne({
                where: {
                    user_discord_id: user_discord_id
                }
            });
        } catch (error) {
            logger.error( error );
        }
    }

    async findAdll () {
        try {
            return userinfo.findAll();
        } catch (error) {
            logger.error( error );
        }
    }
}

module.exports = UserInfoDao;