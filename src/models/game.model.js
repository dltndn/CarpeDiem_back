const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema(
  {
    gameId: { type: Number, unique: true, required: true, lowercase: true },
    player1: { type: String, required: false },
    player2: { type: String, required: false },
    player3: { type: String, required: false },
    player4: { type: String, required: false },
    targetBlockNumber: { type: String, required: false },
    targetBlockhash: { type: String, required: false },
    winnerSpot: { type: Number, required: false },
    rewardClaimed: { type: Boolean, required: true }
  });

const Game_2 = mongoose.model('Game_2', gameSchema);
const Game_10 = mongoose.model('Game_10', gameSchema);
const Game_50 = mongoose.model('Game_50', gameSchema);
const Game_250 = mongoose.model('Game_250', gameSchema);

module.exports = {
    Game_2,
    Game_10,
    Game_50,
    Game_250
};