const request = require("request");
const conf = require("../config.js").jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const Discord = require('discord.js');

class Prices{
    constructor(){};

    async price( msg ){
        try {
            let hlsBtcData;
            let hlsEthData;
            let hlsUsdtData;
            let coingeckoInfo;
            coingeckoInfo = await new Promise( ( resolve, reject ) => {
                request('https://api.coingecko.com/api/v3/coins/helios-protocol', { json: true }, (error, body) => {
                if (error) {
                    logger.error(error);
                } else {
                    resolve(coingeckoInfo  = body.body);
                }
                });
            });
            hlsBtcData = await new Promise( ( resolve, reject ) => {
                request('https://api.atomars.com/v1/public/ticker?pair=HLSBTC', { json: true }, (error, body) => {
                if (error) {
                    logger.error(error);
                } else {
                    resolve( body.body.data );
                }
                });
            });
            hlsEthData = await new Promise( ( resolve, reject ) => {
                request('https://api.atomars.com/v1/public/ticker?pair=HLSETH', { json: true }, (error, body) => {
                if (error) {
                    logger.error(error);
                } else {
                    resolve( body.body.data );
                }
                });
            });
            hlsUsdtData = await new Promise( ( resolve, reject ) => {
                request('https://api.atomars.com/v1/public/ticker?pair=HLSUSDT', { json: true }, (error, body) => {
                if (error) {
                    logger.error(error);
                } else {
                    resolve( body.body.data );
                }
                });
            });
            const exampleEmbed = new Discord.RichEmbed()
            .setColor('#e6d46a')
            .setTitle('Helios Protocol <:HLS:734894854974210182>')
            .setDescription('')
            .setDescription('<:btc:758741958490980463>           ' + hlsBtcData.last + 
            '                                          \n' +
            '<:ether:758743689588637706>                ' + hlsEthData.last + '\n' +
            '<:usdt:758744340637417472>                ' + hlsUsdtData.last +'\n \n'+
            'Mkt Cap   :    $' + coingeckoInfo.market_data.market_cap.usd.toFixed(2) + '\n' +
            'Supply    :    ' + new Intl.NumberFormat().format(coingeckoInfo.market_data.total_supply) + '\n' +
            'Volume    :    $' + coingeckoInfo.market_data.total_volume.usd.toFixed(8) + '\n \n' +
            '24hr %    :    ' + coingeckoInfo.market_data.price_change_percentage_24h.toFixed(2) + '%\n' +
            '7d %      :    ' + coingeckoInfo.market_data.price_change_percentage_7d.toFixed(2) + '%\n' +
            '30d %     :    ' + coingeckoInfo.market_data.price_change_percentage_30d.toFixed(2) + '%\n' +
            '1y %      :    ' + coingeckoInfo.market_data.price_change_percentage_1y.toFixed(2) + '%'
            +'')
            .setThumbnail(coingeckoInfo.image.large)
            .setFooter('Data provided by atomars.com');
            msg.channel.send(exampleEmbed); 
        } catch ( error ) {
            logger.error( error );
        }
    }
}
module.exports = Prices;