const gameContractInfo = require('../contractInfo')

/**
 * 
 * @param address contract address
 * @returns game_2 || game_10 || game_50 || game_250
 */
const findKeyByAddress = (address) => {
    for (const key in gameContractInfo) {
        if (gameContractInfo[key].toLowerCase() === address) {
          return key;
        }
      }
      return undefined;
}

/**
 * 
 * @param contractKey 
 * @returns string
 */
const getGameIdKeyByContractKey = (contractKey) => {
    switch (contractKey) {
        case 'Game_2':
            return 'gameIds_2'
        case 'Game_10':
            return 'gameIds_10'
        case 'Game_50':
            return 'gameIds_50'
        case 'Game_250':
            return 'gameIds_250'
        default:
            return null
    }
}

/**
 * 
 * @param betAmount 
 * @returns string
 */
const getGameIdKeyByBetAmount = (betAmount) => {
    switch (betAmount) {
        case 2:
            return 'gameIds_2'
        case 10:
            return 'gameIds_10'
        case 50:
            return 'gameIds_50'
        case 250:
            return 'gameIds_250'
        default:
            return null
    }
}

/**
 * 
 * @param betAmount - number
 * @returns string
 */
const getGamesKeyByBetAmount = (betAmount) => {
switch (betAmount) {
        case 2:
            return 'Game_2'
        case 10:
            return 'Game_10'
        case 50:
            return 'Game_50'
        case 250:
            return 'Game_250'
        default:
            return null
    }
}

module.exports = {
    findKeyByAddress,
    getGameIdKeyByContractKey,
    getGameIdKeyByBetAmount,
    getGamesKeyByBetAmount
}