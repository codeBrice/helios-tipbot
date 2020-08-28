const Discord = require('discord.js');
const Util = require('../util/util');
const msgs = require('../util/msg.json');
const conf = require('../config.js').jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();

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

    // Amount Validate
    if (Util.amountValidator(amount, message, msgs.invalid_command+
      `${global.client.config.PREFIX}sr 10`)) return;

    // Balance validate
    if (await Util.balanceValidator(amount, message, msgs.insufficient_balance+
      ', remember to have enough gas for the transaction.')) return;

    const numberRoulette = Math.floor(Math.random() * (14 - 0)) + 0;
    console.log('--> Rolled ' + numberRoulette + ' in roulette');
    const initialText = '⬛🟥⬛🟥🟩⬛🟥⬛🟥';
    const title = 'Roulette #0000';
    let lastText;
    let wonText;
    // Start message
    let embed = embedConstructor(title, top + '\n' + initialText);
    const msg = await message.channel.send(embed);

    // Travel message
    for (let i = 0; i <= 14; i++) {
      lastText = editRoulette(msg, i, title);
      if (numberRoulette == i+1) break;
    }

    // Wom message
    if (command === color(numberRoulette, 'sg', 'sr', 'sb')) {
      wonText = message.author.username + ' won '.concat(
                  (command !== 'sg') ? String(amount*2) : String(amount*5) +
                  ' HLS');

      // won logic
    } else {
      wonText = 'No Wom :(';
    }
    embed = embedConstructor(title, top+'\n'+lastText+'\n\n'+
              color(numberRoulette, green, red, black)+' '+
              color(numberRoulette, 'Green', 'Red', 'Black')+
              ' WON!!!' + '\n\n' +
              wonText);
    msg.edit(embed);
  } catch (error) {
    console.log(error);
  }
};


/**
 * Create the roulette from your current position
 * @date 2020-08-27
 * @param {Message} msg
 * @param {number} i
 * @param {string} title
 * @return {string}
 */
function editRoulette(msg, i, title) {
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
    msg.edit(embed);
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
