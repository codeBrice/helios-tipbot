const MessageUtil = require('../util/Discord/message');

/**
   * rhelp
   * @date 2020-09-01
   * @param {any} msg
   * @return {any}
   */
exports.execute = async (msg) => {
  await msg.author.send( MessageUtil.rouletteMsgEmbedHelp() );
  MessageUtil.reactionDm( msg );
};

exports.info = {
  alias: ['rhelp'],
};

