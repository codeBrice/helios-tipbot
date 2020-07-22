require('dotenv').config();
const DiscordContext = require('discord-context');
const Account = require('./cogs/account');
const ACCOUNT = new Account();
const Tip = require('./cogs/tip');
const TIP = new Tip();
const envConfig = process.env;
const Rain = require('./cogs/rain');
const RAIN = new Rain();
const MessageUtil = require('./util/Discord/Message');
const MESSAGEUTIL = new MessageUtil();

class Command {
    async onMessage( msg ) {
        if ( msg.content.substring(0,1) == envConfig.ALIASCOMMAND ){
            switch ( global.ctx.args[0] ) {
                case 'register':
                    ACCOUNT.generateAccount( msg );
                    break;
                case 't':
                case 'thls':
                case 'tip':
                    TIP.tip( msg , false );
                    break;
                case 'tipsplit':
                case 'tsplit':
                case 'ts':
                    TIP.tip( msg , true );
                    break;
                case 'privatekey':
                    ACCOUNT.getPrivateKey( msg );
                    break;
                case 'balance':
                case 'b':
                case 'bal':
                    ACCOUNT.getBalance( msg );
                    break;
                case 'wallet':
                    ACCOUNT.getWallet( msg);
                    break;
                case 'withdraw':
                    ACCOUNT.withdraw( msg );
                    break;
                case 'rain':
                    RAIN.rain( msg );
                    break;
                case 'help':
                    msg.author.send( MESSAGEUTIL.msg_embed_help() );
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