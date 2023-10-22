const { Games, UserGameId } = require('../models')
const gameContractInfo = require('../contractInfo')

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
 * @param betAmount 
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

const getTopPrizeWinners = async (amount) => {
    try {
        // mongoDB에서 상위 플레이어 정보 가져오기 
        const players =  await UserGameId.find()
        .sort({ totalRewards: -1 })
        .limit(amount)
        .exec()
        return players
    } catch (e) {
        console.log('gameService getTopPrizeWinners error: ', e)
        return null
    } 
}

const getArrayElements = (arr, amount, seqNum) => {
    const start = -1 * amount * seqNum;
    if (seqNum === 1) {
        return arr.slice(start);
    }
    const end = start + amount;
    return arr.slice(start, end);
}

/**
 * 
 * @param {*} obj - { playerAddress, betAmount, amount, seqNum }
 * @returns [{ gameId, player1, player2, player3, player4, winnerSpot, rewardClaimed }] | null
 */
const getUserGames = async (obj) => {
    const gameIdKey = getGameIdKeyByBetAmount(obj.betAmount)
    const gamesKey = getGamesKeyByBetAmount(obj.betAmount)

    try {
        // mongoDB에서 플레이어 게임id 배열 가져오기 
        const dbGameIds = await UserGameId.findOne({ address: obj.playerAddress }, gameIdKey).exec()
        const gameIdArr = getArrayElements(dbGameIds[gameIdKey], obj.amount, obj.seqNum)
        if (gameIdArr.length === 0) {
            return []
        } 
        // mongoDB에서 game 객체 배열 가져오기
        let result = []
        const dbGames = await Games[gamesKey].find({ gameId: { $in: gameIdArr } }).exec();
        for (const game of dbGames) {
            result.push({
                gameId: game.gameId,
                player1: game.player1,
                player2: game.player2,
                player3: game.player3,
                player4: game.player4,
                winnerSpot: game.winnerSpot,
                rewardClaimed: game.rewardClaimed
            })
        }
        return result
    } catch (e) {
        console.log('gameService getUserGameid error: ', e)
        return null
    }
}

module.exports = {
    getTopPrizeWinners,
    getUserGames
}