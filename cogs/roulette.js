const Util = require('../util/util');
const msgs = require('../util/msg.json');
const conf = require('../config.js').jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const RouletteController = require('../controllers/roulette.controller');
const RouletteHisController = require('../controllers/roulette.historic.controller');
const MessageUtil = require('../util/Discord/message');
const RouletteUser = require('../entities/RouletteUser');
const UserInfoController = require('../controllers/userinfo.controller');
const SendTransaction = require('../entities/SendTransactions');
const Helios = require('../middleware/helios');
const TransactionQueueController = require('../controllers/transaction.queue.controller');
const TransactionController = require('../controllers/transactions.controller');

const transactionController = new TransactionController();
const messageUtil = new MessageUtil();
const envConfig = process.env;
const transactionQueueController = new TransactionQueueController();
const userInfo = new UserInfoController();
const helios = new Helios();

const red = '🟥';
const black = '⬛';
const green = '🟩';
const top = '➖➖➖➖🔶➖➖➖➖';
const initialText = '⬛🟥⬛🟥🟩⬛🟥⬛🟥';
const dice = '🎲';
const cash = '💰';

/**
 * Method start roulette
 * @date 2020-08-28
 * @param {Message} message
 * @return {any}
 */
exports.execute = async (message) => {
  try {
    const amount = parseFloat( global.ctx.args[1] );
    const command = global.ctx.args[0];

    logger.info('Start roulette');
    // channel correct
    const channels = JSON.parse(envConfig.ONLY_CHANNELS_ROULETTE);
    if (Util.channelValidator(message, channels)) return;

    // min max validates
    if (minMaxValidatorRoulette(amount, message)) return;

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
        const bets = JSON.stringify(roulette);
        global.clientRedis.set('roulette'+message.guild.id, bets);
        await message.react(dice);
        global.clientRedis.expire('roulette'+message.guild.id, 60);
        // start roulette time
        rouletteInit(message);
      } else {
        const roulette = JSON.parse(redisUser);
        if (roulette.users.filter((x) =>
          x.discordId === String(message.author.id)).length > 0 ||
          roulette.start == true) {
          messageUtil.reaction_fail( message );
          return;
        }
        roulette.users.push(
            new RouletteUser(message.author.id,
                message.author.username, amount, command));

        const bets = JSON.stringify(roulette);
        global.clientRedis.set('roulette'+message.guild.id, bets);
        await message.react(dice);
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
  // await waiting more players
  await Util.wait(parseFloat(envConfig.TIME_BET));
  global.clientRedis.get('roulette'+message.guild.id, async (err, redisUser) => {
    if (redisUser != null) {
      const roulette = JSON.parse(redisUser);
      if (roulette.start == true) {
        messageUtil.reaction_fail( message );
        return;
      }
      roulette.start = true;
      const bets = JSON.stringify(roulette);
      global.clientRedis.set('roulette'+message.guild.id, bets);
      // start rouletteLogic
      await rouletteLogic(message, roulette.users);
      global.clientRedis.del('roulette'+message.guild.id);
      // send comission
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
 * @param {any} bets
 * @return {any}
 */
async function rouletteLogic(message, bets) {
  try {
    const numberRoulette = Math.floor(Math.random() * (15 - 0)) + 0;

    if (await bankrollValidator(bets, message,
        color(numberRoulette, 'sg', 'sr', 'sb'), msgs.roulette_error)) {
      global.clientRedis.del('roulette'+message.guild.id);
      return;
    }

    const idRoulette = await RouletteHisController.init(
        JSON.stringify(bets), numberRoulette, false );

    logger.info('--> Rolled ' + numberRoulette + ' in roulette');
    const title = 'Roulette #'+idRoulette.id;
    let lastText;
    let wonText = '';
    // Start message
    let embed = Util.embedConstructor(title, top + '\n' + initialText);
    // const msg = await message.channel.send(embed);

    // Travel message
    for (let i = 0; i <= 14; i++) {
      lastText = editRoulette(i);
      if (numberRoulette == i+1) break;
    }

    // Wom message
    if (bets.some((user) =>
      user.command === color(numberRoulette, 'sg', 'sr', 'sb'))) {
      logger.info('won roulette');

      for (const user of bets) {
        user.amount = parseFloat(user.amount);

        if (user.command === color(numberRoulette, 'sg', 'sr', 'sb')) {
          const winAmount = winnerAmount(user.command, user.amount);
          wonText += user.userName+' won '.concat(String(winAmount) +' <:HLS:734894854974210182>'+ '\n');

          await rouletteWinner(parseFloat(winAmount) - (user.amount - (2 * user.amount / 100)),
              user.discordId, true);
        } else {
          await rouletteWinner(user.amount, user.discordId, false);
        }
      }
      embed = Util.embedConstructor(title, top+'\n'+lastText+'\n\n'+
        color(numberRoulette, green, red, black)+' '+
        color(numberRoulette, 'Green', 'Red', 'Black')+
                ' WON!!!' + '\n\n' +
                wonText);
    } else {
      logger.info('no wom roulette');
      wonText = 'No winners, better luck next time :(';
      for (const user of bets) {
        user.amount = parseFloat(user.amount);
        await rouletteWinner(user.amount, user.discordId, false);
      }

      embed = Util.embedConstructor(title, top+'\n'+lastText+'\n\n'+
        color(numberRoulette, green, red, black)+' '+
        color(numberRoulette, 'Green', 'Red', 'Black')+
                ' WON!!!' + '\n\n' +
                wonText);
    }

    await RouletteHisController.updateHistoric(idRoulette.id, true);

    // await msg.edit(embed);
    await message.channel.send(embed);
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
 * @param {number} i
 * @return {string}
 */
function editRoulette(i) {
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
    // const embed = embedConstructor(title, top + '\n' + text);
    logger.info(text);
    // await msg.edit(embed);
    return text;
  } catch (error) {
    logger.error(error);
  }
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
   * winnerAmount
   * @date 2020-09-07
   * @param {any} command
   * @param {any} amount
   * @return {any}
   */
function winnerAmount(command, amount) {
  const amountLess = amount - (2 * amount / 100);
  return (command !== 'sg') ? amountLess + amount : amount*14 - amount + amountLess;
}

/**
   * bankroll Validator
   * @date 2020-09-06
   * @param {any} bets
   * @param {any} message
   * @param {any} win
   * @param {any} text
   * @return {any}
   */
async function bankrollValidator( bets, message, win, text ) {
  logger.info('start bankroll Validator');
  const botBalance = await userInfo.getBalance( message.client.user.id );

  if ( !botBalance ) {
    await userInfo.generateUserWallet( message.client.user.id );
    message.channel.send(text);
    return true;
  }

  let sum = 0;
  for (const bet of bets) {
    if (bet.command === win) {
      sum += winnerAmount(bet.command, bet.amount) - bet.amount;
    }
  }

  const total = await RouletteController.getAllBalance();

  if (this.parseFloat(botBalance) - total - sum < 0) {
    message.channel.send(text);
    return true;
  }
  return false;
}

/**
   * min Max Validator
   * @date 2020-09-01
   * @param {any} amount
   * @param {any} msg
   * @return {any}
   */
function minMaxValidatorRoulette( amount, msg ) {
  if ( amount < envConfig.MINTIP_BET ) {
    msg.author.send( msgs.min_tip_roulette + '`(' + `${envConfig.MINTIP_BET }` +' HLS)`');
    messageUtil.reaction_fail( msg );
    return true;
  }
  if ( amount > envConfig.MAXTIP_BET ) {
    msg.author.send( msgs.max_tip_roulette + '`(' + `${envConfig.MAXTIP_BET }` +' HLS)`');
    messageUtil.reaction_fail( msg );
    return true;
  }
  return false;
}


/**
  * lastWins
  * @date 2020-09-07
  * @param {any} message
  * @return {any}
  */
exports.lastWins = async (message) => {
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
 * 描述
 * @date 2020-09-07
 * @param {any} message
 * @param {any} text
 * @return {any}
 */
exports.bankroll = async (message) => {
  logger.info('start bankroll');

  const channels = JSON.parse(envConfig.ONLY_CHANNELS_ROULETTE);
  if (Util.channelValidator(message, channels)) return;

  const botBalance = await userInfo.getBalance( message.client.user.id );
  if ( !botBalance ) {
    await userInfo.generateUserWallet( message.client.user.id );
    return true;
  }

  const total = await RouletteController.getAllBalance();

  const title = 'BankRoll:';
  const embed = Util.embedConstructor(title, (parseFloat(botBalance) - total)+' HLS');
  await message.channel.send(embed);
};


/**
   * getRouletteBalance
   * @date 2020-09-01
   * @param {any} msg
   * @return {any}
   */
exports.getRouletteBalance = async ( msg ) => {
  try {
    logger.info('start getRouletteBalance');
    const user = await userInfo.getUser( msg.author.id );
    if ( !user ) {
      await userInfo.generateUserWallet( msg.author.id );
      msg.author.send( messageUtil.msg_embed('Roulette Balance',
          msgs.balance + 0 + ' HLS') );
      return;
    }
    const userBalance = await RouletteController.getBalance(user.id);
    if ( userBalance != null ) {
      msg.author.send( messageUtil.msg_embed('Roulette Balance',
          msgs.balance + userBalance + ' HLS') );
      const isDm = Util.isDmChannel( msg.channel.type );
      if ( !isDm ) {
        messageUtil.reaction_dm( msg );
      }
    } else {
      msg.author.send( msgs.balance_error );
    }
  } catch (error) {
    logger.error( error );
  }
};

/**
   * withdrawRoulette
   * @date 2020-09-01
   * @param {any} msg
   * @return {any}
   */
exports.withdrawRoulette = async ( msg ) => {
  try {
    logger.info('start withdrawRoulette');
    if ( Util.isDmChannel(msg.channel.type) ) {
      const amount = parseFloat( global.ctx.args[1] );
      // Amount Validate
      if (Util.amountValidator(amount, msg, msgs.invalid_command+
          ` example: ${global.client.config.PREFIX}rwithdraw 10`)) return;

      const amountGas = await userInfo.getGasPriceSumAmount( amount );

      if (await Util.rouletteBalanceValidator(amountGas, msg,
          msgs.amount_gas_error +
            ', remember to have enough gas for the transaction.')) return;

      if (await Util.botBalanceValidator(amountGas, msg,
          msgs.bot_amount_gas_error)) return;

      const userTipIdList = [];
      const botData = await userInfo.getUser( msg.client.user.id );
      userTipIdList.push( {user_discord_id: msg.author.id,
        tag: msg.author.username} );
      // transaction object
      const toUser = await userInfo.getUser( msg.author.id );
      const tx = [];
      const transactionEntitie = new SendTransaction();
      transactionEntitie.from = botData.wallet;
      transactionEntitie.to = toUser.wallet;
      transactionEntitie.gasPrice = await helios.toWei(String(await helios.getGasPrice()));
      transactionEntitie.gas = envConfig.GAS;
      transactionEntitie.value = await helios.toWeiEther((String(amount)));
      transactionEntitie.keystore_wallet = botData.keystore_wallet;
      tx.push( transactionEntitie );
      const getReceive = await new Promise( ( resolve, reject ) => {
        return global.clientRedis.get('receive:'+msg.author.id, async function(err, receive) {
          resolve(receive);
        });
      });
      const getTip = await new Promise( ( resolve, reject ) => {
        return global.clientRedis.get('tip:'+msg.author.id, async function(err, tip) {
          resolve(tip);
        });
      });
      if ( getReceive || getTip) {
        await transactionQueueController.create( tx, msg, false, false);
        messageUtil.reaction_transaction_queue( msg );
        return;
      }
      const sendTx = await transactionController.sendTransaction( tx, botData.keystore_wallet);
      if ( !sendTx.length ) {
        global.clientRedis.set( 'tip:'+msg.author.id, msg.author.id );
        global.clientRedis.expire('tip:'+msg.author.id, 11);
        msg.author.send( msgs.error_withdraw + envConfig.ALIASCOMMAND + 'withdraw 100 0x00000' );
        logger.error( error );
      } else {
        await RouletteController.updateBalance(msg.author.id, amountGas, false);
        msg.author.send(messageUtil.msg_embed('Withdraw process', msgs.withdraw_success));
      }
    } else {
      msg.delete( msg );
      msg.author.send( msgs.direct_message + ' (`rwithdraw`)' );
    }
  } catch (error) {
    logger.error( error );
  }
};
