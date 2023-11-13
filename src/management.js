const { dbService, redisService } = require("./services");

const connectDb = async () => {
  await dbService.connect();
  await redisService.connect();
  console.log(`Connected!`);
};

const disconnectDb = async () => {
    await dbService.close();
    await redisService.close()
    console.log('Disconnected!')
}

// mongoDB 초기화
// redis 초기화
// 누락된 오더들 추가
//  - mongoDB 오더들
// error log 조회