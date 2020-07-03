require('dotenv').config();
const envConfig = process.env;
const Util = require('../util/util');
const UTIL = new Util();
const conf = require("../config.js").jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const msgs = require('../util/msg.json');
const UserInfoController = require('../controllers/userinfo.controller');
const USERINFO = new UserInfoController();
const MessageUtil = require('../util/Discord/message');
const MESSAGEUTIL = new MessageUtil();

class Tip {
    async tip( ctx, msg, isSplit = false ){
        try {
            console.log( ctx.args[2] );
            const isDm = UTIL.isDmChannel( msg.channel.type );
            if ( isDm ) {
                msg.author.send( msgs.server_message );
            } else {
                const amount = UTIL.parseFloat( ctx.args[1] );
                if ( amount < envConfig.MINTIP ) {
                    msg.author.send( msgs.min_tip + '`(' + `${envConfig.MINTIP }` +' HLS)`');
                    MESSAGEUTIL.reaction_fail( msg );
                    return;
                }
                if( amount > envConfig.MAXTIP ) {
                    msg.author.send( msgs.max_tip + '`(' + `${envConfig.MAXTIP }` +' HLS)`');
                    return;
                }
                if ( typeof amount != "number" || isNaN(amount) ){
                    msg.author.send( msgs.invalid_command + ', the helios amount is not numeric.' + msgs.example_tip);
                    return;
                }
                const userInfoAuthorBalance = new Promise( (resolve, reject) => {
                    const userInfoAuthor = USERINFO.getBalance( msg.author.id );
                    resolve( userInfoAuthor );
                });
                userInfoAuthorBalance.then( userInfoAuthorBalance => {
                    //console.log( 'menciones', msg.mentions.users.array() );
                    if ( msg.mentions.users.array().length > 0 ) {
                        if ( amount > userInfoAuthorBalance ){
                            msg.author.send( msgs.insufficient_balance + ' to tip.');
                            return;
                        }
                        let user_tip_id_list = [];
                        for( let user of msg.mentions.users.array() ) {
                            if ( user.id != msg.author.id && user.id != msg.client.user.id)
                                user_tip_id_list.push( { user_discord_id: user.id, tag: user.tag } );
                        }
                        if ( isSplit ) 
                            amount = amount / user_tip_id_list.length;
                            
                        for( let user of user_tip_id_list ) {
                            const userInfo = new Promise((resolve, reject) => {
                                const getUser = USERINFO.getUser( user.user_discord_id );
                                resolve( getUser );
                            });
                            userInfo.then( userInfo => {
                                if( !userInfo.length ) {
                                    msg.author.send(`The user ${user.tag} has not generated an account in Helios TipBot.`);
                                    return;
                                }
                            })
                        }
                    } else {
                        msg.author.send( msgs.invalid_tip_count + ', ' + msgs.example_tip)
                        return;
                    }
                });
            }
        } catch (error) {
            logger.error( error );
        }
    }
}
module.exports = Tip;