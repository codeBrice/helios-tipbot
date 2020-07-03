require('dotenv').config();
const DiscordContext = require('discord-context');
const Account = require('./cogs/account');
const ACCOUNT = new Account();
const Tip = require('./cogs/tip');
const TIP = new Tip();
const envConfig = process.env;

class Command {
    async onMessage( ctx, msg ) {
        if ( msg.content.substring(0,1) == envConfig.ALIASCOMMAND ){
            switch ( ctx.args[0] ) {
                case 'register':
                    ACCOUNT.generateAccount( msg );
                    break;
                case 't':
                case 'thls':
                case 'tip':
                    TIP.tip( ctx , msg );
                    break;
                case 'tipsplit':
                case 'tsplit':
                    TIP.tip( ctx , msg , true );
                    break;
                default:
                    break;
            }
        }
    }
}
module.exports = Command;