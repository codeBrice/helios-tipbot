const UserInfoController = require('../controllers/userinfo.controller');
const Util = require('../util/util');
const MessageUtil = require('../util/Discord/message');
const msgs = require('../util/msg.json');
const conf = require('../config.js').jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();

/**
   * privatekey
   * @date 2020-09-01
   * @param {any} msg
   * @return {any}
   */
exports.execute = async (msg) => {
  try {
    // console.log( 'msg guild id: ' + msg.guild + ' msg author id: ' + msg.author.id );
    const isDm = Util.isDmChannel( msg.channel.type );
    if ( isDm ) {
      const userInfoPrivateKey = await UserInfoController.getPrivateKey( msg.author.id );
      if ( userInfoPrivateKey ) {
        await msg.author.send( MessageUtil.msgEmbed( 'Private key', 'Your private key is: '+ '`'+ userInfoPrivateKey +'`'));
      } else {
        await msg.author.send('You dont have a account.');
      };
    } else {
      msg.delete( msg );
      msg.author.send( msgs.direct_message + ' (`' + msg.content + '`)' );
    }
  } catch (error) {
    logger.error( error );
  }
};

exports.info = {
  alias: ['privatekey'],
};

