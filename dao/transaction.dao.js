const { transactions } = require("../models");
const conf = require("../config.js").jsonConfig();
const logger = require(conf.pathLogger).getHeliosBotLogger();

class TransactionDao {
    constructor(){}

    async create( transaction ){
        try {
            return transactions.create(transaction);
        } catch (error) {
            logger.error( error );
        }
    }

    async bulkCreate( txs ) {
        try {
            transactions.bulkCreate( txs ).then( tx => {
                return tx;
            }).catch( error => {
                logger.error( error ); 
            });
        } catch (error) {
            logger.error( error );
        }
    }
}
module.exports = TransactionDao;