require('dotenv').config();
const envConfig = process.env;
const TransactionDao = require('../dao/transaction.dao');
const TRANSACTIONDAO = new TransactionDao();
const Helios = require('../middleware/helios');
const HELIOS = new Helios();
const UserInfo = require('../dao/user.info.dao');
const moment = require("moment");
const Transaction = require('../entities/Transaction');
class TransactionController {
    
    constructor() {
    }

    async sendTransaction( txs , keystore_wallet ) {
        const privateKey = await HELIOS.jsonToAccount( keystore_wallet , envConfig.ENCRYPT_KEYSTORE);
        const sendTx = await HELIOS.sendTransaction( txs, privateKey.privateKey );
        if ( sendTx ) {
            return txs;
        }
        return null;
    }

    async receiveTransaction( receive, keystore, isTip = false, user_id_send, user_id_receive ){
        const privateKey = await HELIOS.jsonToAccount( keystore , envConfig.ENCRYPT_KEYSTORE );
        const receiveTxs = await HELIOS.getReceivableTransactions( receive.to, privateKey.privateKey );
        let transaction = new Transaction();
        if ( isTip ) {
            transaction.isTip = true;
            transaction.send_status = true;
            transaction.to_user_info_id = user_id_receive;
            transaction.from_user_info_id = user_id_send;
            transaction.date = moment().utc().toDate();
            transaction.helios_amount = receive.helios_amount;
            transaction.transaction_hash = receiveTxs[0].hash;
        }
        await TRANSACTIONDAO.create( transaction );
        return receiveTxs;
    }
}
module.exports = TransactionController;