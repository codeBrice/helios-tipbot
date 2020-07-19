const DiscordContext = require('discord-context');
const Discord = require('discord.js');
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
}
module.exports = Message