require('dotenv').config();
const envConfig = process.env;
const TransactionDao = require('../dao/transaction.dao');
const TRANSACTIONDAO = new TransactionDao();
const Helios = require('../middleware/helios');
const HELIOS = new Helios();
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
        
        let getReceive = await new Promise( ( resolve, reject ) => {
            return global.clientRedis.get('receive:'+user_id_receive, async function(err, receive) { 
                resolve(receive) ;
            });
        });
        let getTip = await new Promise( ( resolve, reject ) => {
            return global.clientRedis.get('tip:'+user_id_receive, async function(err, tip) { 
                resolve(tip) ;
            });
        });

        if ( getReceive || getTip ) {
            return;
        }

        const privateKey = await HELIOS.jsonToAccount( keystore , envConfig.ENCRYPT_KEYSTORE );
        const receiveTxs = await HELIOS.getReceivableTransactions( receive.to, privateKey.privateKey );
        if ( receiveTxs.length ) {
            global.clientRedis.set( 'receive:'+user_id_receive, user_id_receive );
            global.clientRedis.expire('receive:'+user_id_receive, 10);
            let transaction = new Transaction();
            transaction.send_status = true;
            transaction.date = moment().utc().toDate();
            if ( isTip ) {
                transaction.isTip = true;
                transaction.to_user_info_id = user_id_receive;
                transaction.from_user_info_id = user_id_send;
                transaction.helios_amount = receive.helios_amount;
                transaction.transaction_hash = receiveTxs[0].hash;
                await TRANSACTIONDAO.create( transaction );
            } else {
                transaction.to_user_info_id = user_id_receive;
                transaction.from_user_info_id = user_id_receive;
                transaction.isTip = false;
                for ( let receive of receiveTxs ) {
                    transaction.helios_amount = await HELIOS.getAmountFloat(receive.value);
                    transaction.transaction_hash = receive.hash;
                    await TRANSACTIONDAO.create( transaction );
                }
            }
        }
        return receiveTxs;
    }
}
module.exports = TransactionController;