const { createClient } = require("redis");

const MAX_REDIS_MEMORY = 30000000

const env = process.env;

const redisClient = createClient({
  password: env.REDIS_LABS_PASSWORD,
  socket: {
    host: env.REDIS_LABS_HOST,
    port: env.REDIS_LABS_PORT,
  },
});

const connect = async () => {
  redisClient.on("error", (err) => console.log("Redis Client Error", err));

  try {
    await redisClient.connect();
    console.log("Redis connected");
  } catch (e) {
    console.error("Error connecting to Redis:", error);
  }
};

const close = async () => {
  try {
    await redisClient.disconnect();
    console.log("Redis disconnected");
  } catch (e) {
    console.error("Error disconnecting from Redis:", e);
  }
};

/**
 * 
 * @returns redis's used memory(byte) - number
 */
const isMemorySpaceAvailable = async () => {
  const memoryInfo = await redisClient.info('memory');
  let usedMemory = memoryInfo.split('\n').find(line => line.startsWith('used_memory')).split(':')[1];
  if (Number(usedMemory) > MAX_REDIS_MEMORY * 0.7) return false
  return true
}

const getAllGameKeys = async () => {
  try {
    const result = await redisClient.lRange('gameKeyList', 0, -1)
    return result
  } catch (e) {
    console.log('redis getAllGameKeys error: ', e)
    return false
  }
}

/**
 * 
 * @param {*} keyStr gameKeyList에 저장할 값 ex)Game_2:15 
 * @param {*} gameType game타입 ex) Game_2
 * @param {*} score - redis sorted set타입 score
 * @param {*} value 
 * @returns 
 */
const setData = async (keyStr, gameType, score, value) => {
  try {
    const strVal = JSON.stringify(value)
    // gameKey list 타입에 저장
    await redisClient.rPush('gameKeyList', keyStr)
    // game 데이터 sotred set 타입으로 저장
    return await redisClient.zAdd(gameType,{ score, value: strVal })
  } catch (e) {
    console.log('redis setData error: ', e)
  }
}

/**
 * 
 * @param gameType key값 - game타입 ex) Game_2
 * @param amount 불러올 데이터 컬럼 수량
 * @param seqNum 몇 번째인지
 * @returns data 배열 반환
 */
const getDatas = async (gameType, amount, seqNum) => {
  let startNum = -1 * amount * seqNum
  let endNum = startNum + amount - 1
  try {
    const result = await redisClient.zRange(gameType, startNum, endNum)
    if (result.length === 0) {
      return []
    }
    let parseArr = []
    for (const val of result) {
      const data = JSON.parse(val)
      if (data) {
        parseArr.push(data)
      }
    }
    return parseArr.reverse()
  } catch (e) {
    console.log('redis getDatas error: ', e)
    return false
  }
}

/**
 * 
 * @description 오래된 데이터 500개 삭제
 * @returns bool
 */
const removeDatas = async () => {
  try {
    // ex) ["Game_2:3", "Game_2:4", "Game_2:5"]
    const removedGameKeys = await redisClient.lRange('gameKeyList', 0, 499) 
    await redisClient.lTrim('gameKeyList', 500, -1)

    // sorted set 데이터 삭제 코드
    for (const val of removedGameKeys) {
      const [gameType, gameId] = val.trim().split(':')
      const game = await redisClient.zRangeByScore(gameType, gameId, gameId)
      for (const gameVal of game) {
        await redisClient.zRem(gameType, gameVal) 
      }
    }

  } catch (e) {
    console.log('redis removeDatas error: ', e)
    return false
  }
}

module.exports = {
  connect,
  close,
  isMemorySpaceAvailable,
  getAllGameKeys,
  setData,
  getDatas,
  removeDatas
};

// const updatedGame = {
//   gameId: dbUpdatedGame.gameId,
//   player1: dbUpdatedGame.player1,
//   player2: dbUpdatedGame.player2,
//   player3: dbUpdatedGame.player3,
//   player4: dbUpdatedGame.player4,
//   winnerSpot: dbUpdatedGame.winnerSpot
// }