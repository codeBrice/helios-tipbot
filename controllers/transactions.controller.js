require('dotenv').config();
const envConfig = process.env;
const TransactionDao = require('../dao/transaction.dao');
const TRANSACTIONDAO = new TransactionDao();
const Helios = require('../middleware/helios');
const HELIOS = new Helios();
const SendTransaction = require('../entities/SendTransactions');
const transactionEntitie = new SendTransaction();
const UserInfo = require('../dao/user.info.dao');
const USERINFO = new UserInfo();
const moment = require("moment");

class TransactionController {
    
    constructor() {
    }

    async sendTransaction( userAuthor, userReceive , amount ) {
        const userInfo = await USERINFO.findByUserDiscordId( userAuthor )
        transactionEntitie.from = userInfo[0].wallet;
        transactionEntitie.to = userReceive.wallet;
        transactionEntitie.gasPrice = await HELIOS.toWei(String(await HELIOS.getGasPrice()));
        transactionEntitie.gas = envConfig.GAS;
        transactionEntitie.value = await HELIOS.toWeiEther((String(amount)));

        const privateKey = await HELIOS.jsonToAccount( userInfo[0].keystore_wallet , envConfig.ENCRYPT_KEYSTORE);
        const sendTx = await HELIOS.sendTransaction( transactionEntitie, privateKey.privateKey );
        console.log( 'transaccion enviada' , sendTx );
        const receive = await this.receiveTransaction( userReceive.wallet , userReceive.keystore_wallet);
        let transaction = {
            from_user_info_id: userInfo[0].id, 
            to_user_info_id: userReceive.id, 
            helios_amount: amount, 
            date:moment().utc().toDate(),
            send_status: false,
            transaction_hash: ''
        }
        if( receive ){
            transaction.transaction_hash = receive.hash;
            transaction.send_status = true;
            TRANSACTIONDAO.create(transaction);
            return receive;
        }
        return false;
    }

    async receiveTransaction( address, keystore ){
        const privateKey = await HELIOS.jsonToAccount( keystore , envConfig.ENCRYPT_KEYSTORE );
        const receive = await HELIOS.getReceivableTransactions( address, privateKey.privateKey );
        return receive[0];
    }
}
module.exports = TransactionController;