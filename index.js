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

clientRedis.on("connect", function() {
    logger.info("You are now connected on Redis DB");
});

client.on('ready', () => {
    logger.info(`Bot is ready as: ${client.user.tag}!`);
    client.user.setStatus('online');
});

client.on('message', msg => {
    try {
        const ctx = new DiscordContext(msg);
        if (msg.author.bot)
            return;

        COMMAND.onMessage( ctx, msg , client , clientRedis);
    } catch (error) {
        logger.error( error );
    }
});

//token discord bot here
client.login(envConfig.TOKENBOT);