const conf = require('../config.js').jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const {roulettes} = require('../models');
/**
   * RouletteDao
   * @date 2020-09-01
   */
class RouletteDao {
  /**
   * create balance roluette
   * @date 2020-09-01
   * @param {any} userDiscordId
   * @param {any} amount
   * @return {any}
   */
  async create( userDiscordId, amount) {
    try {
      return roulettes.create({
        user_info_id: userDiscordId,
        helios_amount: amount,

      });
    } catch (error) {
      logger.error( error );
    }
  }

  /**
   * find balance roluette By User DiscordId
   * @date 2020-09-01
   * @param {any} userDiscordId
   * @return {any}
   */
  async findByUserDiscordId( userDiscordId ) {
    try {
      return roulettes.findOne({
        where: {
          user_info_id: userDiscordId,
        },
      });
    } catch (error) {
      logger.error( error );
    }
  }

  /**
   * update
   * @date 2020-09-01
   * @param {any} userDiscordId
   * @param {any} amount
   * @return {any}
   */
  async update( userDiscordId, amount) {
    try {
      return roulettes.update({
        helios_amount: amount,
      },
      {
        where: {
          user_info_id: userDiscordId,
        },
      });
    } catch (error) {
      logger.error( error );
    }
  }

  /**
   * allBalance
   * @date 2020-09-07
   * @return {any}
   */
  async allBalance() {
    try {
      return roulettes.sum('helios_amount');
    } catch (error) {
      logger.error( error );
    }
  }
}

module.exports = RouletteDao;
