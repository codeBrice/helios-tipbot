require('dotenv').config();
const RouletteHistoricDao = require('../dao/roulette.historic.dao');
const ROULETTEHDAO = new RouletteHistoricDao();
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
    return await ROULETTEHDAO.create( json, number, isFinish );
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
    return await ROULETTEHDAO.update( id, isFinish);
  }
}
module.exports = RouletteHistoricController;
