class SendTransaction {
    constructor( from, to, value, gas, gasPrice, user_discord_id_receive, user_id, helios_amount ){
        this.from = from
        this.to = to
        this.value = value
        this.gas = gas
        this.gasPrice = gasPrice,
        this.user_discord_id_receive = user_discord_id_receive;
        this.user_id = user_id;
        this.helios_amount = helios_amount;
    }
}
module.exports = SendTransaction;