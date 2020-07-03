require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const envConfig = process.env;
const conf = require("./config.js").jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const DiscordContext = require('discord-context');
const Command = require('./command');
const COMMAND = new Command();
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
    console.log( msg );
    COMMAND.onMessage( ctx, msg );
});

//token discord bot here
client.login(envConfig.TOKENBOT);