const ethers = require('ethers')

const INFURA_POLYGON_URL = `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`;
const INFURA_MUMBAI_URL = `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_API_KEY}`
const CHAIN_NAME = "Mumbai"
const CHAIN_ID = 80001

const networkInfo = {
    name: CHAIN_NAME,
    chainId: CHAIN_ID,
}

const currentProvider = new ethers.JsonRpcProvider(INFURA_MUMBAI_URL, networkInfo);

module.exports = {
    currentProvider
}