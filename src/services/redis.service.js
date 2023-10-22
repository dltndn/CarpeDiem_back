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
  if (Number(usedMemory) > MAX_REDIS_MEMORY) return false
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

const setData = async (keyStr, value) => {
  try {
    await redisClient.rPush('gameKeyList', keyStr)
    return await redisClient.set(keyStr, JSON.stringify(value))
  } catch (e) {
    console.log('redis setData error: ', e)
  }
}

/**
 * 
 * @param keyStrArr key값 배열
 * @returns data 배열 반환
 */
const getDatas = async (keyStrArr) => {
  try {
    const result = await redisClient.mGet(keyStrArr)
    let parseArr = []
    for (const val of result) {
      const data = JSON.parse(val)
      if (data) {
        parseArr.push(data)
      }
    }
    return parseArr
  } catch (e) {
    console.log('redis getDatas error: ', e)
    return false
  }
}

/**
 * 
 * @description 오래된 데이터 3개 삭제
 * @returns bool
 */
const removeDatas = async () => {
  try {
    const removedGameKeys = await redisClient.lRange('gameKeyList', 0, 2)
    await redisClient.lTrim('gameKeyList', 3, -1)
    await redisClient.del(removedGameKeys, (err, data) => {
      if (err) {
        console.log('redis del error: ', err)
        return false
      }
      return true
    })
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
