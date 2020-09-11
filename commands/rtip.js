const tip = require('./tip');

/**
   * rtip
   * @date 2020-09-01
   * @param {any} msg
   */
exports.execute = (msg) => {
  tip.execute( msg, false, true);
};

exports.info = {
  alias: ['rt', 'rthls', 'rtip'],
};

