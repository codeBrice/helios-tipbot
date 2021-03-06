require('dotenv').config();
const envConfig = process.env;
const Util = require('../util/util');
const UTIL = new Util();
const moment = require("moment");
const UserInfoController = require('../controllers/userinfo.controller');
const USERINFOCONTROLLER = new UserInfoController();
const conf = require("../config.js").jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();
const msgs = require('../util/msg.json');
const MessageUtil = require('../util/Discord/message');
const MESSAGEUTIL = new MessageUtil();
const Transaction = require('../controllers/transactions.controller');
const TRANSACTION = new Transaction();

class Rain {
    constructor(){}

    async rain( msg ) {
        try {
            if ( Util.isDmChannel( msg.channel.type ) )
                return;

            let getActiveUsers = await this.getActiveUser( msg );

            getActiveUsers = getActiveUsers.filter( active => active.user_discord_id != msg.author.id);

            const userInfoSend = await USERINFOCONTROLLER.getUser( msg.author.id );

            if( !userInfoSend ) {
                msg.author.send( msgs.not_wallet );
                await MESSAGEUTIL.reaction_fail( msg );
                return;
            }

            if ( getActiveUsers.length < envConfig.RAIN_MIN_ACTIVE_COUNT ) {
                msg.author.send( msgs.rain_inactive )
                MESSAGEUTIL.reaction_fail( msg );
                return;
            }

            let amount = Util.parseFloat( global.ctx.args[1] );
            if ( amount < envConfig.MIN_RAIN ) {
                msg.author.send( msgs.min_rain + '`(' + `${envConfig.MIN_RAIN }` +' <:CoinHelios:768201645884178492>)`');
                MESSAGEUTIL.reaction_fail( msg );
                return;
            }
            if( amount > envConfig.MAX_RAIN ) {
                msg.author.send( msgs.max_rain + '`(' + `${envConfig.MAX_RAIN }` +' <:CoinHelios:768201645884178492>)`');
                MESSAGEUTIL.reaction_fail( msg );
                return;
            }
            if ( typeof amount != "number" || isNaN(amount) ){
                msg.author.send( msgs.invalid_command + ', the helios amount is not numeric.');
                MESSAGEUTIL.reaction_fail( msg );
                return;
            }

            const getTotalAmountWithGas = await USERINFOCONTROLLER.getGasPriceSumAmount( amount );
            let txs = [];
            const userInfoAuthorBalance = await USERINFOCONTROLLER.getBalance( msg.author.id );

            if( getTotalAmountWithGas >= userInfoAuthorBalance ) {
                msg.author.send( msgs.insufficient_balance + ', remember to have enough gas for the transaction.');
                MESSAGEUTIL.reaction_fail( msg );
                return;
            }
            
            amount = amount/getActiveUsers.length;

            txs = await UTIL.arrayTransaction( msg , getActiveUsers, userInfoSend , amount, false, true );

            if ( txs.length > 0 ) {
                const transaction = await TRANSACTION.sendTransaction( txs , userInfoSend.keystore_wallet);
                if ( transaction.length > 0  ) {
                    await MESSAGEUTIL.reaction_complete_rain( msg );
                    await UTIL.receiveTx( transaction, msg, amount, false, null, true );
                } else {
                    MESSAGEUTIL.reaction_transaction_queue( msg );
                    return;
                }
            } else {
                MESSAGEUTIL.reaction_transaction_queue( msg );
                return;
            }
        } catch (error) {
            if( error.code != 50007 ) {
                msg.author.send( msgs.rain_error )
                MESSAGEUTIL.reaction_fail( msg );
                logger.error( error );
            }
        }
    }

    async update_activity_user( msg ){
        try {
            if ( Util.isDmChannel( msg.channel.type ) || msg.content.length < 15 )
                return;

            global.clientRedis.get('activity:'+msg.author.id+msg.guild.id, function(err, activity) {
                if( activity == null ) {
                    global.clientRedis.set('activity:'+msg.author.id+msg.guild.id, JSON.stringify({
                        'user_id': msg.author.id,
                        'last_msg': moment().utc().toDate(),
                        'msg_count': 1,
                    }));
                    global.clientRedis.expire('activity:'+msg.author.id+msg.guild.id , 1800);
                } else {
                    //activity is the object for user active
                    activity = JSON.parse( activity );
                    let seconds = moment.duration(moment().utc().diff(activity.last_msg)).asSeconds();
                    if ( 90 > seconds)
                        return

                    if ( seconds > 1200 ) {
                        if ( activity.msg_count > 1 )
                            activity.msg_count -= 1;

                        activity.last_msg = moment().utc().toDate();
                        global.clientRedis.set( 'activity:'+msg.author.id+msg.guild.id, JSON.stringify(activity) );
                        global.clientRedis.expire( 'activity:'+msg.author.id+msg.guild.id , 1800 );
                    } else {
                        if ( activity.msg_count <= parseInt(envConfig.RAIN_MSG_REQUIREMENT)*2 ) {
                            activity.msg_count += 1;
                            activity.last_msg = moment().utc().toDate();
                            global.clientRedis.set( 'activity:'+msg.author.id+msg.guild.id, JSON.stringify(activity) );
                            global.clientRedis.expire( 'activity:'+msg.author.id+msg.guild.id , 1800 );
                        } else {
                            activity.last_msg = moment().utc().toDate();
                            global.clientRedis.set( 'activity:'+msg.author.id+msg.guild.id, JSON.stringify(activity) );
                            global.clientRedis.expire( 'activity:'+msg.author.id+msg.guild.id , 1800 );
                        }
                    } 
                }
            }); 
        } catch (error) {
            logger.error( error );
        }
    }

    async getActiveUser( msg ) {
        try {
            let activeUser = [];
            const allUser = await USERINFOCONTROLLER.findAllUser();
            for(let i = 0; i < allUser.length; i ++ ) {
                let getActivity = await new Promise( ( resolve, reject ) => {
                    return global.clientRedis.get('activity:'+allUser[i].user_discord_id+msg.guild.id, function(err, activity) { 
                        resolve(activity) ;
                    });
                });
                if( getActivity != null ) {
                    getActivity = JSON.parse( getActivity );
                    if ( getActivity.msg_count >= parseInt(envConfig.RAIN_MSG_REQUIREMENT) ) {
                        activeUser.push({ user_discord_id: allUser[i].user_discord_id } );
                    }
                }
            }
            return activeUser

        } catch (error) {
            logger.error( error );
        }
    }
}
module.exports = Rain;