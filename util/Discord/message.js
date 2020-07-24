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
        await msg.react('🇹');
        await msg.react('🇮');
        await msg.react('🇵');
        await msg.react('✅');
    }

    async reaction_complete_rain ( msg ) {
        await msg.react('🇷');
        await msg.react('🇦');
        await msg.react('🇮');
        await msg.react('🇳');
        await msg.react('💦');
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

    msg_embed( title, description, isTip = false , url = ''){
        // inside a command, event listener, etc.
        let exampleEmbed = new Discord.RichEmbed()
        .setColor('#e6d46a')
        .setTitle(title)
        .setDescription(description)
        
        if ( isTip ) {
            exampleEmbed.addField('Check transaction in explorer', url);
        }
        return exampleEmbed;
    }

    msg_embed_help() {
        let exampleEmbed = new Discord.RichEmbed()
        .setColor('#e6d46a')
        .setTitle('Helios TipBot v1.0.0 edition')
        .setDescription('Use '+envConfig.ALIASCOMMAND+'help command for more information about a specific command')
        .addField(envConfig.ALIASCOMMAND+'register ', 'Generate an account wallet.')
        .addField(envConfig.ALIASCOMMAND+'balance '+envConfig.ALIASCOMMAND+'bal '+ envConfig.ALIASCOMMAND+'b ', 'Shows your account balance')
        .addField(envConfig.ALIASCOMMAND+'t '+ envConfig.ALIASCOMMAND+'thls ' + envConfig.ALIASCOMMAND+'tip ', 'Send a tip to mentioned users')
        .addField(envConfig.ALIASCOMMAND+'tipsplit '+ envConfig.ALIASCOMMAND+'ts '+ envConfig.ALIASCOMMAND+'tsplit ', 'Split a tip among mentioned users')
        .addField(envConfig.ALIASCOMMAND+'privatekey ', 'Get your private key wallet')
        .addField(envConfig.ALIASCOMMAND+'wallet ', 'Get your public wallet')
        .addField(envConfig.ALIASCOMMAND+'withdraw ', 'Withdraw HELIOS to an external address')
        .addField(envConfig.ALIASCOMMAND+'rain ', 'Distribute a tip amount amongst active users')

        return exampleEmbed;
    }
}
module.exports = Message