const { Games, UserGameId } = require('../models')

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

module.exports = {
    getTopPrizeWinners
}