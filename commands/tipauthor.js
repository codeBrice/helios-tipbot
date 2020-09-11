const tip = require('./tip');

/**
   * tipauthor
   * @date 2020-09-01
   * @param {any} msg
   */
exports.execute = (msg) => {
  tip.execute( msg, false, false, true );
};

exports.info = {
  alias: ['tipauthor'],
};

