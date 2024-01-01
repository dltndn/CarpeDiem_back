const { dbService, redisService, gameService, eventService } = require("./services");
const { managemetController } = require("../src/controllers/index")
const { UserGameId, Games } = require("./models")
const contractInfo = require("./contractInfo")
const { getGameIdKeyByContractKey } = require("./utils/getDbKey")
const ethers = require('ethers')
const { currentProvider } = require('./utils/ethersProvider')
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// mongoDB 초기화
// - 베팅금액별 초기화
// - 유저 정보 초기화
const removeMongoData = async (num) => {
    try {
        switch (num) {
            case 1: // 유저 참여 게임 정보 전부 삭제
                await UserGameId.deleteMany({}) 
                console.log("유저 참가 정보 및 토탈 리워드 삭제")
                break
            case 2: // 게임 정보 전부 삭제
                await Games.Game_2.deleteMany({})
                console.log("Game_2 삭제 완료")
                await Games.Game_10.deleteMany({})
                console.log("Game_10 삭제 완료")
                await Games.Game_50.deleteMany({})
                console.log("Game_50 삭제 완료")
                await Games.Game_250.deleteMany({})
                console.log("Game_250 삭제 완료")
            case 3: // Game_2만 삭제
                await Games.Game_2.deleteMany({})
                console.log("Game_2 삭제 완료")
                break
            case 4: // Game_10만 삭제
                await Games.Game_10.deleteMany({})
                console.log("Game_10 삭제 완료")
                break
            case 5: // Game_50만 삭제
                await Games.Game_50.deleteMany({})
                console.log("Game_50 삭제 완료")
                break
            case 6: // Game_250만 삭제
                await Games.Game_250.deleteMany({})
                console.log("Game_250 삭제 완료")
                break
            default :
                console.log("잘못된 선택")
                break
        }
    } catch (e) {
        console.log("removeMongoData error: ", e)
    }
}

// redis 초기화
const manageRedisData = async (num) => {
    try {
        switch (num) {
            case 1: // redis data 전부 삭제
                await redisService.removeAllData()
                break 
            case 2: // redis key 전부 불러오기
                const keys = await redisService.getAllGameKeys()
                for (const val of keys) {
                    console.log(val)
                }
                break
            default :
                console.log("잘못된 선택")
                break
        }
    } catch (e) {
        console.log("manageRedisData error: ", e)
    }
    
  };
  

// 누락된 게임들
//  - mongoDB 게임들 추가(게임별))
// lastValidateId - 마지막으로 확인할 id
const managementMongoData = async (num, lastValidateId) => {
    // 최신 game id 조회
    // 마지막으로 확인한 game id까지 mongoDB조회 반복 - player 4명 존재여부
    // 누락된 id들 블록체인에서 데이터 조회 후 mongoDB에 저장
    try {
        switch (num) {
            case 1: // 누락된 Game_2 오더 번호 조회
                await findMissingGameId("Game_2", lastValidateId)
                break
            case 2: // 누락된 Game_10 오더 번호 조회
                await findMissingGameId("Game_10", lastValidateId)
                break
            case 3: // 누락된 Game_50 오더 번호 조회
                await findMissingGameId("Game_50", lastValidateId)
                break
            case 4: // 누락된 Game_250 오더 번호 조회
                await findMissingGameId("Game_250", lastValidateId)
                break
            case 5: // 누락된 Game_2 오더 번호 조회 후 블록체인 데이터 삽입
                await injectMissingGames("Game_2", lastValidateId)
                break
            case 6: // 누락된 Game_10 오더 번호 조회 후 블록체인 데이터 삽입
                await injectMissingGames("Game_10", lastValidateId)
                break
            case 7: // 누락된 Game_50 오더 번호 조회 후 블록체인 데이터 삽입
                await injectMissingGames("Game_50", lastValidateId)
                break
            case 8: // 누락된 Game_250 오더 번호 조회 후 블록체인 데이터 삽입
                await injectMissingGames("Game_250", lastValidateId)
                break
            default :
                console.log("잘못된 선택")
                break
        }

    } catch (e) {
        console.log("managementMongoData error: ", e)
    }
}

// 

// error log 조회

const test = async () => {
    console.log("work")
}

const init = async () => {
    console.log("관리 기능 함수 실행하려면 y 입력(입력 하기 전에 확인 필수)")
    rl.on("line", async (line) => {
        // 한 줄씩 입력받은 후 실행할 코드
        // 입력된 값은 line에 저장된다.
        if (line === "y") {
            await autoUserRepeat(10) //<--------------------------------- 실행할 함수 삽입
        } else {
            console.log("관리 기능 함수 실행x")
        }
        rl.close(); // 필수!! close가 없으면 입력을 무한히 받는다.
    });
    rl.on('close', () => {
        // 입력이 끝난 후 실행할 코드
        console.log("실행 끝")
        // process.exit();
    })
}

module.exports = { init }

// 가상 유저 생성 후 게임에 참여시키는 코드
/**
 * @param num 반복 횟수
 */
const autoUser = async (num) => {
    if (num > 0) {
        for (let i=0; i<num; ++i) {
            const result = await managemetController.autoTest(i)
            if (!result) {
                return
            }
        }
    }
    console.log(`autoTest 함수 ${num}회 완료`)
}

// 가상 유저 claimReward 함수 실행 코드
/**
 * @param 
 */
const autoClaim = async (startNum, endNum) => {
    await managemetController.autoClaim(startNum, endNum)
    console.log("자동 클레임 완료")
}

// 이전에 참여했던 가상 유저를 게임에 참여시키는 코드
/**
 * @param num 랜덤 유저 수
 */
const autoUserRepeat = async (num) => {
    if (num > 0) {
        const successAmount = await managemetController.autoUserRepeat(num)
    }
    console.log(`autoUserRepeat 함수 가상 계정${num}개중 ${successAmount}개 완료`)
}

// mongoDB에 없는 게임을 조회할 때는 블록체인의 최근 게임 - 1 부터 조회해야함(data injection 층돌이 날 수도 있음)

// 블록체인의 event log에서 최근 게임 id - 1을 조회하는 함수
/**
 * 
 * @param {*} gameKind ex) Game_2
 */
const getLastGameidByBlockchain = async (gameKind) => {
    try {
        const contract = new ethers.Contract(contractInfo[gameKind], contractInfo.abi, currentProvider)
        const currentGameId = Number(await contract.gameCurrentId())
        return currentGameId - 1
    } catch (e) {
        console.log("getLastGameidByBlockchain error: ", e)
        return undefined
    }
}

/**
 * 
 * @param {*} gameKind ex) Game_2
 */
const getGameInfoByBlockchain = async (gameKind, gameId) => {
    const convertedId = ethers.toBigInt(gameId)
    try {
        const contract = new ethers.Contract(contractInfo[gameKind], contractInfo.implAbi, currentProvider)
        const gameInfo = await contract.games(convertedId)
        const players = await contract.getPlayersPerGameId(convertedId)
        let result = {
            gameId: gameId,
            player1: players[0],
            player2: players[1],
            player3: players[2],
            player4: players[3],
            resultHash: gameInfo[0],
            winnerSpot: Number(gameInfo[1]),
            rewardClaimed: gameInfo[2]
        }
        return result
    } catch (e) {
        console.log("getGameInfoByBlockchain error: ", e)
        return undefined
    }
}

/**
 * 
 * @param {*} gameKind - ex) Game_2
 * @param {*} lastValidateId - 마지막으로 확인할 id
 */
const findMissingGameId = async (gameKind, lastValidateId) => {
    console.log("누락된 id 조회중...")
    const lastGameId = await getLastGameidByBlockchain(gameKind)
    if (!lastGameId) {
        console.log("findMissingGameId error: 블록체인 데이터 조회 오류")
        return undefined
    }
    if (lastValidateId > lastGameId) {
        console.log("findMissingGameId error: 잘못된 파라미터 입력")
        return undefined
    }
    let searchId = []
    for (let i=lastGameId; i>=lastValidateId; --i) {
        searchId.push(i)
    }
    let missingIds = []
    for (let i=0; i<searchId.length; ++i) {
        const game = await Games[gameKind].findOne({ gameId: searchId[i] }).exec()
        if (!game) {
            missingIds.push(searchId[i])
        } else {
            if (game.player4) {
                continue
            } else {
                if (!game.player4 || !game.player3 || !game.player2) {
                    missingIds.push(searchId[i])
                    await Games[gameKind].deleteOne({ gameId: searchId[i] })
                }
            }
        }
    }
    console.log("누락된 id 목록: ", missingIds)
    return missingIds
}

/**
 * 
 * @param {*} gameKind - ex) Game_2
 * @param {*} lastValidateId - 마지막으로 확인할 id
 */
const injectMissingGames = async (gameKind, lastValidateId) => {
    const missingIds = await findMissingGameId(gameKind, lastValidateId)
    if (!missingIds) {
        return undefined
    } else if (missingIds.length === 0) {
        console.log("누락된 id 없음")
        return undefined
    }
    console.log("누락된 id 데이터 주입중...")
    let gamesFailIds = []
    let userGameIdFailIds = []
    for (const val of missingIds) {
        // game 추가
        const gameInfo = await getGameInfoByBlockchain(gameKind, val)
        try {
            // db에 있으면 삭제
            await Games[gameKind].create(gameInfo)
            if (!await injectUserGameId(gameInfo.player1, val, gameKind)) {
                userGameIdFailIds.push(val)
            }
            if (!await injectUserGameId(gameInfo.player2, val, gameKind)) {
                userGameIdFailIds.push(val)
            }
            if (!await injectUserGameId(gameInfo.player3, val, gameKind)) {
                userGameIdFailIds.push(val)
            }
            if (!await injectUserGameId(gameInfo.player4, val, gameKind)) {
                userGameIdFailIds.push(val)
            }
            console.log(`game id ${val} mongoDB 주입 완료`)
        } catch (e) {
            console.log(`game id ${val} mongoDB 주입 실패`)
            gamesFailIds.push(val)
        }
    }
    if (gamesFailIds.length !== 0) {
        console.log(`주입 실패 id: ${gamesFailIds}`)
    }
}

const injectUserGameId = async (address, gameId, gameKind) => {
    try {
        const gameIdKey = getGameIdKeyByContractKey(gameKind)
        const userGameId = await UserGameId.findOne({ address })
        if (userGameId === null) {
            const newUserGameId = await UserGameId.create({
                address
            })
            newUserGameId[gameIdKey].push(gameId)
            await newUserGameId.save()
        } else {
            userGameId[gameIdKey].push(gameId)
            await userGameId.save()
        }
        console.log(`${address} user game ids ${gameId} mongoDB 주입 완료`)
        return true
    } catch (e) {
        console.log(`${address} user game ids ${gameId} mongoDB 주입 실패`)
        return false
    }
}