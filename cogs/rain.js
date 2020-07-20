require('dotenv').config();
const envConfig = process.env;
const Util = require('../util/util');
const UTIL = new Util();
const moment = require("moment");
const UserInfoController = require('../controllers/userinfo.controller');
const USERINFOCONTROLLER = new UserInfoController();
const conf = require("../config.js").jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();

class Rain {
    constructor(){}

    async update_activity_user( msg ){
        try {
            if ( UTIL.isDmChannel( msg.channel.type ) || msg.content.length < 30 )
                return;

            global.clientRedis.get('activity:'+msg.author.id, async function(err, activity) {
                if( activity == null ) {
                    global.clientRedis.set('activity:'+msg.author.id, JSON.stringify({
                        'user_id': msg.author.id,
                        'last_msg': moment().utc().add(-4, 'hours').toDate(),
                        'msg_count': 1
                    }));
                    global.clientRedis.expire('activity:'+msg.author.id , 1800);
                } else {
                    //activity is the object for user active
                    activity = JSON.parse( activity );
                    let seconds = moment.duration(moment().utc().add(-4,'hours').diff(activity.last_msg)).asSeconds();
                    if ( 90 > seconds)
                        return

                    if ( seconds > 1200 ) {
                        if ( activity.msg_count > 1 )
                            activity.msg_count -= 1;

                        activity.last_msg = moment().utc().add(-4, 'hours').toDate();
                        global.clientRedis.set( 'activity:'+msg.author.id, JSON.stringify(activity) );
                        global.clientRedis.expire( 'activity:'+msg.author.id , 1800 );
                    } else {
                        if ( activity.msg_count <= parseInt(envConfig.RAIN_MSG_REQUIREMENT)*2 ) {
                            activity.msg_count += 1;
                            activity.last_msg = moment().utc().add(-4, 'hours').toDate();
                            global.clientRedis.set( 'activity:'+msg.author.id, JSON.stringify(activity) );
                            global.clientRedis.expire( 'activity:'+msg.author.id , 1800 );
                        } else {
                            activity.last_msg = moment().utc().add(-4, 'hours').toDate();
                            global.clientRedis.set( 'activity:'+msg.author.id, JSON.stringify(activity) );
                            global.clientRedis.expire( 'activity:'+msg.author.id , 1800 );
                        }
                    } 
                }
            }); 
        } catch (error) {
            logger.error( error );
        }
    }

    async getActiveUser() {
        try {
            let activeUser = [];
            const allUser = await new Promise( ( resolve, reject ) => {
                resolve( USERINFOCONTROLLER.findAllUser() )
            });
            for(let i = 0; i < allUser.length; i ++ ) {
                let getActivity = await new Promise( ( resolve, reject ) => {
                    return global.clientRedis.get('activity:'+allUser[i].user_discord_id, async function(err, activity) { 
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