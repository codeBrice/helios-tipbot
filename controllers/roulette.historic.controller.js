require('dotenv').config();
const RouletteHistoricDao = require('../dao/roulette.historic.dao');
const conf = require('../config.js').jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();

/**
   * RouletteHistoricController
   */
class RouletteHistoricController {
  /**
   * init
   * @date 2020-09-04
   * @param {any} json
   * @param {any} number
   * @param {any} isFinish
   * @return {any}
   */
  static async init( json, number, isFinish ) {
    logger.info('start roulette.hictoric init');
    return await RouletteHistoricDao.create( json, number, isFinish );
  }

  /**
   * updateHistoric
   * @date 2020-09-04
   * @param {any} id
   * @param {any} isFinish
   * @return {any}
   */
  static async updateHistoric( id, isFinish) {
    logger.info('start roulette.hictoric updateHistoric');
    return await RouletteHistoricDao.update( id, isFinish);
  }

  /**
   * get LastWins
   * @date 2020-09-07
   * @return {any}
   */
  static async getLastWins() {
    logger.info('start getLastWins');
    return await RouletteHistoricDao.getLastWins();
  }

  /**
   * get Commissions
   * @date 2020-09-07
   * @return {any}
   */
  static async getCommissions() {
    logger.info('start getCommissions');
    return await RouletteHistoricDao.getCommissions();
  }

  /**
   * update Commissions
   * @date 2020-09-07
   * @param {any} ids
   * @return {any}
   */
  static async updateCommissions(ids) {
    logger.info('start updateCommissions');
    return await RouletteHistoricDao.updateCommissions(ids);
  }
}
module.exports = RouletteHistoricController;
