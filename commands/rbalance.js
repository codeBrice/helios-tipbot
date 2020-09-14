const UserInfoController = require('../controllers/userinfo.controller');
const Util = require('../util/util');
const MessageUtil = require('../util/Discord/message');
const msgs = require('../util/msg.json');
const conf = require('../config.js').jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const RouletteController = require('../controllers/roulette.controller');


/**
   * rbalance
   * @date 2020-09-01
   * @param {any} msg
   * @return {any}
   */
exports.execute = async ( msg ) => {
  try {
    logger.info('start getRouletteBalance');
    const user = await UserInfoController.getUser( msg.author.id );
    if ( !user ) {
      await UserInfoController.generateUserWallet( msg.author.id );
      msg.author.send( MessageUtil.msgEmbed('Roulette Balance',
          msgs.balance + 0 + ' HLS') );
      return;
    }
    const userBalance = await RouletteController.getBalance(user.id);
    if ( userBalance != null ) {
      msg.author.send( MessageUtil.msgEmbed('Roulette Balance',
          msgs.balance + Util.toFixed(userBalance) + ' HLS') );
      const isDm = Util.isDmChannel( msg.channel.type );
      if ( !isDm ) {
        MessageUtil.reactionDm( msg );
      }
    } else {
      msg.author.send( msgs.balance_error );
    }
  } catch (error) {
    logger.error( error );
  }
};

exports.info = {
  alias: ['rbalance', 'rb', 'rbal', 'r$'],
};

