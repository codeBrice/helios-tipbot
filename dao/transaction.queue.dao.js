const { transaction_queue } = require("../models");
const conf = require("../config.js").jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();

class TransactionQueueDao {
    constructor(){}

    async create( txs, isProcessed, date, msg_discord, isTip, isRain ){
        try {
            return transaction_queue.create({transactions: txs, isProcessed: isProcessed, date: date, msg_discord, isTip: isTip, isRain: isRain, isProcessedFailed: false});
        } catch (error) {
            logger.error( error );
        }
    }

    async update( tx ) {
        try {
            return transaction_queue.update( tx , {
                where: {
                    id: tx.id
                }
            });
        } catch (error) {
            logger.error( error );
        }
    }
    
    async delete(){
        try {
            return transaction_queue.delete({
                where: {
                    isProcessed: true
                }
            });
        } catch (error) {
            logger.error( error );
        }
    }

    async findById( id ) {
        try {
            return transaction_queue.findOne({
                where: {
                    id: id 
                }
            })
        } catch (error) {
            logger.error( error )
        }
    }

    async findAll() {
        try {
            return transaction_queue.findAll({
                where: {
                    isProcessed: false
                }
            });
        } catch (error) {
            logger.error( error )
        }
    }
}
module.exports = TransactionQueueDao;