const mongoose = require('mongoose');

const userGameIdSchema = new mongoose.Schema(
  {
    address: { type: String, unique: true, required: true, lowercase: true },
    gameIds_2: { type: [Number] },
    gameIds_10: { type: [Number] },
    gameIds_50: { type: [Number] },
    gameIds_250: { type: [Number] },
  });

const UserGameId = mongoose.model('UserGameId', userGameIdSchema);

module.exports = UserGameId;