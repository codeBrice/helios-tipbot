const conf = require('../config.js').jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const moment = require('moment');
const {userinfo} = require('../models');

/**
   * UserInfoDao
   * @date 2020-09-10
   */
class UserInfoDao {
  /**
   * create
   * @date 2020-09-10
   * @param {any} userDiscordId
   * @param {any} wallet
   * @param {any} keystoreWallet
   * @return {any}
   */
  static async create( userDiscordId, wallet, keystoreWallet) {
    try {
      return userinfo.create({
        user_discord_id: userDiscordId,
        wallet: wallet,
        keystore_wallet: keystoreWallet,
        create_date: moment().utc().toDate(),
      });
    } catch (error) {
      logger.error( error );
    }
  }

  /**
   * findByUserDiscordId
   * @date 2020-09-10
   * @param {any} userDiscordId
   * @return {any}
   */
  static async findByUserDiscordId( userDiscordId ) {
    try {
      return userinfo.findOne({
        where: {
          user_discord_id: userDiscordId,
        },
      });
    } catch (error) {
      logger.error( error );
    }
  }

  /**
   * findAll
   * @date 2020-09-10
   * @return {any}
   */
  static async findAll() {
    try {
      return userinfo.findAll();
    } catch (error) {
      logger.error( error );
    }
  }

  /**
   * findByWallet
   * @date 2020-09-10
   * @param {any} wallet
   * @return {any}
   */
  static async findByWallet( wallet ) {
    try {
      return userinfo.findOne({
        where: {
          wallet: wallet,
        },
      });
    } catch (error) {
      logger.error( error );
    }
  }
}

module.exports = UserInfoDao;
