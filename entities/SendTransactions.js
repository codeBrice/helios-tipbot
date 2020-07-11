class SendTransaction {
    constructor(from, to, value, gas, gasPrice){
        this.from = from
        this.to = to
        this.value = value
        this.gas = gas
        this.gasPrice = gasPrice
    }
}
module.exports = SendTransaction;