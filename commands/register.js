
const userInfoController = require('../controllers/userinfo.controller');
const MessageUtil = require('../util/Discord/message');
const Util = require('../util/util');

/**
   * register
   * @date 2020-09-01
   * @param {any} msg
   * @return {any}
   */
exports.execute = async (msg) => {
  try {
    // console.log( 'msg guild id: ' + msg.guild + ' msg author id: ' + msg.author.id );
    const isDm = Util.isDmChannel( msg.channel.type );
    if ( isDm ) {
      const userInfo = await userInfoController.generateUserWallet( msg.author.id );
      if ( userInfo ) {
        await msg.author.send( MessageUtil.msgEmbed('Generate account', 'Your wallet is: '+ '`'+userInfo.account.address+'`') );
      } else {
        msg.author.send('You already have a wallet, please use the `wallet` command to know it.');
      }
    } else {
      msg.delete( msg );
      msg.author.send( msgs.direct_message + ' (`' + msg.content + '`)' );
    }
  } catch (error) {
    logger.error( error );
  }
};

exports.info = {
  alias: ['register'],
};
