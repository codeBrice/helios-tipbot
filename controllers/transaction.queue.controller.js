const TransactionQueueDao = require('../dao/transaction.queue.dao');
const TRANSACTIONQUEUEDAO = new TransactionQueueDao();
const moment = require("moment");

class TransactionQueueController {

    constructor(){}

    async create( txs , msg_discord , isTip = false , isRain = false, isTipAuthor = false ) {
        const queue = await TRANSACTIONQUEUEDAO.create( JSON.stringify(txs), false, moment().utc().toDate(), JSON.stringify({ message_id: msg_discord.id, channel_id: msg_discord.channel.id}), isTip, isRain, isTipAuthor );
        return queue;
    }

    async findAll() {
        return await TRANSACTIONQUEUEDAO.findAll();
    }

    async update( tx ){
        return await TRANSACTIONQUEUEDAO.update( tx );
    }
}
module.exports = TransactionQueueController;