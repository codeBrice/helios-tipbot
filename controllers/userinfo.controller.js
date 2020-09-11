require('dotenv').config();
const envConfig = process.env;
const UserInfoDao = require('../dao/user.info.dao');
const Helios = require('../middleware/helios');

/**
   * UserInfoController
   * @date 2020-09-10
   */
class UserInfoController {
  /**
   * generateUserWallet
   * @date 2020-09-10
   * @param {any} userDiscordId
   * @return {any}
   */
  static async generateUserWallet( userDiscordId ) {
    const userData = await this.getUser( userDiscordId );
    if ( userData == null ) {
      const account = await Helios.accountCreate( envConfig.ENCRYPT_KEYSTORE );
      await UserInfoDao.create( userDiscordId, account.account.address, JSON.stringify(account.encrypt));
      return account;
    }
    return false;
  }

  /**
   * findAllUser
   * @date 2020-09-10
   * @return {any}
   */
  static async findAllUser() {
    return await UserInfoDao.findAll();
  }

  /**
   * getUser
   * @date 2020-09-10
   * @param {any} userDiscordId
   * @return {any}
   */
  static async getUser( userDiscordId ) {
    return await UserInfoDao.findByUserDiscordId( userDiscordId );
  }

  /**
   * getBalance
   * @date 2020-09-10
   * @param {any} userDiscordId
   * @return {any}
   */
  static async getBalance( userDiscordId ) {
    const userInfo = await this.getUser( userDiscordId );
    return await Helios.getBalance( userInfo.wallet );
  }

  /**
   * getBalanceInWei
   * @date 2020-09-10
   * @param {any} userDiscordId
   * @return {any}
   */
  static async getBalanceInWei( userDiscordId ) {
    const userInfo = await UserInfoDao.findByUserDiscordId( userDiscordId );
    return await Helios.getBalanceInwei( userInfo.wallet );
  }

  /**
   * getPrivateKey
   * @date 2020-09-10
   * @param {any} userDiscordId
   * @return {any}
   */
  static async getPrivateKey( userDiscordId ) {
    const userInfo = await UserInfoDao.findByUserDiscordId( userDiscordId );
    const privateKey = await Helios.jsonToAccount( userInfo.keystore_wallet, envConfig.ENCRYPT_KEYSTORE);
    return privateKey.privateKey;
  }

  /**
   * getWallet
   * @date 2020-09-10
   * @param {any} userDiscordId
   * @return {any}
   */
  static async getWallet( userDiscordId ) {
    const userInfoWallet = await UserInfoDao.findByUserDiscordId( userDiscordId );
    return userInfoWallet.wallet;
  }

  /**
   * getGasPriceSumAmount
   * @date 2020-09-10
   * @param {any} amount
   * @return {any}
   */
  static async getGasPriceSumAmount( amount ) {
    const sumAmount = await Helios.gasPriceSumAmount( amount, envConfig.GAS );
    return sumAmount;
  }

  /**
   * findByWallet
   * @date 2020-09-10
   * @param {any} wallet
   * @return {any}
   */
  static async findByWallet( wallet ) {
    return await UserInfoDao.findByWallet( wallet );
  }
}
module.exports = UserInfoController;
