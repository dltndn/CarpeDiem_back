const { Games, UserGameId } = require('../models')
const getDbKey = require('../utils/getDbKey')

/**
 * 
 * @param {*} arr 
 * @param {*} amount 
 * @param {*} seqNum 
 * @returns []
 * @description 배열의 끝 부터 amount개의 요소를 (seqNum * amount) - amonut번째 부터 가져오기
 */
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
 * @returns gameIdArr | undefined
 */
const getUserGameIdsByMongo = async (obj) => {
    const gameIdKey = getDbKey.getGameIdKeyByBetAmount(obj.betAmount)
    try {
        // mongoDB에서 플레이어 게임id 배열 가져오기 
        const dbGameIds = await UserGameId.findOne({ address: obj.playerAddress }, gameIdKey).exec()
        const gameIdArr = getArrayElements(dbGameIds[gameIdKey], obj.amount, obj.seqNum)
        if (gameIdArr.length === 0) {
            return []
        } 
        return gameIdArr
    } catch (e) {
        console.log("game.service getUserGameIdsByMongo함수 에러: ", e)
        return undefined
    }
}

/**
 * 
 * @param {*} obj - { betAmount, amount, seqNum }
 */
const getGameIdsByMongo = async (obj) => {
    const gamesKey = getDbKey.getGamesKeyByBetAmount(obj.betAmount)
    try {
        let gameIds = []
        // 최신 게임의 게임id 가져오기
        const lastGame = await Games[gamesKey].find().sort({ gameId: -1 }).limit(1).exec()
        const lastGameId = lastGame[0].gameId
        const startIndex = lastGameId - 1 - ((obj.seqNum-1) * obj.amount)
        for (let i=startIndex; i>startIndex - obj.amount; --i) {
            if (i < 1) {
                break
            }
            gameIds.push(i)
        }
        return { gameIds, lastGameId }
    } catch (e) {
        console.log("game.service getGameIdsByMongo함수 에러: ", e)
        return undefined
    }
}

/**
 * 
 * @param {*} betAmount 
 * @param {*} gameIdArr 
 * @returns [{ gameId, player1, player2, player3, player4, winnerSpot, rewardClaimed }] | undefined
 */
const getGamesByMongo = async (betAmount, gameIdArr) => {
    const gamesKey = getDbKey.getGamesKeyByBetAmount(betAmount)
    try {
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
        
        return result.reverse()
    } catch (e) {
        console.log("game.service getGamesByMongo 에러: ", e)
        return undefined
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

const getUserInfo = async (address) => {
    try {
        const userInfo = await UserGameId.findOne({ address }).exec()
        if (userInfo) {
            return userInfo
        } else {
            return null
        }
    } catch (e) {
        console.log('gameService getUserInfo error: ', e)
        return undefined
    }
}

module.exports = {
    getTopPrizeWinners,
    getUserGameIdsByMongo,
    getGamesByMongo,
    getGameIdsByMongo,
    getUserInfo
}