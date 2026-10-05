const mongoose = require('mongoose');
let readConnection = null;
let writeConnection = null;
async function connectDatabases() {
  const readUri = process.env.MONGO_READ_URI;
  const writeUri = process.env.MONGO_WRITE_URI;

  if (!readUri || !writeUri) {
    throw new Error('Missing MONGO_READ_URI / MONGO_WRITE_URI in .env');
  }
  readConnection = mongoose.createConnection(readUri, { dbName: process.env.DB_NAME || 'DB_23IT067' });
  writeConnection = mongoose.createConnection(writeUri, { dbName: process.env.DB_NAME || 'DB_23IT067' });

  await Promise.all([
    new Promise((resolve, reject) => {
      readConnection.once('connected', resolve);
      readConnection.once('error', reject);
    }),
    new Promise((resolve, reject) => {
      writeConnection.once('connected', resolve);
      writeConnection.once('error', reject);
    }),
  ]);
  console.log('[db] readConnection ready (reader_23IT067)');
  console.log('[db] writeConnection ready (writer_23IT067)');
  return { readConnection, writeConnection };
}
function getReadConnection() {
  if (!readConnection) throw new Error('Read connection not initialised. Call connectDatabases() first.');
  return readConnection;
}
function getWriteConnection() {
  if (!writeConnection) throw new Error('Write connection not initialised. Call connectDatabases() first.');
  return writeConnection;
}

module.exports = { connectDatabases, getReadConnection, getWriteConnection };
