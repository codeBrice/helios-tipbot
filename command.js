require('dotenv').config();
const DiscordContext = require('discord-context');
const Account = require('./cogs/account');
const ACCOUNT = new Account();
const Tip = require('./cogs/tip');
const TIP = new Tip();
const envConfig = process.env;

class Command {
    async onMessage( ctx, msg , client , clientRedis) {
        if ( msg.content.substring(0,1) == envConfig.ALIASCOMMAND ){
            switch ( ctx.args[0] ) {
                case 'register':
                    ACCOUNT.generateAccount( msg );
                    break;
                case 't':
                case 'thls':
                case 'tip':
                    TIP.tip( ctx , msg , false, client, clientRedis);
                    break;
                case 'tipsplit':
                case 'tsplit':
                case 'ts':
                    TIP.tip( ctx , msg , true , client, clientRedis);
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
                    ACCOUNT.withdraw( ctx , msg );
                    break;
                default:
                    break;
            }
        }
    }
}
module.exports = Command;