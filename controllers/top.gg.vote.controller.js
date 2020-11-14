const conf = require('../config.js').jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
require('dotenv').config();
const envConfig = process.env;
const TopGgVoteDao = require('../dao/top.gg.vote.dao');
const TOPGGVOTEDAO = new TopGgVoteDao();
const UserInfoController = require('../controllers/userinfo.controller');
const USERINFO = new UserInfoController();
const moment = require("moment");
const TransactionQueueController = require('../controllers/transaction.queue.controller');
const transactionQueueController = new TransactionQueueController();
const SendTransaction = require('../entities/SendTransactions');
const Helios = require('../middleware/helios');
const HELIOS = new Helios();
const Discord = require('discord.js');

class TopGgVoteController {
    constructor(){}

    async faucet( user_discord_id ) {
        try {
            let getUserReceive = await USERINFO.getUser( user_discord_id );
            if ( !getUserReceive ) {
              await USERINFO.generateUserWallet( user_discord_id );
              getUserReceive = await USERINFO.getUser( user_discord_id );
            }
            let topGgVoteUser = await TOPGGVOTEDAO.findByUserDiscordId( getUserReceive.user_discord_id );
            if( topGgVoteUser ) {
                topGgVoteUser.vote_count += 1;
                topGgVoteUser.last_date_vote = moment().toDate();
                await TOPGGVOTEDAO.update(topGgVoteUser.dataValues);
            } else {
                const createTopGg = {user_discord_id: getUserReceive.user_discord_id, user_info_id: getUserReceive.id, vote_count: 1, last_date_vote: moment().toDate() };
                await TOPGGVOTEDAO.create(createTopGg);
            }
            const botData = await USERINFO.getUser( envConfig.COLOSSUS_ID_BOT );
            let amountFaucet = await HELIOS.getBalance( envConfig.FAUCETWALLET );
            amountFaucet = amountFaucet * parseInt(envConfig.PERCENTFAUCET) / 100;
            // transaction object
            const tx = [];
            const transactionEntitie = new SendTransaction();
            transactionEntitie.from = envConfig.FAUCETWALLET;
            transactionEntitie.to = getUserReceive.wallet;
            transactionEntitie.user_id_receive = getUserReceive.id;
            transactionEntitie.user_discord_id_receive = getUserReceive.user_discord_id;
            transactionEntitie.user_id_send = botData.id;
            transactionEntitie.user_discord_id_send = botData.user_discord_id;
            transactionEntitie.gasPrice = await HELIOS.toWei(String(await HELIOS.getGasPrice()));
            transactionEntitie.gas = envConfig.GAS;
            transactionEntitie.value = await HELIOS.toWeiEther((String(amountFaucet)));
            transactionEntitie.keystore_wallet = envConfig.FAUCETKEYSTORE;
            transactionEntitie.helios_amount = amountFaucet;
            tx.push( transactionEntitie );
            await transactionQueueController.create( tx, {id: 0, channel:{id:0}}, false, false, false, true);
        } catch (error) {
            logger.error( error );
        }
    }

    async findTopTen( msg ){
        try {
            const topTen = await TOPGGVOTEDAO.findTopTen();
            let exampleEmbed = new Discord.RichEmbed()
              .setColor('#e6d46a')
              .setTitle('Top gg ranking')
            let description = '';
            let i = 0;
            if ( topTen.length ) {
                for( let user of topTen) {
                    const fetchUser = await global.client.fetchUser( user.user_discord_id, false );
                    description += `${i+=1} - ${fetchUser}     ${user.vote_count} votes \n`;
                }
            }
            exampleEmbed.setDescription( description )
            msg.channel.send(exampleEmbed);
        } catch (error) {
            logger.error( error ); 
        }
    }
}

module.exports = TopGgVoteController;