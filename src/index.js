require("dotenv").config();
const app = require('./app');
const { dbService, redisService } = require("./services");
const { init } = require("./management")

const server = app.listen(process.env.PORT, async () => {
  console.log(`Listening to port ${process.env.PORT}`);
  await dbService.connect();
  await redisService.connect()
  console.log(`Connected!`);
  if (process.env.NODE_ENV === "development") {
    await init()
  } 
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', async () => {
  console.log('SIGTERM received');
  if (server) {
    await dbService.close();
    await redisService.close()
    server.close();
  }
});