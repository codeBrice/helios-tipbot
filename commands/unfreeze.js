const Util = require('../util/util');

/**
   * unfreeze
   * @date 2020-09-01
   * @param {any} msg
   */
exports.execute = (msg) => {
  if (Util.rolesValidator(msg, envConfig.ADMIN_ROLES)) return;
  if (maintenance == null) return;
  Util.maintenance(msg);
};

exports.info = {
  alias: ['unfreeze'],
};

