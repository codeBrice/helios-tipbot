require('dotenv').config();
const envConfig = process.env;
const Util = require('../util/util');
const conf = require('../config.js').jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const RouletteController = require('../controllers/roulette.controller');
const UserInfoController = require('../controllers/userinfo.controller');


/**
   * bankroll
   * @date 2020-09-01
   * @param {any} message
   */
exports.execute = async (message) => {
  logger.info('start bankroll');

  const channels = JSON.parse(envConfig.ONLY_CHANNELS_ROULETTE);
  if (Util.channelValidator(message, channels)) return;

  const botBalance = await UserInfoController.getBalance( message.client.user.id );
  if ( !botBalance ) {
    await UserInfoController.generateUserWallet( message.client.user.id );
    return true;
  }

  const total = await RouletteController.getAllBalance();

  const title = 'BankRoll:';
  const embed = Util.embedConstructor(title, (parseFloat(botBalance) - total)+' HLS');
  await message.channel.send(embed);
};

exports.info = {
  alias: ['rbankroll', 'rbr'],
};

