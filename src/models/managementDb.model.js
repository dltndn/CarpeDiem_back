const mongoose = require('mongoose');

const managementSchema = new mongoose.Schema(
  {
    login: { type: Number },
    verify: { type: Number },
    logout: { type: Number },
    validAccessToken: { type: Number },
    updateAccessToken: { type: Number },
    topWinnersMini: { type: Number },
    topWinners: { type: Number },
    userGames: { type: Number },
    updateRewardClaimed: { type: Number },
    currentGames: { type: Number },
    getGamesByIds: { type: Number },
    userTotalRewards: { type: Number },
    betEvent: { type: Number },
    efpEvent: { type: Number },
    claimRewardEvent: { type: Number }
  });

const tempAccountSchema = new mongoose.Schema(
  {
    publicKey: { type: String },
    privateKey: { type: String }
  }
);

const ManagementDb = mongoose.model('Management', managementSchema);
const TempAccountDb = mongoose.model('TempAccount', tempAccountSchema)

module.exports = {
  ManagementDb,
  TempAccountDb
};