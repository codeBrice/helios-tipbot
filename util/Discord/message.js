const DiscordContext = require('discord-context');
const Discord = require('discord.js');
require('dotenv').config();
const envConfig = process.env;

class Message {
    reaction_fail( msg ){
        msg.react('❌');
    }
    
    reaction_dm( msg ){
        msg.react('✉️');
    }
    async reaction_complete_tip( msg ) {
        /* await msg.react('🇹');
        await msg.react('🇮');
        await msg.react('🇵');
        await msg.react('✅'); */
        await msg.react('734894854974210182');
        await msg.react('723688924484206703');
    }

    async reaction_complete_rain ( msg ) {
        /* await msg.react('🇷');
        await msg.react('🇦');
        await msg.react('🇮');
        await msg.react('🇳');
        await msg.react('💦'); */
        await msg.react('734894854974210182');
        await msg.react('🌧️');
    }

    async reaction_transaction_queue ( msg ) {
        await msg.react('🕒');
    }

    async reaction_complete_withdraw_queue( msg ) {
        await msg.react('🇸');
        await msg.react('🇪');
        await msg.react('🇳');
        await msg.react('🇩');
        await msg.react('✅');
    }

    async maintenanceInit( msg ) {
        await msg.react('🤖');
        await msg.react('🚧');
    }

    async maintenanceFinish( msg ) {
        await msg.react('🤖');
        await msg.react('✅');
    }

    msg_embed( title, description, isTip = false , url = '', isWfu = false ){
        // inside a command, event listener, etc.
        let exampleEmbed = new Discord.RichEmbed()
        .setColor('#e6d46a')
        .setTitle(title)
        .setDescription(description+' <:HLS:734894854974210182>')
/*         .attachFile('/desarrollo-personal/helios-tipbot/helios.jpg')
        .setImage('attachment://helios.jpg'); */
        
        if ( isTip ) {
            exampleEmbed.addField('Check transaction in explorer', url);
        }

        if ( isWfu ) {
            exampleEmbed.addField('Check wallet in explorer', url);
        }
        return exampleEmbed;
    }

    msg_embed_help() {
        let exampleEmbed = new Discord.RichEmbed()
        .setColor('#e6d46a')
        .setTitle('Colossus v1.1.0 edition')
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
        .addField(envConfig.ALIASCOMMAND+'tipauthor ', 'Send a tip to dev wallet.')

        return exampleEmbed;
    }

    roulette_msg_embed_help() {
        let exampleEmbed = new Discord.RichEmbed()
        .setColor('#e6d46a')
        .setTitle('Colossus v1.0.0 roulette edition')
        .setDescription('Use '+envConfig.ALIASCOMMAND+'rhelp command for more information about a specific command')
        .addField(envConfig.ALIASCOMMAND+'rbalance '+envConfig.ALIASCOMMAND+'rbal '+ envConfig.ALIASCOMMAND+'rb ', 'Shows your roulette account balance')
        .addField(envConfig.ALIASCOMMAND+'rt '+ envConfig.ALIASCOMMAND+'rthls ' + envConfig.ALIASCOMMAND+'rtip ', 'tip among mentioned bot Example: '+ envConfig.ALIASCOMMAND+'rtip 1 @'+global.client.user.username)
        .addField(envConfig.ALIASCOMMAND+'rwithdraw ', 'Withdraw HELIOS to main tip address example: '+ envConfig.ALIASCOMMAND+'rwithdraw 100')
        .addField(envConfig.ALIASCOMMAND+'sr ', 'start bet on the color red')
        .addField(envConfig.ALIASCOMMAND+'sb ', 'start bet on the color black')
        .addField(envConfig.ALIASCOMMAND+'sg ', 'start bet on the color green')
        .addField(envConfig.ALIASCOMMAND+'rlastwin '+envConfig.ALIASCOMMAND+'rlw ', 'Shows the last 10 roulettes')
        .addField(envConfig.ALIASCOMMAND+'rbankroll '+envConfig.ALIASCOMMAND+'rbr ', 'Shows BankRoll')
        return exampleEmbed;
    }
}
module.exports = Message