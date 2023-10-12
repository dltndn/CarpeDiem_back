const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    address: { type: String, unique: true, required: true, lowercase: true },
    nonce: { type: Number, required: true },
    refreshToken: { type: String },
    gameIds: { type: [Number] }
  });

const User = mongoose.model('User', userSchema);

module.exports = User;