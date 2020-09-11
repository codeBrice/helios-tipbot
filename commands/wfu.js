const Util = require('../util/util');
const wallet = require('./wallet');

/**
   * wfu
   * @date 2020-09-01
   * @param {any} msg
   */
exports.execute = async (msg) => {
  if (Util.rolesValidator(msg, envConfig.MOD_ROLES) || Util.channelValidator(msg, envConfig.ONLY_CHANNELS_WFU)) return;
  await wallet.execute( msg, true, global.ctx.args[1] );
};

exports.info = {
  alias: ['wfu'],
};

