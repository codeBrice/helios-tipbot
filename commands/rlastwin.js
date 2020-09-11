const Util = require('../util/util');
const RouletteHisController = require('../controllers/roulette.historic.controller');
const red = '🟥';
const black = '⬛';
const green = '🟩';

/**
   * rlastwin
   * @date 2020-09-01
   * @param {any} message
   */
exports.execute = async (message) => {
  const list = await RouletteHisController.getLastWins();
  const msg = list.map((currentValue, index, array) => {
    return color(parseFloat(currentValue.winNumber),
        (index+1)+'. '+green+'\n',
        (index+1)+'. '+red+'\n',
        (index+1)+'. '+black+'\n');
  });
  const title = 'Last 10 roll result';
  const embed = Util.embedConstructor(title, msg);
  await message.channel.send(embed);
};

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

exports.info = {
  alias: ['rlastwin', 'rlw'],
};

