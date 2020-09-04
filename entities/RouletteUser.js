/**
 * Entiti Roulete
 */
class RouletteUser {
  /**
   * constructor Roulette
   * @date 2020-09-04
   * @param {any} discordId
   * @param {any} userName
   * @param {any} amount
   * @param {any} command
   */
  constructor(discordId, userName, amount, command) {
    this.discordId = discordId;
    this.userName = userName;
    this.amount = amount;
    this.command = command;
  }
}
module.exports = RouletteUser;
