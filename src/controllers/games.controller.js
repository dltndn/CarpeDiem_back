const httpStatus = require("http-status");
const { gameService, redisService, eventService } = require("../services");
const getDbKey = require('../utils/getDbKey')
const ethers = require("ethers");
const contractInfo = require("../contractInfo");
const { currentProvider } = require("../utils/ethersProvider");

const test = async (req, res) => {
    const reqData = req.body;
    const { amount } = reqData


    res.status(httpStatus.OK).send({ amount })
}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
const getTopWinnersMini = async (req, res) => {
    // getTopPrizeWinners from mongoDB
    const players = await gameService.getTopPrizeWinners(3)

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
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send()
    }
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
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send()
    }

}

const getUserTotalRewards = async (req, res) => {
    const reqData = req.body;
    const { playerAddress } = reqData

    const playerInfo = await gameService.getUserInfo(playerAddress)

    if (playerInfo === undefined) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send()
    } else if (playerInfo === null) {
        res.status(httpStatus.OK).send({ rewards: 0 })
    } else {
        const rewards = playerInfo.totalRewards
        res.status(httpStatus.OK).send({ rewards })
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

    const gameIds = await gameService.getUserGameIdsByMongo(obj)
    if (gameIds === undefined) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send()
    } else if (gameIds.length === 0) {
        res.status(httpStatus.NO_CONTENT).send()
    }

    const games = await gameService.getGamesByMongo(obj.betAmount, gameIds)
    if (games.length === 0) {
        res.status(httpStatus.NO_CONTENT).send()
    } else if (games === undefined) {
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
    
    // getGames by redis or mongoDB
    // redis에서 game들 가져오기
    const redisDatas = await redisService.getDatas(getDbKey.getGamesKeyByBetAmount(obj.betAmount), obj.amount, obj.seqNum)
    if (!redisDatas) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send()
    }
    
    const dataAmountForMongo = obj.amount - redisDatas.length

    if (dataAmountForMongo === 0) {
        // redis에 모든 타겟 정보가 있을 때
        const lastGameId = redisDatas[0].gameId + 1
        const games = [...redisDatas]
        res.status(httpStatus.OK).send({ games, lastGameId })
    } else if (dataAmountForMongo === obj.amount) {
        // redis에 모든 타겟 정보가 없거나 일부만 있을 때
        // mongoDB에서 최신순으로 2번째 데이터부터
        const { gameIds, lastGameId } = await gameService.getGameIdsByMongo(obj)
        const mongoGames = await gameService.getGamesByMongo(obj.betAmount, gameIds)
        if (mongoGames === undefined) {
            res.status(httpStatus.INTERNAL_SERVER_ERROR).send()
        }
        res.status(httpStatus.OK).send({ games: mongoGames, lastGameId })
    } 
    // else {
    //     // redis에 일부 타겟 정보만 있을 때
    //     const lastGameId = redisDatas[0].gameId + 1
    //     const mongoAmount = obj.amount - redisDatas.length
    //     let mongoGameIds = []
    //     let startIndex = redisDatas[redisDatas.length-1].gameId - 1
    //     for (let i=startIndex; i>startIndex-mongoAmount; --i) {
    //         if (i < 1) {
    //             break
    //         }
    //         mongoGameIds.push(i)
    //     }
    //     const mongoGames = await gameService.getGamesByMongo(obj.betAmount, mongoGameIds)
    //     if (mongoGames === undefined) {
    //         res.status(httpStatus.INTERNAL_SERVER_ERROR).send()
    //     }
    //     const games = redisDatas.concat(mongoGames)
    //     res.status(httpStatus.OK).send({ games, lastGameId })
    // }
}

/**
 * 
 * @param {*} req - { betAmount: number, gameIds: number[] }
 * @param {*} res - [{gameId, player1, player2, player3, player4, winnerSpot}, ...]
 */
const getGamesByIds = async (req, res) => {
    const reqData = req.body;
    const { betAmount, gameIds } = reqData

    const mongoGames = await gameService.getGamesByMongo(betAmount, gameIds)
    if (mongoGames === undefined) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send()
    }
    res.status(httpStatus.OK).send({ games: mongoGames })
}

/**
 * 
 * @param {*} req - { betAmount: number, gameId: number }
 * @param {*} res 
 */
const updateClaimRewards = async (req, res) => {
    const reqData = req.body;
    const { betAmount, gameId } = reqData

    const convertedId = ethers.toBigInt(gameId)
    const contractAddress = contractInfo[getDbKey.getGamesKeyByBetAmount(betAmount)]
    
    
    // 블록체인의 game 정보에서 승자 지갑 주소와 solidity의 getRewardAmount메서드를 통해 claimRewards 계산 
    const contract = new ethers.Contract(contractAddress, contractInfo.implAbi, currentProvider)
    try {
        const gameInfo = await contract.games(convertedId)
        // rewardClaimed가 true임을 블록체인에서 확인
        if (gameInfo[2]) {
            const winnerSpot = Number(gameInfo[1])
            const players = await contract.getPlayersPerGameId(convertedId)
            const rewardAmount = Number(await contract.getRewardAmount())
            const playerAddress = players[winnerSpot - 1]

            const obj = {
                contractAddress, gameId, playerAddress, claimRewards: rewardAmount
            }
            if (!await eventService.updateClaimRewardsInfo(obj)) {
                res.status(httpStatus.INTERNAL_SERVER_ERROR).send()
            }
        } else {
            console.log("블록체인의 rewardClaimed가 false인데 updateClaimRewards함수가 실행됨")
            res.status(httpStatus.INTERNAL_SERVER_ERROR).send()
        }
        
    } catch (e) {
        console.log("updateClaimRewards error: ", e)
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send()
    }
    

    res.status(httpStatus.OK).send()
}

module.exports = {
    test,
    getTopWinnersMini,
    getTopWinners,
    getUserTotalRewards,
    getUserGames,
    getCurrentGames,
    getGamesByIds,
    updateClaimRewards
}