const conf = require('../config.js').jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const {roulette_historic} = require('../models');
/**
   * RouletteHistoricDao
   * @date 2020-09-01
   */
class RouletteHistoricDao {
  /**
   * create
   * @date 2020-09-04
   * @param {any} json
   * @param {any} number
   * @param {any} isFinish
   * @retunpx sequelize-cli db:migratern {any}
   */
  async create( json, number, isFinish) {
    try {
      return roulette_historic.create({
        bets: json,
        winNumber: number,
        isFinish: isFinish,
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
  async findId( userDiscordId ) {
    try {
      return roulette_historic.findOne({
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
   * @param {any} id
   * @param {any} isFinish
   * @return {any}
   */
  async update( id, isFinish) {
    try {
      return roulette_historic.update({
        isFinish: isFinish,
      },
      {
        where: {
          id: id,
        },
      });
    } catch (error) {
      logger.error( error );
    }
  }
}

module.exports = RouletteHistoricDao;
