const Util = require('../util/util');

/**
   * freeze
   * @date 2020-09-01
   * @param {any} msg
   */
exports.execute = (msg) => {
  if (Util.rolesValidator(msg, envConfig.ADMIN_ROLES)) return;
  if (maintenance) return;
  Util.maintenance(msg);
};

exports.info = {
  alias: ['freeze'],
};

