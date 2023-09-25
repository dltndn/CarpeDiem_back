const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const opts = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// Provide connection to a new in-memory database server.
const connect = async () => {
  // NOTE: before establishing a new connection close previous
  await mongoose.disconnect();

  mongoServer = await MongoMemoryServer.create();

  const mongoUri = mongoServer.getUri();
  try {
    await mongoose.connect(mongoUri, opts);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    // Handle the error as needed, such as logging, throwing, or exiting the application.
  }
};

// Remove and close the database and server.
const close = async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
};

// Remove all data from collections
const clear = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    collections[key].deleteMany();
  }
};

module.exports = {
  connect,
  close,
  clear,
};