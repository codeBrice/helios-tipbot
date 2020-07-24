class SendTransaction {
    constructor( from, to, value, gas, gasPrice, user_discord_id_receive, user_id_receive, helios_amount, keystore_wallet,user_discord_id_send,user_id_send ){
        this.from = from
        this.to = to
        this.value = value
        this.gas = gas
        this.gasPrice = gasPrice,
        this.user_discord_id_receive = user_discord_id_receive;
        this.user_id_receive = user_id_receive;
        this.helios_amount = helios_amount;
        this.keystore_wallet = keystore_wallet;
        this.user_discord_id_send = user_discord_id_send;
        this.user_id_send = user_id_send;
    }
}
module.exports = SendTransaction;