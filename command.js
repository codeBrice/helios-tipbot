require('dotenv').config();
const Account = require('./cogs/account');
const ACCOUNT = new Account();
const Tip = require('./cogs/tip');
const TIP = new Tip();
const envConfig = process.env;
const Rain = require('./cogs/rain');
const RAIN = new Rain();
const MessageUtil = require('./util/Discord/message');
const MESSAGEUTIL = new MessageUtil();
const Coingecko = require('./middleware/coingecko');
const COINGECKO = new Coingecko();
const roulette = require('./cogs/roulette');
const Util = require('./util/util');

/**
   * All Command Class
   * @date 2020-09-01
   */
class Command {
  /**
   * 描述
   * @date 2020-09-01
   * @param {any} msg
   * @return {any}
   */
  async onMessage( msg ) {
    if ( msg.content.substring(0, 1) == envConfig.ALIASCOMMAND ) {
      if (Util.rolesValidator(msg, envConfig.ADMIN_ROLES)) return;

      const maintenance = await new Promise( ( resolve, reject ) => {
        return global.clientRedis.get('maintenance', async function(err, receive) {
          resolve(receive);
        });
      });

      if (maintenance && global.ctx.args[0] != 'unfreeze') {
        MESSAGEUTIL.reaction_fail( msg );
        return;
      }

      switch ( global.ctx.args[0] ) {
        case 'register':
          await ACCOUNT.generateAccount( msg );
          break;
        case 't':
        case 'thls':
        case 'tip':
          await TIP.tip( msg, false );
          break;
        case 'tipsplit':
        case 'tsplit':
        case 'ts':
          await TIP.tip( msg, true );
          break;
        case 'privatekey':
          await ACCOUNT.getPrivateKey( msg );
          break;
        case 'balance':
        case 'b':
        case 'bal':
        case '$':
          await ACCOUNT.getBalance( msg );
          break;
        case 'wallet':
          await ACCOUNT.getWallet( msg);
          break;
        case 'withdraw':
          await ACCOUNT.withdraw( msg );
          break;
        case 'rain':
          await RAIN.rain( msg );
          break;
        case 'help':
          await msg.author.send( MESSAGEUTIL.msg_embed_help() );
          MESSAGEUTIL.reaction_dm( msg );
          break;
        case 'price':
          await COINGECKO.price( msg );
          break;
        case 'rt':
        case 'rthls':
        case 'rtip':
          await TIP.tip( msg, false, true );
          break;
        case 'rbalance':
        case 'rb':
        case 'rbal':
        case 'r$':
          await roulette.getRouletteBalance( msg );
          break;
        case 'rwithdraw':
          await roulette.withdrawRoulette( msg );
          break;
        case 'sg':
        case 'sr':
        case 'sb':
          roulette.execute(msg);
          break;
        case 'rhelp':
          await msg.author.send( MESSAGEUTIL.roulette_msg_embed_help() );
          MESSAGEUTIL.reaction_dm( msg );
          break;
        case 'rlastwin':
        case 'rlw':
          roulette.lastWins(msg);
          break;
        case 'rbankroll':
        case 'rbr':
          roulette.bankroll(msg);
          break;
        case 'freeze':
          if (maintenance) return;
          Util.maintenance(msg);
        case 'unfreeze':
          if (maintenance == null) return;
          Util.maintenance(msg);
          break;
        default:
          break;
      }
    } else {
      RAIN.update_activity_user( msg );
    }
  }
}
module.exports = Command;
