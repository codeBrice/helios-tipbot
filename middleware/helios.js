const Web3 = require('helios-web3');
const formatters =  require('web3-core-helpers');
const Account = require('../entities/account');
const Transaction = require('../entities/transaction');
/*import { HlsUtils } from '../utils/hls-utils';
import { promise } from 'protractor'; */

class Helios {

  constructor(  ) {
    this.web3 = null;
    this.availableNodes = [
      'wss://bootnode.heliosprotocol.io:30304',
      'wss://bootnode2.heliosprotocol.io:30304',
      'wss://bootnode3.heliosprotocol.io:30304',
      'wss://masternode1.heliosprotocol.io:30304'
    ];
  }

  /**
   * Connects to first available node.
   * @returns  true : Successfully connected  or Error Failed to connect.
   */
  async connectToFirstAvailableNode() {
    console.log(`connectToFirstAvailableNode`);
    try {
      if (this.web3 && !(this.web3.currentProvider == null || !this.web3.currentProvider.connected)) {
        return true;
      } else {
        for (const node of this.availableNodes) {
            console.log(`Connecting to node ${node}`);
            this.web3 = new Web3(new Web3.providers.WebsocketProvider(node));
            // this.web3.extend(this.methods);
            // console.log(this.web3);
            try {
              const listen = await this.web3.eth.net.isListening();
              // await this.web3.eth.net.getPeerCount();
              if (this.isConnected() || listen) {
                  console.log(`Successfully connected to ${node}`);
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
   * @returns  account
   * {
   *  address: "0xb8CE9ab6943e0eCED004cDe8e3bBed6568B2Fa01",
   *  privateKey: "0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8709",
   *  signTransaction: function(tx){...},
   *  sign: function(data){...},
   *  encrypt: function(password){...}
   * }
   */
  async accountCreate(password) {
    try {
      console.log('accountsCreate');
      if (await this.isConnected()) {
        const preAccount = await this.web3.hls.accounts.create();
        const encrypt = await this.web3.eth.accounts.encrypt(preAccount.privateKey, password);
        const account = new Account(preAccount, encrypt);
        //console.log(account);
        return account;
      }
    } catch (error) {
      console.log(error);
      throw new Error('Failed to create account');
    }
  }

  async privateKeyToAccount(privateKey, password) {
    try {
      console.log('privateKeyToAccount');
      if (await this.isConnected()) {
        if(password === null){
          const account = await this.web3.hls.accounts.privateKeyToAccount(privateKey);
          console.log(account);
          return account;
        }else{
          let encrypt =  await this.web3.hls.accounts.encrypt(privateKey, password);
          console.log(JSON.stringify(encrypt));
          return encrypt;
        }
      }
    } catch (error) {
      console.log(error);
      throw new Error('Failed to import wallet for privateKey');
    }
  }

  async jsonToAccount(jsonAccount, password) {
    try {
      //console.log('jsonAccount');
      if (await this.isConnected()) {
        const account = this.web3.hls.accounts.decrypt(JSON.parse(jsonAccount), password);
        // const encrypt = await this.web3.eth.accounts.encrypt(preAccount.privateKey, password);
        // const account = new Account(preAccount, encrypt);
        //console.log(account);
        return account;
      }
    } catch (error) {
      console.log(error);
      throw new Error('Wrong Password.');
    }
  }

  async privateKeyToJson(privateKey, password) {
    try {
      console.log('jsonAccount');
      if (await this.isConnected()) {
        const encrypt = await this.web3.eth.accounts.encrypt(privateKey, password);
        //console.log(encrypt);
        return encrypt;
      }
    } catch (error) {
      console.log(error);
      throw new Error('Failed privateKey To Json');
    }
  }


  /**
   * Gets balance
   * @param address  example : 0x9c8b20E830c0Db83862892Fc141808eA6a51FEa2
   * @returns  balance string
   */
  async getBalance(address) {
    try {
      console.log('getBalance');
      if (await this.isConnected()) {
        const hls = await this.web3.hls.getBalance(address);
        const balance = parseFloat(this.web3.utils.fromWei(String(this.web3.utils.toBN(hls)))).toFixed(5);
        //console.log(balance);
        return balance;
      }
    } catch (error) {
      console.log(error);
      throw new Error('Failed to get balance');
    }
  }

    /**
   * Gets balance
   * @param address  example : 0x9c8b20E830c0Db83862892Fc141808eA6a51FEa2
   * @returns  balance string
   */
  async getBalanceInwei( address ) {
    try {
      console.log('getBalance');
      if (await this.isConnected()) {
        const hls = await this.web3.hls.getBalance(address);
        //console.log(balance);
        return hls;
      }
    } catch (error) {
      console.log(error);
      throw new Error('Failed to get balance');
    }
  }
  /**
   * Gets gas price
   * @returns  number
   */
  async getGasPrice() {
    try {
      console.log('getBalance');
      if (await this.isConnected()) {
        const gasPrice = await this.web3.hls.getGasPrice();
        return gasPrice;
      }
    } catch (error) {
      console.log(error);
      throw new Error('Failed to get balance');
    }
  }

  async getAllTransactions(address, startDate, endDate, startIndex, length) {
    try {
      console.log('getAllTransactions');

      if (await this.isConnected()) {

        if (!(startIndex || false)) {
          startIndex = 0;
        }

        if (!(length || false)) {
            length = 10;
        }

        let startBlockNumber = await this.web3.hls.getBlockNumber(address, startDate);

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
              const newBlock = await this.web3.hls.getBlockByNumber(i, address, true);
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
                       formatters.outputBigNumberFormatter(this.web3.utils.toBN(tx.value).mul(this.web3.utils.toBN(-1))),
                       formatters.outputBigNumberFormatter(this.web3.utils.toBN(tx.gasUsed)
                         .mul(this.web3.utils.toBN(tx.gasPrice)).mul(this.web3.utils.toBN(-1))),
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
                       formatters.outputBigNumberFormatter(this.web3.utils.toBN(tx.gasUsed)
                         .mul(this.web3.utils.toBN(tx.gasPrice)).mul(this.web3.utils.toBN(-1))),
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
             console.log(error, {block: i , address});
             reject(error);
            }
           }));
        }
        const promisesResult = await Promise.all(blocksPromise);
        output.map( data  => {
          data.value = parseFloat(this.web3.utils.fromWei(String(this.web3.utils.toBN(data.value)))).toFixed(2);
          data.balance = parseFloat(this.web3.utils.fromWei(String(this.web3.utils.toBN(data.balance)))).toFixed(2);
          data.gasCost = parseFloat(this.web3.utils.fromWei(String(this.web3.utils.toBN(data.gasCost)))).toFixed(2);
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

  async sendTransaction(tx, privateKey) {
    try {
      console.log('sendTransaction');
      if (await this.isConnected()) {
        await this.web3.hls.accounts.wallet.add(privateKey);
        const transaction = await this.web3.hls.sendTransactions([tx]);
        console.log(transaction);
        return transaction;
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async getReceivableTransactions(address , privateKey) {
    try {
      console.log('getReceivableTransactions');
      if (await this.isConnected()) {
        const receivableTxs = await this.web3.hls.getReceivableTransactions(address);
        console.log(receivableTxs);
        if (receivableTxs.length > 0) {
          await this.web3.hls.accounts.wallet.add(privateKey);
          const sendRewardBlock = await this.web3.hls.sendRewardBlock(address);
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
   * @returns  boolean
   */
  async isConnected() {
    try {
      if (this.web3 && !(this.web3.currentProvider == null || !this.web3.currentProvider.connected)) {
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
   * @param address
   * @returns  boolean
   */
  isAddress(address) {
    try {
        return this.web3.utils.isAddress(address);
    } catch (error) {
      console.log(error);
      throw new Error('Failed validate address');
    }
  }

  /**
   * To wei
   * @param value
   * @returns
   */
  toWei(value) {
    try {
        return this.web3.utils.toWei(value, 'Gwei');
    } catch (error) {
      console.log(error);
      throw new Error('Failed toWei');
    }
  }

  async gasPriceSumAmount( amount , gasPrice){
    try {
      if (await this.isConnected()) {
        const amountInWei = await this.web3.utils.toWei(String(amount))
        const sum = parseFloat(this.web3.utils.fromWei(String(this.web3.utils.toBN(gasPrice)))) + 
        parseFloat(this.web3.utils.fromWei(String(this.web3.utils.toBN(amountInWei))));
        return sum;
      }
    } catch (error) {
      console.log(error);
      throw new Error('Failed to get sum gas price and amount to tip');
    }
  }

  /**
   * To weiEther
   * @param value
   * @returns
   */
  toWeiEther(value) {
    try {
        return this.web3.utils.toWei(value, 'ether');
    } catch (error) {
      console.log(error);
      throw new Error('Failed toWei');
    }
  }

  async defaultWallet ( address ){
    try {
      return this.web3.hls.defaultAccount = address ;
    } catch (error) {
      console.log(error);
      throw new Error('Failed set default wallet');
    }
  } 
}

module.exports = Helios;