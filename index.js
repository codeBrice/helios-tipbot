require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const envConfig = process.env;
const conf = require("./config.js").jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const DiscordContext = require('discord-context');
const Command = require('./command');
const COMMAND = new Command();
const redis = require("redis");
const clientRedis = redis.createClient();
const cron = require('./cron/cron.js').fnRunCrons();

const DBL = require("dblapi.js");
const dbl = new DBL(envConfig.TOPGGTOKEN, client);

// top.gg
dbl.on('posted', () => {
    console.log('Server count posted!');
})
  
dbl.on('error', e => {
    console.log(`Oops! ${e}`);
});

global.client = client;
global.clientRedis = clientRedis;
global.client.config = {
    PREFIX: envConfig.ALIASCOMMAND,
};

clientRedis.on("connect", function() {
    logger.info("You are now connected on Redis DB");
});

client.on('ready', () => {
    logger.info(`Bot is ready as: ${client.user.tag}!`);
    client.user.setStatus('online');
    client.user.setGame('Type '+envConfig.ALIASCOMMAND+'help to use the bot!!!');
});

client.on('message', msg => {
    try {
        global.ctx = new DiscordContext(msg);
        if (msg.author.bot)
            return;
            
        COMMAND.onMessage( msg );
    } catch (error) {
        logger.error( error );
    }
});
//token discord bot here
client.login(envConfig.TOKENBOT);