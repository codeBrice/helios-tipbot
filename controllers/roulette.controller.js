require('dotenv').config();
const UserInfoDao = require('../dao/user.info.dao');
const USERINFODAO = new UserInfoDao();
const RouletteDao = require('../dao/roulette.dao');
const ROULETTEDAO = new RouletteDao();
const conf = require('../config.js').jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();

/**
   * 描述
   */
class RouletteController {
  /**
   * 描述
   * @date 2020-09-01
   * @param {any} userDiscordId
   * @param {any} amount
   * @return {any}
   */
  static async deposit( userDiscordId, amount ) {
    logger.info('start deposit userDiscordId:'+userDiscordId+' amount:'+amount);
    const userInfo = await USERINFODAO.findByUserDiscordId( userDiscordId );
    if ( userInfo != null ) {
      let account = await ROULETTEDAO.findByUserDiscordId( userInfo.id );
      if (account == null) {
        account = await ROULETTEDAO.create( userInfo.id, amount );
      } else {
        account = await ROULETTEDAO.update( userInfo.id,
            (parseFloat(account.helios_amount) + amount) );
      }
      return account;
    }
    return false;
  }

  /**
   * get Balance
   * @date 2020-09-01
   * @param {any} userDiscordId
   * @return {any}
   */
  static async getBalance( userDiscordId ) {
    logger.info('start getBalance');
    let account = await ROULETTEDAO.findByUserDiscordId( userDiscordId );
    if (account == null) {
      account = await ROULETTEDAO.create( userDiscordId, 0 );
    }
    return parseFloat(account.helios_amount);
  }

  /**
   * update Balance
   * @date 2020-09-01
   * @param {any} userDiscordId
   * @param {any} amount
   * @param {any} isWinner
   * @return {any}
   */
  static async updateBalance( userDiscordId, amount, isWinner) {
    logger.info('start updateBalance userDiscordId:'+userDiscordId+
      ' amount:'+amount+' isWinner:'+isWinner);
    const userInfo = await USERINFODAO.findByUserDiscordId( userDiscordId );
    if ( userInfo != null ) {
      let account = await ROULETTEDAO.findByUserDiscordId( userInfo.id );
      if (account != null) {
        let amountUpdate;
        if (isWinner) {
          amountUpdate = (parseFloat(account.helios_amount) + amount);
        } else {
          amountUpdate = (parseFloat(account.helios_amount) - amount);
        }
        account = await ROULETTEDAO.update( userInfo.id, amountUpdate);
      }
      return account;
    }
    return false;
  }
}
module.exports = RouletteController;
