const Discord = require('discord.js');
const Util = require('../util/util');
const msgs = require('../util/msg.json');
const conf = require('../config.js').jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const RouletteController = require('../controllers/roulette.controller');
const RouletteHisController = require('../controllers/roulette.historic.controller');
const MessageUtil = require('../util/Discord/message');
const RouletteUser = require('../entities/RouletteUser');
const {parseFloat} = require('../util/util');
const MESSAGEUTIL = new MessageUtil();
const envConfig = process.env;

const red = '🟥';
const black = '⬛';
const green = '🟩';
const top = '➖➖➖➖🔶➖➖➖➖';

/**
 * Method start roulette
 * @date 2020-08-28
 * @param {Message} message
 * @return {any}
 */
exports.execute = async (message) => {
  try {
    const amount = Util.parseFloat( global.ctx.args[1] );
    const command = global.ctx.args[0];

    logger.info('Start roulette');
    // channel correct
    const channels = JSON.parse(envConfig.ONLY_CHANNELS_ROULETTE);
    if (Util.channelValidator(message, channels)) return;

    // min max validates
    if (Util.minMaxValidator(amount, message)) return;

    // Amount Validate
    if (Util.amountValidator(amount, message, msgs.invalid_command+
      `${global.client.config.PREFIX}sr 10`)) return;

    // Balance validate
    if (await Util.rouletteBalanceValidator(amount, message,
        msgs.insufficient_balance+
        ', remember deposit in bot. `'+
        global.client.config.PREFIX+'tip 10 @bot`')) return;

    // redis exist
    global.clientRedis.get('roulette'+message.guild.id, async (err, redisUser) => {
      if (redisUser == null) {
        const roulette = {
          'start': false,
          'users': [new RouletteUser(message.author.id,
              message.author.username, amount, command)],
        };
        const discordId = JSON.stringify(roulette);
        global.clientRedis.set('roulette'+message.guild.id, discordId);
        await message.react('🎲');
        global.clientRedis.expire('roulette'+message.guild.id, 60);
        rouletteInit(message);
      } else {
        const roulette = JSON.parse(redisUser);
        if (roulette.users.filter((x) =>
          x.discordId === String(message.author.id)).length > 0 ||
          roulette.start == true) {
          MESSAGEUTIL.reaction_fail( message );
          return;
        }
        roulette.users.push(
            new RouletteUser(message.author.id,
                message.author.username, amount, command));

        const discordIds = JSON.stringify(roulette);
        global.clientRedis.set('roulette'+message.guild.id, discordIds);
        await message.react('🎲');
      }
    });
  } catch (error) {
    console.log(error);
  }
};

/**
 * rouletteInit
 * @date 2020-09-01
 * @param {Message} message
 */
async function rouletteInit(message) {
  await Util.wait(Util.parseFloat(envConfig.TIME_BET));
  global.clientRedis.get('roulette'+message.guild.id, async (err, redisUser) => {
    if (redisUser != null) {
      const roulette = JSON.parse(redisUser);
      if (roulette.start == true) {
        MESSAGEUTIL.reaction_fail( message );
        return;
      }
      roulette.start = true;
      const discordId = JSON.stringify(roulette);
      global.clientRedis.set('roulette'+message.guild.id, discordId);
      await rouletteLogic(message, roulette.users);
      global.clientRedis.del('roulette'+message.guild.id);
    } else {
      await message.channel.send('Error');
      global.clientRedis.del('roulette'+message.guild.id);
    }
  });
}

/**
 * rouletteLogic
 * @date 2020-09-04
 * @param {any} message
 * @param {any} usersRoulette
 * @return {any}
 */
async function rouletteLogic(message, usersRoulette) {
  try {
    const numberRoulette = Math.floor(Math.random() * (14 - 0)) + 0;
    const idRoulette = await RouletteHisController.init(
        JSON.stringify(usersRoulette), numberRoulette, false );

    logger.info('--> Rolled ' + numberRoulette + ' in roulette');
    const initialText = '⬛🟥⬛🟥🟩⬛🟥⬛🟥';
    const title = 'Roulette #'+idRoulette.id;
    let lastText;
    let wonText = '';
    // Start message
    let embed = embedConstructor(title, top + '\n' + initialText);
    const msg = await message.channel.send(embed);

    // Travel message
    for (let i = 0; i <= 14; i++) {
      lastText = await editRoulette(msg, i, title);
      await Util.wait(800);
      if (numberRoulette == i+1) break;
    }

    // Wom message

    if (usersRoulette.some((user) =>
      user.command === color(numberRoulette, 'sg', 'sr', 'sb'))) {
      logger.info('won roulette');

      for (const user of usersRoulette) {
        user.amount = Util.parseFloat(user.amount);

        if (user.command === color(numberRoulette, 'sg', 'sr', 'sb')) {
          const winnerAmount = (user.command !== 'sg') ?
          String(user.amount*2) : String(user.amount*14);

          wonText += '💰'+user.userName+' won '.concat(winnerAmount +' HLS'+ '\n');

          await rouletteWinner(parseFloat(winnerAmount) - user.amount,
              user.discordId, true);
        } else {
          await rouletteWinner(user.amount, user.discordId, false);
        }
      }
      embed = embedConstructor(title, top+'\n'+lastText+'\n\n'+
                color(numberRoulette, green, red, black)+' '+
                color(numberRoulette, 'Green', 'Red', 'Black')+
                ' WON!!!' + '\n\n' +
                wonText);
    } else {
      logger.info('no wom roulette');
      wonText = 'No winners, better luck next time :(';
      for (const user of usersRoulette) {
        user.amount = Util.parseFloat(user.amount);
        await rouletteWinner(user.amount, user.discordId, false);
      }

      embed = embedConstructor(title, top+'\n'+lastText+'\n\n'+
                color(numberRoulette, green, red, black)+' '+
                color(numberRoulette, 'Green', 'Red', 'Black')+
                ' WON!!!' + '\n\n' +
                wonText);
    }

    await RouletteHisController.updateHistoric(idRoulette.id, true);

    await msg.edit(embed);
    logger.info('finish roulette');
  } catch (error) {
    await message.channel.send('Error');
    global.clientRedis.del('roulette'+message.guild.id);
    logger.error(error);
  }
}

/**
 * Create the roulette from your current position
 * @date 2020-08-27
 * @param {Message} msg
 * @param {number} i
 * @param {string} title
 * @return {string}
 */
async function editRoulette(msg, i, title) {
  try {
    let text = '';
    let init;
    if (i-3 > 0) init = i-3;
    if (i-3 <= 0) init = 15 - Math.abs(i-3);
    for (let y = 0; y < 9; y++) {
      if (init > 14) init = 0;
      text += color(init, green, red, black);
      init++;
    }
    const embed = embedConstructor(title, top + '\n' + text);
    logger.info(text);
    await msg.edit(embed);
    return text;
  } catch (error) {
    logger.error(error);
  }
}


/**
 * create a Discord Rich Embed
 * @date 2020-08-27
 * @param {string} title
 * @param {string} msg
 * @return {RichEmbed}
 */
function embedConstructor(title, msg) {
  return new Discord.RichEmbed()
      .setColor(9955331)
      .setTitle(title)
      .setDescription(msg);
}


/**
 * Color logic
 * @date 2020-08-27
 * @param {number} number
 * @param {any} g
 * @param {any} r
 * @param {any} b
 * @return {any}
 */
function color(number, g, r, b) {
  return (number === 0) ? g : (number % 2 === 0) ? r : b;
}

/**
 * roulette Winner
 * @date 2020-09-01
 * @param {any} amount
 * @param {any} userId
 * @param {any} isWinner
 * @return {any}
 */
async function rouletteWinner( amount, userId, isWinner ) {
  return await RouletteController.updateBalance(userId, amount, isWinner);
}
