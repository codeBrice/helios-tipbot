const request = require('request');
const conf = require('../config.js').jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const Discord = require('discord.js');

/**
   * price
   * @date 2020-09-01
   * @param {any} msg
   * @return {any}
   */
exports.execute = async (msg) => {
  try {
    request('https://api.coingecko.com/api/v3/coins/helios-protocol', {json: true}, (error, body) => {
      if (error) {
        logger.error(error);
      } else {
        if (body.body) {
          const coingeckoInfo = body.body;
          const exampleEmbed = new Discord.RichEmbed()
              .setColor('#e6d46a')
              .setTitle('Helios Protocol | HLS')
              .setDescription('')
              .setDescription('```BTC       :    ' + coingeckoInfo.market_data.current_price.btc.toFixed(8) +
                      '                                          \n' +
                      'ETH       :    ' + coingeckoInfo.market_data.current_price.eth.toFixed(8) + '\n' +
                      'USD       :    ' + coingeckoInfo.market_data.current_price.usd.toFixed(8) +'\n \n'+
                      'Mkt Cap   :    $' + coingeckoInfo.market_data.market_cap.usd.toFixed(2) + '\n' +
                      'Supply    :    ' + new Intl.NumberFormat().format(coingeckoInfo.market_data.total_supply) + '\n' +
                      'Volume    :    $' + coingeckoInfo.market_data.total_volume.usd.toFixed(8) + '\n \n' +
                      '24hr %    :    ' + coingeckoInfo.market_data.price_change_percentage_24h.toFixed(2) + '%\n' +
                      '7d %      :    ' + coingeckoInfo.market_data.price_change_percentage_7d.toFixed(2) + '%\n' +
                      '30d %     :    ' + coingeckoInfo.market_data.price_change_percentage_30d.toFixed(2) + '%\n' +
                      '1y %      :    ' + coingeckoInfo.market_data.price_change_percentage_1y.toFixed(2) + '%'+
                      '```')
              .setThumbnail(coingeckoInfo.image.large)
              .setFooter('Data provided by coingecko.com');
          msg.channel.send(exampleEmbed);
        }
      }
    });
  } catch ( error ) {
    logger.error( error );
  }
};

exports.info = {
  alias: ['price'],
};

