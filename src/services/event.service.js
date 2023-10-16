const { Games, UserGameId } = require('../models')
const gameContractInfo = require('../contractInfo')
const { redisService } = require('./index');
const { rpushGamesKey } = require('./redis.service');

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

        // redis에 넣을 데이터
        const updatedGame = await Games[contractKey].findOne({ gameId: obj.gameId })

        const isMemorySpaceAvailable = await redisService.isMemorySpaceAvailable()
        // redis 용량 관리를 위한 오래된 메모리 삭제
        if (!isMemorySpaceAvailable) {
            // 오래된 게임 데이터 3개 삭제
            await redisService.removeDatas()
        }

        // redis 입력 
        await redisService.setData(`${contractKey}:${updatedGame.gameId}`, updatedGame)
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
    insertClaimRewardInfo,
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
  