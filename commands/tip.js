require('dotenv').config();
const envConfig = process.env;
const Util = require('../util/util');
const conf = require('../config.js').jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const msgs = require('../util/msg.json');
const UserInfoController = require('../controllers/userinfo.controller');
const MessageUtil = require('../util/Discord/message');
const Transaction = require('../controllers/transactions.controller');

/**
 * Tip
 * @date 2020-09-10
 * @param {any} msg
 * @param {any} isSplit=false
 * @param {any} isRoulette=false
 * @param {any} isTipAuthor=false
 * @return {any}
 */
exports.execute = async ( msg, isSplit = false, isRoulette = false, isTipAuthor = false ) => {
  try {
    logger.info('start tip isSplit:'+
                isSplit+' isRoulette:'+isRoulette);
    // console.log( ctx.args[2] );
    if (isRoulette) {
      const channels = JSON.parse(envConfig.ONLY_CHANNELS_ROULETTE);
      if (Util.channelValidator(msg, channels)) return;
      if (msg.mentions.users.array().length > 1 ||
                    !msg.mentions.users.has(msg.client.user.id)) {
        await MessageUtil.reactionFail( msg );
        return;
      }
    }

    const isDm = Util.isDmChannel( msg.channel.type );
    if ( isDm ) {
      msg.author.send( msgs.server_message );
    } else {
      let amount = Util.parseFloat( global.ctx.args[1] );
      const userInfoSend = await UserInfoController.getUser( msg.author.id );

      if ( !userInfoSend ) {
        msg.author.send( msgs.not_wallet );
        await MessageUtil.reactionFail( msg );
        return;
      }

      // min max validates
      if ( Util.minMaxValidator( amount, msg ) ) {
        return;
      }

      // Amount Validate
      if ( Util.amountValidator(amount, msg, msgs.invalid_command + ', the helios amount is not numeric.' + msgs.example_tip)) {
        return;
      }

      const getTotalAmountWithGas = await UserInfoController.getGasPriceSumAmount( amount );
      let txs = [];
      if ( getTotalAmountWithGas ) {
        const userInfoAuthorBalance = await UserInfoController.getBalance( msg.author.id );
        if ( userInfoAuthorBalance ) {
          if ( msg.mentions.users.array().length > 0 || isTipAuthor ) {
            if ( !isTipAuthor ) {
              const userTipIdList = [];

              for ( const user of msg.mentions.users.array() ) {
                if ( user.id != msg.author.id && (user.id != msg.client.user.id || isRoulette)) {
                  userTipIdList.push( {user_discord_id: user.id, tag: user.tag} );
                }
              }

              if ( !userTipIdList.length ) {
                return;
              }
              if ( ( isSplit ? getTotalAmountWithGas : getTotalAmountWithGas*userTipIdList.length) >= userInfoAuthorBalance ) {
                msg.author.send( msgs.insufficient_balance + ', remember to have enough gas for the transaction.');
                await MessageUtil.reactionFail( msg );
                return;
              }

              if ( isSplit ) {
                amount = amount / userTipIdList.length;
              }

              // transaction object
              txs = await Util.arrayTransaction( msg, userTipIdList, userInfoSend, amount, true, false );
            } else {
              // tip author
              txs = await Util.arrayTransaction( msg, null, userInfoSend, amount, true, false, true );
            }

            if ( txs.length > 0 ) {
              const transaction = await Transaction.sendTransaction( txs, userInfoSend.keystore_wallet);
              if ( transaction.length > 0 ) {
                await MessageUtil.reactionCompleteTip( msg );
                if ( !isTipAuthor ) {
                  await Util.receiveTx( transaction, msg, amount, false, null, false);
                }
              } else {
                await MessageUtil.reactionTransactionQueue( msg );
                return;
              }
            } else {
              await MessageUtil.reactionTransactionQueue( msg );
              return;
            }
          } else {
            msg.author.send( msgs.invalid_tip_count + ', ' + msgs.example_tip);
            await MessageUtil.reactionFail( msg );
            return;
          }
        } else {
          await msg.author.send( msgs.balance_error );
          await MessageUtil.reactionFail( msg );
          logger.error('Error get the balance with gas on TIP class');
          return;
        }
      } else {
        await msg.author.send( msgs.balance_error );
        await MessageUtil.reactionFail( msg );
        logger.error('Error get the balance with gas on TIP class');
        return;
      };
    }
  } catch (error) {
    if ( error.code != 50007 ) {
      await MessageUtil.reactionFail( msg );
      msg.author.send( msgs.tip_error );
      logger.error( error );
    }
  }
};

exports.info = {
  alias: ['t', 'thls', 'tip'],
};
