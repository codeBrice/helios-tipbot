const tip = require('./tip');

/**
   * tipsplit
   * @date 2020-09-01
   * @param {any} msg
   */
exports.execute = (msg) => {
  tip.execute(msg, true);
};

exports.info = {
  alias: ['ts', 'tsplit', 'tipsplit'],
};

