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
            if ( UTIL.isDmChannel( msg.channel.type ) )
                return;

            let getActiveUsers = await this.getActiveUser( msg );

            getActiveUsers = getActiveUsers.filter( active => active.user_discord_id != msg.author.id);

            if ( getActiveUsers.length < envConfig.RAIN_MIN_ACTIVE_COUNT ) {
                msg.author.send( msgs.rain_inactive )
                MESSAGEUTIL.reaction_fail( msg );
                return;
            }

            let amount = UTIL.parseFloat( global.ctx.args[1] );
                if ( amount < envConfig.MIN_RAIN ) {
                    msg.author.send( msgs.min_rain + '`(' + `${envConfig.MIN_RAIN }` +' HLS)`');
                    MESSAGEUTIL.reaction_fail( msg );
                    return;
                }
                if( amount > envConfig.MAX_RAIN ) {
                    msg.author.send( msgs.max_rain + '`(' + `${envConfig.MAX_RAIN }` +' HLS)`');
                    MESSAGEUTIL.reaction_fail( msg );
                    return;
                }
                if ( typeof amount != "number" || isNaN(amount) ){
                    msg.author.send( msgs.invalid_command + ', the helios amount is not numeric.');
                    MESSAGEUTIL.reaction_fail( msg );
                    return;
                }

                const getTotalAmountWithGas = await new Promise( (resolve, reject) => {
                    const userInfo = USERINFOCONTROLLER.getGasPriceSumAmount( amount );
                    resolve( userInfo );
                });
                let txs = [];
                const userInfoAuthorBalance = new Promise( (resolve, reject) => {
                    const userInfoAuthor = USERINFOCONTROLLER.getBalance( msg.author.id );
                    resolve( userInfoAuthor );
                });
                userInfoAuthorBalance.then( async userInfoAuthorBalance => {
                    if( getTotalAmountWithGas >= userInfoAuthorBalance ) {
                        msg.author.send( msgs.insufficient_balance + ', remember to have enough gas for the transaction.');
                        MESSAGEUTIL.reaction_fail( msg );
                        return;
                    }
                    const userInfoSend = await new Promise( ( resolve, reject ) => {
                        const getUser = USERINFOCONTROLLER.getUser( msg.author.id );
                        resolve( getUser)
                    });
                    
                    amount = amount/getActiveUsers.length;

                    txs = await UTIL.arrayTransaction( msg , getActiveUsers, userInfoSend , amount, false, true );

                    if ( txs.length > 0 ) {
                        const transaction = new Promise( (resolve, reject) => {
                            const sendingTx = TRANSACTION.sendTransaction( txs , userInfoSend.keystore_wallet);
                            resolve( sendingTx );
                        });
                        transaction.then( async tx => {
                            if ( tx.length > 0 ) {
                                for ( let receive of tx ) {
                                    let userInfoReceive = await new Promise((resolve, reject) => {
                                        const getUser = USERINFOCONTROLLER.getUser( receive.user_discord_id_receive );
                                        resolve( getUser );
                                    });
                                    let receiveTx = await TRANSACTION.receiveTransaction( receive, userInfoReceive.keystore_wallet, true , receive.user_id_send, receive.user_id_receive);
                                    if ( receiveTx.length > 0  ) {
                                        global.clientRedis.set( 'receive:'+receive.user_discord_id_receive, receive.user_discord_id_receive );
                                        global.clientRedis.expire('receive:'+receive.user_discord_id_receive, 10);
                                        global.client.fetchUser( receive.user_discord_id_receive , false ).then(user => {
                                            user.send(MESSAGEUTIL.msg_embed('Rain receive',
                                            'The user'+ msg.author + ' rain you `' + amount +' HLS`', true, `https://heliosprotocol.io/block-explorer/#main_page-transaction&${receiveTx[0].hash}`) ); 
                                        });
                                        MESSAGEUTIL.reaction_complete_rain( msg );
                                    }
                                }
                            } else {
                                await TRANSACTIONQUEUECONTROLLER.create( txs , msg , false, true );
                                MESSAGEUTIL.reaction_transaction_queue( msg );
                                logger.error( error );
                                return;
                            }
                        }).catch( async error => {
                            await TRANSACTIONQUEUECONTROLLER.create( txs , msg , false, true );
                            MESSAGEUTIL.reaction_transaction_queue( msg );
                            logger.error( error );
                            return;
                        });
                    }
                });
        } catch (error) {
            logger.error( error );
            msg.author.send( msgs.rain_error )
            MESSAGEUTIL.reaction_fail( msg );
        }
    }

    async update_activity_user( msg ){
        try {
            if ( UTIL.isDmChannel( msg.channel.type ) || msg.content.length < 30 )
                return;

            global.clientRedis.get('activity:'+msg.author.id+msg.guild.id, async function(err, activity) {
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
            const allUser = await new Promise( ( resolve, reject ) => {
                resolve( USERINFOCONTROLLER.findAllUser() )
            });
            for(let i = 0; i < allUser.length; i ++ ) {
                let getActivity = await new Promise( ( resolve, reject ) => {
                    return global.clientRedis.get('activity:'+allUser[i].user_discord_id+msg.guild.id, async function(err, activity) { 
                        resolve(activity) ;
                    });
                });
                if( getActivity != null ) {
                    getActivity = JSON.parse( getActivity );
                    if ( getActivity.msg_count >= parseInt(envConfig.RAIN_MIN_ACTIVE_COUNT) ) {
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