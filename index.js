require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const envConfig = process.env;
const conf = require('./config.js').jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const DiscordContext = require('discord-context');
const redis = require('redis');
const clientRedis = redis.createClient();
const cron = require('./cron/cron.js');
const rain = require('./commands/rain');
const fs = require('fs');

global.client = client;
global.clientRedis = clientRedis;
global.client.config = {
  PREFIX: envConfig.ALIASCOMMAND,
};

cron.fnRunCrons();

clientRedis.on('connect', function() {
  logger.info('You are now connected on Redis DB');
});

client.on('ready', () => {
  logger.info(`Bot is ready as: ${client.user.tag}!`);
  client.user.setStatus('online');
  client.user.setGame('Type '+envConfig.ALIASCOMMAND+'help to use the bot!!!');
});

// add all commands
client.commands = [];
fs.readdir('./commands/', function(err, files) {
  files.forEach((f) => {
    const cmd = require(`./commands/${f}`);
    client.commands.push(cmd);
  });
});


// let other files access commands
exports.commands = () => {
  return client.commands;
};

client.on('message', async (msg) => {
  try {
    global.ctx = new DiscordContext(msg);
    if (msg.author.bot) {
      return;
    }
    if ( msg.content.substring(0, 1) == envConfig.ALIASCOMMAND ) {
      const maintenance = await new Promise( ( resolve, reject ) => {
        return global.clientRedis.get('maintenance', async function(err, receive) {
          resolve(receive);
        });
      });

      if (maintenance && global.ctx.args[0] != 'unfreeze') {
        MESSAGEUTIL.reactionFail( msg );
        return;
      }

      client.commands.forEach((command) => {
        if (command.info.alias.includes(global.ctx.args[0])) {
          command.execute(msg);
        }
      });
    } else {
      rain.updateActivityUser( msg );
    }
  } catch (error) {
    logger.error( error );
  }
});
// token discord bot here
client.login(envConfig.TOKENBOT);
