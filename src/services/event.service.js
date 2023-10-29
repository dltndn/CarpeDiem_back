const { Games, UserGameId } = require('../models')
const {findKeyByAddress, getGameIdKeyByContractKey} = require('../utils/getDbKey')

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
 * 
 * @param playerAddress 
 * @returns 
 */
const createNewUserGameId = async (playerAddress) => {
    const gameIds = await UserGameId.create({
        address: playerAddress
    })
    return gameIds
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
        const updateFields = {};
        updateFields[getPlayerSpot(obj.spot)] = obj.playerAddress;
        if (game) {
            // player address 추가    
            await game.updateOne(updateFields)
            await game.save()
        } else {
            // game collection 만들기
            const newGame = await createNewGame(contractKey, obj)
            await newGame.updateOne(updateFields)
            await newGame.save()
        }
        // user가 참여한 gameID 목록 추가
        const gameIdKey = getGameIdKeyByContractKey(contractKey)
        const userGameId = await UserGameId.findOne({ address: obj.playerAddress })
        // gameId DB에 해당 정보가 없으면 추가
        if (userGameId === null) {
            const newUserGameId = await createNewUserGameId(obj.playerAddress)
            newUserGameId[gameIdKey].push(obj.gameId)
            await newUserGameId.save()
        } else {
            userGameId[gameIdKey].push(obj.gameId)
            await userGameId.save()
        }
        return true
    }
    return false
}

/** 
 * @param obj contractAddress,
              gameId,
              playerAddress,
              claimRewards
  * @returns boolean
*/
const updateClaimRewardsInfo = async (obj) => {
    const contractKey = findKeyByAddress(obj.contractAddress)
    if (contractKey) {
        // mongoDB gameId 조회
        const game = await Games[contractKey].findOne({ gameId: obj.gameId })
        // mongoDB 입력
        if (game) {
            // rewardClaimed 정보 수정
            await game.updateOne({ rewardClaimed: true })
            const userGameId = await UserGameId.findOne({ address: obj.playerAddress })
            const beforTotalRewards = userGameId.totalRewards
            if (beforTotalRewards) {
                await userGameId.updateOne({ totalRewards: beforTotalRewards + obj.claimRewards })
            } else {
                await userGameId.updateOne({ totalRewards: obj.claimRewards })
            }
            await userGameId.save()
        } else {
            console.log("error: Attempted to query for game data via ClaimRewardEvent, but the data is not present in the database.")
        }
        return true
    }
    return false
}

/**
 * @param obj contractAddress,
              gameId,
              resultHash,
              winnerSpot
  * @returns boolean
 */
const insertWinnerInfo = async (obj) => {
    const contractKey = findKeyByAddress(obj.contractAddress)
    if (contractKey) {
        // mongoDB gameId 조회
        const game = await Games[contractKey].findOne({ gameId: obj.gameId })
        // mongoDB 입력
        if (game) {
            // winner 정보 추가
            await game.updateOne({ resultHash: obj.resultHash, winnerSpot: obj.spot })
        } else {
            console.log("error: Attempted to query for game data via efpEvent, but the data is not present in the database.")
        }

        return true
    }
    return false
}

module.exports = {
    findKeyByAddress,
    updateGamePlayer,
    updateClaimRewardsInfo,
    insertWinnerInfo,
}


// updatedGame:  {
//     _id: new ObjectId("652b7a94b2119d2509ee955f"),
//     gameId: 7,
//     player1: '0x1e1864802DcF4A0527EF4315Da37D135f6D1B64B',
//     rewardClaimed: false,
//     __v: 0,
//     player2: '0x1e1864802DcF4A0527EF4315Da37D135f6D1B64B',
//     player3: '0x521D5d2d40C80BAe1fec2e75B76EC03eaB82b4E0',
//     player4: '0xd397AEc78be7fC14ADE2D2b5F03232b04A7AB42E',
//     resultHash: '0x25375d4e11e292240c132e18e3cead049eb52e018d058713459c9639f9f6015d',
//     winnerSpot: 2
//   }
  