const Discord = require('discord.js');
require('dotenv').config();
const envConfig = process.env;

/**
     * Message
     * @date 2020-09-10
     */
class MessageUtil {
  /**
     * reaction_fail
     * @date 2020-09-10
     * @param {any} msg
     */
  static reactionFail( msg ) {
    msg.react('❌');
  }

  /**
   * reactionDm
   * @date 2020-09-10
   * @param {any} msg
   */
  static reactionDm( msg ) {
    msg.react('✉️');
  }

  /**
   * reactionCompleteTip
   * @date 2020-09-10
   * @param {any} msg
   * @return {any}
   */
  static async reactionCompleteTip( msg ) {
    /* await msg.react('🇹');
        await msg.react('🇮');
        await msg.react('🇵');
        await msg.react('✅'); */
    await msg.react('💰');
  }

  /**
   * reactionCompleteRain
   * @date 2020-09-10
   * @param {any} msg
   * @return {any}
   */
  static async reactionCompleteRain( msg ) {
    /* await msg.react('🇷');
        await msg.react('🇦');
        await msg.react('🇮');
        await msg.react('🇳');
        await msg.react('💦'); */
    await msg.react('🌧️');
  }

  /**
   * reactionTransactionQueue
   * @date 2020-09-10
   * @param {any} msg
   * @return {any}
   */
  static async reactionTransactionQueue( msg ) {
    await msg.react('🕒');
  }

  /**
   * reactionCompleteWithdrawQueue
   * @date 2020-09-10
   * @param {any} msg
   * @return {any}
   */
  static async reactionCompleteWithdrawQueue( msg ) {
    await msg.react('🇸');
    await msg.react('🇪');
    await msg.react('🇳');
    await msg.react('🇩');
    await msg.react('✅');
  }

  /**
   * maintenanceInit
   * @date 2020-09-10
   * @param {any} msg
   * @return {any}
   */
  static async maintenanceInit( msg ) {
    await msg.react('🤖');
    await msg.react('🚧');
  }

  /**
   * maintenanceFinish
   * @date 2020-09-10
   * @param {any} msg
   * @return {any}
   */
  static async maintenanceFinish( msg ) {
    await msg.react('🤖');
    await msg.react('✅');
  }

  /**
   * msgEmbed
   * @date 2020-09-10
   * @param {any} title
   * @param {any} description
   * @param {any} isTip=false
   * @param {any} url=''
   * @param {any} isWfu=false
   * @return {any}
   */
  static msgEmbed( title, description, isTip = false, url = '', isWfu = false ) {
    // inside a command, event listener, etc.
    const exampleEmbed = new Discord.RichEmbed()
        .setColor('#e6d46a')
        .setTitle(title)
        .setDescription(description);

    if ( isTip ) {
      exampleEmbed.addField('Check transaction in explorer', url);
    }

    if ( isWfu ) {
      exampleEmbed.addField('Check wallet in explorer', url);
    }
    return exampleEmbed;
  }

  /**
   * msgEmbedHelp
   * @date 2020-09-10
   * @return {any}
   */
  static msgEmbedHelp() {
    const exampleEmbed = new Discord.RichEmbed()
        .setColor('#e6d46a')
        .setTitle('Helios TipBot v1.1.0 edition')
        .setDescription('Use '+envConfig.ALIASCOMMAND+'help command for more information about a specific command')
        .addField(envConfig.ALIASCOMMAND+'register ', 'Generate an account wallet.')
        .addField(envConfig.ALIASCOMMAND+'balance '+envConfig.ALIASCOMMAND+'bal '+ envConfig.ALIASCOMMAND+'b ', 'Shows your account balance')
        .addField(envConfig.ALIASCOMMAND+'t '+ envConfig.ALIASCOMMAND+'thls ' + envConfig.ALIASCOMMAND+'tip ', 'Send a tip to mentioned users')
        .addField(envConfig.ALIASCOMMAND+'tipsplit '+ envConfig.ALIASCOMMAND+'ts '+ envConfig.ALIASCOMMAND+'tsplit ', 'Split a tip among mentioned users')
        .addField(envConfig.ALIASCOMMAND+'privatekey ', 'Get your private key wallet')
        .addField(envConfig.ALIASCOMMAND+'wallet ', 'Get your public wallet')
        .addField(envConfig.ALIASCOMMAND+'withdraw ', 'Withdraw HELIOS to an external address')
        .addField(envConfig.ALIASCOMMAND+'rain ', 'Distribute a tip amount amongst active users')
        .addField(envConfig.ALIASCOMMAND+'price ', 'Get Helios price')
        .addField(envConfig.ALIASCOMMAND+'tipauthor ', 'Send a tip to dev wallet.');

    return exampleEmbed;
  }

  /**
   * rouletteMsgEmbedHelp
   * @date 2020-09-10
   * @return {any}
   */
  static rouletteMsgEmbedHelp() {
    const exampleEmbed = new Discord.RichEmbed()
        .setColor('#e6d46a')
        .setTitle('Helios TipBot v1.0.0 roulette edition')
        .setDescription('Use '+envConfig.ALIASCOMMAND+'rhelp command for more information about a specific command')
        .addField(envConfig.ALIASCOMMAND+'rbalance '+envConfig.ALIASCOMMAND+'rbal '+ envConfig.ALIASCOMMAND+'rb ', 'Shows your roulette account balance')
        .addField(envConfig.ALIASCOMMAND+'rt '+ envConfig.ALIASCOMMAND+'rthls ' + envConfig.ALIASCOMMAND+'rtip ', 'tip among mentioned bot Example: '+ envConfig.ALIASCOMMAND+'rtip 1 @'+global.client.user.username)
        .addField(envConfig.ALIASCOMMAND+'rwithdraw ', 'Withdraw HELIOS to main tip address example: '+ envConfig.ALIASCOMMAND+'rwithdraw 100')
        .addField(envConfig.ALIASCOMMAND+'sr ', 'start bet on the color red')
        .addField(envConfig.ALIASCOMMAND+'sb ', 'start bet on the color black')
        .addField(envConfig.ALIASCOMMAND+'sg ', 'start bet on the color green')
        .addField(envConfig.ALIASCOMMAND+'rlastwin '+envConfig.ALIASCOMMAND+'rlw ', 'Shows the last 10 roulettes')
        .addField(envConfig.ALIASCOMMAND+'rbankroll '+envConfig.ALIASCOMMAND+'rbr ', 'Shows BankRoll');
    return exampleEmbed;
  }
}
module.exports = MessageUtil;
