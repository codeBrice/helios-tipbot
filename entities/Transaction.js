class Transaction {

    constructor(from_user_info_id, to_user_info_id, helios_amount, send_status = false, transaction_hash, isTip, date) {
        this.from_user_info_id = from_user_info_id
        this.to_user_info_id = to_user_info_id
        this.helios_amount = helios_amount
        this.send_status = send_status
        this.transaction_hash = transaction_hash
        this.isTip = isTip
        this.date = date
    }
}
module.exports = Transaction;