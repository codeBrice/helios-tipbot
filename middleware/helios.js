const Web3 = require('helios-web3');
const formatters = require('web3-core-helpers');
const Account = require('../entities/Account');
const Transaction = require('../entities/Transaction');
/* import { HlsUtils } from '../utils/hls-utils';
import { promise } from 'protractor'; */

const availableNodes = [
  'wss://bootnode.heliosprotocol.io:30304',
  'wss://bootnode2.heliosprotocol.io:30304',
  'wss://bootnode3.heliosprotocol.io:30304',
  'wss://masternode1.heliosprotocol.io:30304',
];
let web3 = null;

/**
   * Helios
   * @date 2020-09-10
   */
class Helios {
  /**
   * Connects to first available node.
   * @date 2020-09-10
   * @return {any} true : Successfully connected  or Error Failed to connect.
   */
  static async connectToFirstAvailableNode() {
    // console.log(`connectToFirstAvailableNode`);
    try {
      if (web3 && !(web3.currentProvider == null || !web3.currentProvider.connected)) {
        return true;
      } else {
        for (const node of availableNodes) {
          // console.log(`Connecting to node ${node}`);
          web3 = new Web3(new Web3.providers.WebsocketProvider(node));
          // web3.extend(this.methods);
          // console.log(web3);
          try {
            const listen = await web3.eth.net.isListening();
            // await web3.eth.net.getPeerCount();
            if (this.isConnected() || listen) {
              // console.log(`Successfully connected to ${node}`);
              return true;
            }
          } catch ( error ) {
            console.log(`Failed connected to ${node}`);
          }
          // console.log( ' listening: ' + isListening.toString() + ' with ' + numPeers + ' peers');
        }
        throw new Error('Failed to connect to nodes');
      }
    } catch (error) {
      throw error;
    }
  }


  /**
   * Accounts create.
   * @date 2020-09-10
   * @param {any} password
   * @return  account
   * {
   *  address: "0xb8CE9ab6943e0eCED004cDe8e3bBed6568B2Fa01",
   *  privateKey: "0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8709",
   *  signTransaction: function(tx){...},
   *  sign: function(data){...},
   *  encrypt: function(password){...}
   * }
   */
  static async accountCreate(password) {
    try {
      console.log('accountsCreate');
      if (await this.isConnected()) {
        const preAccount = await web3.hls.accounts.create();
        const encrypt = await web3.eth.accounts.encrypt(preAccount.privateKey, password);
        const account = new Account(preAccount, encrypt);
        // console.log(account);
        return account;
      }
    } catch (error) {
      console.log(error);
      throw new Error('Failed to create account');
    }
  }

  /**
   * privateKeyToAccount
   * @date 2020-09-10
   * @param {any} privateKey
   * @param {any} password
   * @return {any}
   */
  static async privateKeyToAccount(privateKey, password) {
    try {
      console.log('privateKeyToAccount');
      if (await this.isConnected()) {
        if (password === null) {
          const account = await web3.hls.accounts.privateKeyToAccount(privateKey);
          console.log(account);
          return account;
        } else {
          const encrypt = await web3.hls.accounts.encrypt(privateKey, password);
          console.log(JSON.stringify(encrypt));
          return encrypt;
        }
      }
    } catch (error) {
      console.log(error);
      throw new Error('Failed to import wallet for privateKey');
    }
  }

  /**
   * jsonToAccount
   * @date 2020-09-10
   * @param {any} jsonAccount
   * @param {any} password
   * @return {any}
   */
  static async jsonToAccount(jsonAccount, password) {
    try {
      // console.log('jsonAccount');
      if (await this.isConnected()) {
        const account = web3.hls.accounts.decrypt(JSON.parse(jsonAccount), password);
        // const encrypt = await web3.eth.accounts.encrypt(preAccount.privateKey, password);
        // const account = new Account(preAccount, encrypt);
        // console.log(account);
        return account;
      }
    } catch (error) {
      console.log(error);
      throw new Error('Wrong Password.');
    }
  }

  /**
   * privateKeyToJson
   * @date 2020-09-10
   * @param {any} privateKey
   * @param {any} password
   * @return {any}
   */
  static async privateKeyToJson(privateKey, password) {
    try {
      console.log('jsonAccount');
      if (await this.isConnected()) {
        const encrypt = await web3.eth.accounts.encrypt(privateKey, password);
        // console.log(encrypt);
        return encrypt;
      }
    } catch (error) {
      console.log(error);
      throw new Error('Failed privateKey To Json');
    }
  }


  /**
   * Gets balance
   * @date 2020-09-10
   * @param {any} address  example : 0x9c8b20E830c0Db83862892Fc141808eA6a51FEa2
   * @return {any} balance string
   */
  static async getBalance(address) {
    try {
      console.log('getBalance');
      if (await this.isConnected()) {
        const hls = await web3.hls.getBalance(address);
        const balance = parseFloat(web3.utils.fromWei(String(web3.utils.toBN(hls)))).toFixed(5);
        // console.log(balance);
        return balance;
      }
    } catch (error) {
      console.log(error);
      throw new Error('Failed to get balance');
    }
  }

  /**
   * getAmountFloat
   * @date 2020-09-10
   * @param {any} amount
   * @return {any}
   */
  static async getAmountFloat(amount) {
    try {
      if (await this.isConnected()) {
        const balance = parseFloat(web3.utils.fromWei(String(web3.utils.toBN(amount)))).toFixed(5);
        return balance;
      }
    } catch (error) {
      console.log(error);
      throw new Error('Failed to get amountfloat');
    }
  }
  /**
   * Gets balance
   * @date 2020-09-10
   * @param {any} address  example : 0x9c8b20E830c0Db83862892Fc141808eA6a51FEa2
   * @return {any} balance string
   */
  static async getBalanceInwei( address ) {
    try {
      console.log('getBalance');
      if (await this.isConnected()) {
        const hls = await web3.hls.getBalance(address);
        // console.log(balance);
        return hls;
      }
    } catch (error) {
      console.log(error);
      throw new Error('Failed to get balance');
    }
  }

  /**
   * Gets gas price
   * @date 2020-09-10
   * @return {any}
   */
  static async getGasPrice() {
    try {
      console.log('getBalance');
      if (await this.isConnected()) {
        const gasPrice = await web3.hls.getGasPrice();
        return gasPrice;
      }
    } catch (error) {
      console.log(error);
      throw new Error('Failed to get balance');
    }
  }

  /**
   * getAllTransactions
   * @date 2020-09-10
   * @param {any} address
   * @param {any} startDate
   * @param {any} endDate
   * @param {any} startIndex
   * @param {any} length
   * @return {any}
   */
  static async getAllTransactions(address, startDate, endDate, startIndex, length) {
    try {
      console.log('getAllTransactions');

      if (await this.isConnected()) {
        if (!(startIndex || false)) {
          startIndex = 0;
        }

        if (!(length || false)) {
          length = 10;
        }

        let startBlockNumber = await web3.hls.getBlockNumber(address, startDate);

        startBlockNumber = startBlockNumber - startIndex;
        let endBlockNumber = startBlockNumber - length;
        if (endBlockNumber < 0) {
          endBlockNumber = 0;
        }
        // console.log(startBlockNumber);
        const output = [];
        const blocksPromise = [];
        for (let i = startBlockNumber; i >= endBlockNumber; i--) {
          // console.log('Getting all transactions at block number ' + i);
          blocksPromise.push(new Promise(async (resolve, reject) => {
            try {
              const newBlock = await web3.hls.getBlockByNumber(i, address, true);
              // console.log(newBlock);
              // comentado por que se creo en promesa
              if (newBlock.timestamp > startDate) {
                return;
              }
              /* if (newBlock.timestamp > endDate) {
                return;
              } */
              if (newBlock.transactions.length > 0) {
                for (const transactionBlock of newBlock.transactions) {
                  const tx = transactionBlock;
                  output.push(new Transaction(newBlock.timestamp, 'Send transaction',
                      formatters.outputBigNumberFormatter(web3.utils.toBN(tx.value).mul(web3.utils.toBN(-1))),
                      formatters.outputBigNumberFormatter(web3.utils.toBN(tx.gasUsed)
                          .mul(web3.utils.toBN(tx.gasPrice)).mul(web3.utils.toBN(-1))),
                      tx.to, address, formatters.outputBigNumberFormatter(newBlock.accountBalance), newBlock.number));
                }
              }
              if (newBlock.receiveTransactions.length > 0) {
                for (const receiveTransactions of newBlock.receiveTransactions) {
                  const tx = receiveTransactions;
                  let description;
                  if (tx.isRefund) {
                    description = 'Refund transaction';
                  } else {
                    description = 'Receive transaction';
                  }
                  output.push(new Transaction(newBlock.timestamp, description,
                      formatters.outputBigNumberFormatter(tx.value),
                      formatters.outputBigNumberFormatter(web3.utils.toBN(tx.gasUsed)
                          .mul(web3.utils.toBN(tx.gasPrice)).mul(web3.utils.toBN(-1))),
                      address, tx.from, formatters.outputBigNumberFormatter(newBlock.accountBalance), newBlock.number));
                }
              }
              if (parseFloat(newBlock.rewardBundle.rewardType2.amount.substring('2')) !== parseFloat('0')) {
                if (formatters.outputBigNumberFormatter(newBlock.rewardBundle.rewardType2.amount) > 0) {
                  output.push(new Transaction(newBlock.timestamp, 'Reward type 2',
                      formatters.outputBigNumberFormatter(newBlock.rewardBundle.rewardType2.amount), 0, address, 'Coinbase',
                      formatters.outputBigNumberFormatter(newBlock.accountBalance), newBlock.number));
                }
              }
              resolve();
            } catch (error) {
              console.log(error, {block: i, address});
              reject(error);
            }
          }));
        }
        const promisesResult = await Promise.all(blocksPromise);
        output.map( (data) => {
          data.value = parseFloat(web3.utils.fromWei(String(web3.utils.toBN(data.value)))).toFixed(2);
          data.balance = parseFloat(web3.utils.fromWei(String(web3.utils.toBN(data.balance)))).toFixed(2);
          data.gasCost = parseFloat(web3.utils.fromWei(String(web3.utils.toBN(data.gasCost)))).toFixed(2);
        });
        return output;
      }
    } catch (error) {
      console.log(error);
      try {
        if (JSON.parse(error.message.replace('Returned error: ', '')).error === 'No canonical head set for this chain') {
          return [];
        }
      } catch (error) {
        throw new Error('Failed to get All Transactions');
      }
      throw new Error('Failed to get All Transactions');
    }
  }

  /**
   * sendTransaction
   * @date 2020-09-10
   * @param {any} txs
   * @param {any} privateKey
   * @return {any}
   */
  static async sendTransaction(txs, privateKey) {
    try {
      console.log('sendTransaction');
      if (await this.isConnected()) {
        await web3.hls.accounts.wallet.add(privateKey);
        const transaction = await web3.hls.sendTransactions(txs);
        return transaction;
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  /**
   * getReceivableTransactions
   * @date 2020-09-10
   * @param {any} address
   * @param {any} privateKey
   * @return {any}
   */
  static async getReceivableTransactions(address, privateKey) {
    try {
      console.log('getReceivableTransactions');
      if (await this.isConnected()) {
        const receivableTxs = await web3.hls.getReceivableTransactions(address);
        console.log(receivableTxs);
        if (receivableTxs.length > 0) {
          await web3.hls.accounts.wallet.add(privateKey);
          const sendRewardBlock = await web3.hls.sendRewardBlock(address);
          console.log(sendRewardBlock);
          return receivableTxs;
        }
        return false;
      }
    } catch (error) {
      console.log(error);
      throw new Error('Failed Receivable Transactions');
    }
  }

  /**
   * Determines whether connected is node
   * @date 2020-09-10
   * @return {any} boolean
   */
  static async isConnected() {
    try {
      if (web3 && !(web3.currentProvider == null || !web3.currentProvider.connected)) {
        return true;
      } else {
        const connect = await this.connectToFirstAvailableNode();
        return connect;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Determines whether address is
   * @date 2020-09-10
   * @param {any} address
   * @return {any} boolean
   */
  static isAddress(address) {
    try {
      return web3.utils.isAddress(address);
    } catch (error) {
      console.log(error);
      throw new Error('Failed validate address');
    }
  }

  /**
   * To wei
   * @date 2020-09-10
   * @param {any} value
   * @return {any}
   */
  static toWei(value) {
    try {
      return web3.utils.toWei(value, 'Gwei');
    } catch (error) {
      console.log(error);
      throw new Error('Failed toWei');
    }
  }

  /**
   * gasPriceSumAmount
   * @date 2020-09-10
   * @param {any} amount
   * @param {any} gasPrice
   * @returns {any}
   */
  static async gasPriceSumAmount( amount, gasPrice) {
    try {
      if (await this.isConnected()) {
        const amountInWei = await web3.utils.toWei(String(amount));
        const sum = parseFloat(web3.utils.fromWei(String(web3.utils.toBN(gasPrice)))) +
        parseFloat(web3.utils.fromWei(String(web3.utils.toBN(amountInWei))));
        return sum;
      }
    } catch (error) {
      console.log(error);
      throw new Error('Failed to get sum gas price and amount to tip');
    }
  }

  /**
   * To weiEther
   * @date 2020-09-10
   * @param {any} value
   * @returns {any}
   */
  static toWeiEther(value) {
    try {
      return web3.utils.toWei(value, 'ether');
    } catch (error) {
      console.log(error);
      throw new Error('Failed toWei');
    }
  }

  /**
   * defaultWallet
   * @date 2020-09-10
   * @param {any} address
   * @return {any}
   */
  static async defaultWallet( address ) {
    try {
      return web3.hls.defaultAccount = address;
    } catch (error) {
      console.log(error);
      throw new Error('Failed set default wallet');
    }
  }
}

module.exports = Helios;
