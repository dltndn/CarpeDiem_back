const { User } = require('../models')
const ethUtil = require('ethereumjs-util')
const sigUtil = require('eth-sig-util')

const getUserByAddress = async (address) => {
    return User.findOne({ address })
}

const createUser = async (address) => {
    const user = new User({
        address,
        nonce: Math.floor(Math.random() * 100000),
    })
    return user.save({ user })
}

const createMsg = (nonce) => `
  Welcome to Hash Draw!

  Approve this message to securely log in.
  This request will not trigger a blockchain transaction
  or cost any gas fees.

  Nonce:
  ${JSON.stringify(nonce)}`;

const verify = async ({ address, signature, nonce }) => {
    const msg = createMsg(nonce)
    const msgBufferHex = ethUtil.bufferToHex(Buffer.from(msg, 'utf-8'))
    const walletAddress = sigUtil.recoverPersonalSignature({
        data: msgBufferHex,
        sig: signature
    })

    if (address.toLowerCase() === walletAddress.toLowerCase()) {
        return true
    }

    return false
}

const updateNonce = async (userId) => {
    const user = await User.findById(userId)
    if (user) {
        user.nonce = Math.floor(Math.random() * 100000)
        await user.save()
    }
}

// db 데이터도 업데이트
const updateRefreshToken = async (userId, refreshToken) => {
    const user = await User.findById(userId)
    if (user) {
        user.refreshToken = refreshToken
        await user.save()
    }
}

const getAllUsers = async () => {
    return User.find({})
}

module.exports = {
    getUserByAddress,
    createUser,
    verify,
    updateNonce,
    updateRefreshToken,
    getAllUsers
}