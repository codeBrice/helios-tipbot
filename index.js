require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const envConfig = process.env;
const conf = require("./config.js").jsonConfig();

privateSetDBConections();

client.on('ready', () => {
    console.log( `Bot is ready as: ${client.user.tag}!` );
    client.user.setStatus('dnd');
});

client.on('message', msg => {
    if (msg.content === '.ping') {
        msg.reply('Pong!');
    }
    if (msg.content === '.avatar') {
        // Send the user's avatar URL
        msg.reply(msg.author.avatarURL);
    }
});

function privateSetDBConections() {
    return new Promise(function (resolve, reject) {
        global.connHeliosTipBot = require(conf.pathDBconnetion).fnConnection("db_helios_tipbot");

        if ( global.connHeliosTipBot == null ) return reject(new Error("Error en conexiones de base de datos."));

        resolve(true);
    });
}

//token discord bot here
client.login(envConfig.TOKENBOT);