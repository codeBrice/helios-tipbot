const MessageUtil = require('../util/Discord/message');

/**
   * help
   * @date 2020-09-01
   * @param {any} msg
   * @return {any}
   */
exports.execute = async (msg) => {
  await msg.author.send( MessageUtil.msgEmbedHelp() );
  MessageUtil.reactionDm( msg );
};

exports.info = {
  alias: ['help'],
};

