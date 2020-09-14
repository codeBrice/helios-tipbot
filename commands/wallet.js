const UserInfoController = require('../controllers/userinfo.controller');
const MessageUtil = require('../util/Discord/message');
const msgs = require('../util/msg.json');
const conf = require('../config.js').jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();

/**
 * wallet
 * @date 2020-09-10
 * @param {any} msg
 * @param {any} isWfu=false
 * @param {any} userDiscordId=null
 * @return {any}
 */
exports.execute = async (msg, isWfu = false, userDiscordId = null) => {
  try {
    const userInfoWallet = await UserInfoController.getWallet( ( isWfu ? userDiscordId : msg.author.id ) );
    MessageUtil.reactionDm( msg );
    if ( userInfoWallet ) {
      if ( isWfu ) {
        const fetchUser = await global.client.fetchUser( userDiscordId, false );
        console.log(fetchUser);
        msg.channel.send( MessageUtil.msgEmbed('Wallet for user info',
            'User: '+fetchUser+
         ' \n Wallet: `'+userInfoWallet+'`', false,
            'https://heliosprotocol.io/block-explorer/#main_page-address&'+userInfoWallet, true));
      } else {
        msg.author.send( MessageUtil.msgEmbed('Wallet info', msgs.wallet +'`'+userInfoWallet+'`'));
      }
    } else {
      MessageUtil.reactionFail( msg );
    }
  } catch (error) {
    msg.author.send( msgs.wallet_error);
    MessageUtil.reactionFail( msg );
    logger.error( error );
  }
};

exports.info = {
  alias: ['wallet'],
};

