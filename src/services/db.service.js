const mongoose = require('mongoose');

const opts = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};


// Provide connection to a new in-memory database server.
const connect = async () => {
  // NOTE: before establishing a new connection close previous
  await mongoose.disconnect();

  try {
    await mongoose.connect(process.env.MONGODB_URI, opts);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    // Handle the error as needed, such as logging, throwing, or exiting the application.
  }
};

// Remove and close the database and server.
const close = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }

};


module.exports = {
  connect,
  close
};

const connectMongo = async (databaseName) => {
  if (keys.db.mongo === undefined) {
    throw new Error("dotenv의 MONGO_CHAT의 값이 없음");
  } else {
    return mongoose.createConnection(keys.db.mongo , {dbName: databaseName});
  }
};