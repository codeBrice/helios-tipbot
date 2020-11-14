const { topggvote } = require("../models");
const conf = require("../config.js").jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();

class TogGgVoteDao {
    constructor(){}

    async create( obj ){
        try {
            return topggvote.create(obj);
        } catch (error) {
            logger.error( error );
        }
    }

    async update( obj ) {
        try {
            return topggvote.update( obj , {
                where: {
                    id: obj.id
                }
            });
        } catch (error) {
            logger.error( error );
        }
    }

    async findByUserDiscordId(  user_discord_id ) {
        try {
            return topggvote.findOne({
                where: {
                    user_discord_id: user_discord_id
                }
            });
        } catch (error) {
            logger.error( error );
        }
    }

    async findTopTen(){
        try {
            return topggvote.findAll({
                limit: 10,
                order: [
                    ['vote_count', 'DESC'],
                ],
            })
        } catch (error) {
            logger.error( error );
        }
    }

}
module.exports = TogGgVoteDao;