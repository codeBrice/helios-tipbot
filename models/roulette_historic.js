
'use strict';
module.exports = (sequelize, DataTypes) => {
  const rouletteHistoric = sequelize.define('roulette_historic', {
    bets: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    winNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isFinish: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  }, {
    tableName: 'tbl_roulette_historics',
    timestamps: false,
  });

  return rouletteHistoric;
};
