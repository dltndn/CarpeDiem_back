const httpStatus = require("http-status");
const { gameService } = require("../services");
const ethers = require("ethers");

const test = (req, res) => {
    accessToken = 1234
    res.status(httpStatus.OK).send({ accessToken })
}

/**
 * 
 * @param {*} req - { amount: number }
 */
const getTopWinners = async (req, res) => {
    const reqData = req.body;
    const { amount } = reqData

    // getTopPrizeWinners from mongoDB
    const players = await gameService.getTopPrizeWinners(amount)

    if (players) {
        let winners = []
        for (const val of players) {
            if (val.totalRewards) {
                const info = {
                    playerAddress: ethers.getAddress(val.address),
                    totalRewards: val.totalRewards,
                }
                winners.push(info)
            }
        }
        res.status(httpStatus.OK).send({ winners })
    } else {
        console.log('There are no players yet.')
        res.status(httpStatus.OK).send()
    }

}

/**
 * 
 * @param {*} req - { playerAddress: string, betAmount: number, amount: number, seqNum: number }
 * @param {*} res  - [{gameId, player1, player2, player3, player4, rewardClaimed, winnerSpot}, ...]
 */
const getUserGames = async (req, res) => {
    const reqData = req.body;
    const { playerAddress, betAmount, amount, seqNum } = reqData

    // getUserGameids from mongoDB
    const obj = {
        playerAddress,
        betAmount,
        amount,
        seqNum
    }
    const games = await gameService.getUserGames(obj)
    if (games.length === 0) {
        res.status(httpStatus.NO_CONTENT).send()
    } else if (games === null) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send()
    }

    res.status(httpStatus.OK).send({ games })
}

/**
 * 
 * @param {*} req - { betAmount: number, amount: number, seqNum: number }
 * @param {*} res - [{gameId, player1, player2, player3, player4, winnerSpot}, ...]
 */
const getCurrentGames = async (req, res) => {
    const reqData = req.body;
    const { betAmount, amount, seqNum } = reqData

    const obj = {
        betAmount,
        amount,
        seqNum
    }
    // getUserGameids from mongoDB
    
    
    // getGames for redis or mongoDB
}

module.exports = {
    test,
    getTopWinners,
    getUserGames,
    getCurrentGames
}


