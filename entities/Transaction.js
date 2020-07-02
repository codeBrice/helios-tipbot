class Transaction {

    constructor(timestamp, description, value, gasCost, to, from, balance, blockNumber) {
        this.timestamp = timestamp;
        this.description = description;
        this.value = value;
        this.balance = balance;
        this.blockNumber = blockNumber;
        this.to = to;
        this.from = from;
        this.gasCost = gasCost;
    }
}
module.exports = Transaction;