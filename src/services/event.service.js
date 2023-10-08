const { Games } = require('../models')
const gameContractInfo = require('../contractInfo')

/**
 * 
 * @param address contract address
 * @returns game_2 || game_10 || game_50 || game_250
 */
const findKeyByAddress = (address) => {
    for (const key in gameContractInfo) {
        if (gameContractInfo[key] === address) {
          return key;
        }
      }
      return undefined;
}

/**
 * 
 * @param spot 
 * @returns string
 */
const getPlayerSpot = (spot) => {
    switch (spot) {
        case 1: 
            return 'player1'
        case 2: 
            return 'player2'
        case 3: 
            return 'player3'
        case 4: 
            return 'player4'
        default:
            return null
    }
}

/**
 * 
 * @param contractKey 
 * @param obj 
 * @returns game
 */
const createNewGame = async (contractKey, obj) => {
    const game = await Games[contractKey].create({
        gameId: obj.gameId,
        player1: obj.playerAddress,
        rewardClaimed: false
    })
    return game
}

/** 
 * @param obj contractAddress,
              gameId,
              playerAddress,
              spot
  * @returns boolean
*/
const updateGamePlayer = async (obj) => {
    const contractKey = findKeyByAddress(obj.contractAddress)
    if (contractKey) {
        // mongoDB gameId 조회
        const game = await Games[contractKey].findOne({ gameId: obj.gameId })
        if (game) {
            // player address 추가
            const updateFields = {};
            updateFields[getPlayerSpot(obj.spot)] = obj.playerAddress;
            const updatedGame = await game.updateOne(updateFields)
        } else {
            // game collection 만들기
            const newGame = await createNewGame(contractKey, obj)
            await newGame.save()
        }
        return true
    }
    return false
}

/**
 * @param obj contractAddress,
              gameId,
              targetBlockNumber,
              winnerSpot
  * @returns boolean
 */
const insertWinnerInfo = async (obj) => {
    const contractKey = findKeyByAddress(obj.contractAddress)
    if (contractKey) {
        
        // mongoDB 입력

        // mongoDB 출력 - model.exec()

        // redis 입력 - claim 여부 제외한 값

        return true
    }
    return false
}

/**
 * 
 * @param contractAddress 
 * @returns boolean
 */
const insertClaimRewardInfo = async (contractAddress) => {
    const contractKey = findKeyByAddress(contractAddress)
    if (contractKey) {
        
        // mongoDB 입력

        return true
    }
    return false
}

module.exports = {
    updateGamePlayer,
    insertWinnerInfo,
    insertClaimRewardInfo
}