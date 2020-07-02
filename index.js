require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const envConfig = process.env;
const UserInfoController = require("./controllers/userinfo.controller");
const userInfoController = new UserInfoController();
const conf = require("./config.js").jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const Util = require('./util/util');
const UTIL = new Util();
const msgs = require('./util/msg.json');
const DiscordContext = require('discord-context');
/* const redis = require("redis");
const clientRedis = redis.createClient();

clientRedis.on("connect", function() {
    console.log("You are now connected on Redis DB");
}); */

client.on('ready', () => {
    console.log( `Bot is ready as: ${client.user.tag}!` );
    client.user.setStatus('dnd');
});

client.on('message', msg => {
    const ctx = new DiscordContext(msg);
    console.log( 'command ' + ctx.command );
    console.log( 'argumentos ' + ctx.args) // ["ban", "@username#3354"]
    console.log( 'message ' + ctx.message) // Discord.Message object
    console.log( ' menciones ' + ctx.mentions)
    console.log( ' command name ' + ctx.command.name)
    if (msg.content === '.register') {
        try {
            console.log( 'msg guild id: ' + msg.guild.id + ' msg author id: ' + msg.author.id );
            //console.log(ctx.command);
            const channelType = UTIL.isDmChannel( msg.channel.type );
            if ( channelType ){
                const userInfo = new Promise((resolve, reject) => {
                    const generateWallet = userInfoController.generateUserWallet( msg.author.id );
                    resolve ( generateWallet );
                });
                userInfo.then( userInfo => {
                    if ( userInfo )
                        msg.author.send( 'Your wallet is: '+ '`'+userInfo.account.address+'`');
                    else 
                        msg.author.send('You already have a wallet, please use the `.wallet` command to know it.')
                }).catch( error => {
                    logger.error( error );
                });
            } else {
                msg.delete( msg );
                msg.author.send( msgs.direct_message + ' (`' + msg.content + '`)' );
            }
        } catch (error) {
            logger.error( error );
        }
    }
});

//token discord bot here
client.login(envConfig.TOKENBOT);