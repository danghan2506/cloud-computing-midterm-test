const bcrypt = require('bcryptjs');
const { Schema } = require('mongoose');
const { getWriteConnection, getReadConnection } = require('../config/db');

const SALT_ROUNDS = 10;

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
    passwordHash: { type: String, required: true },
    fullName: { type: String, default: '' },
    studentId: { type: String, default: '23IT067' },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'users' }
);

// Writes (register) must go through the write-privileged connection.
function getWriteUserModel() {
  const conn = getWriteConnection();
  return conn.models.UserWrite || conn.model('UserWrite', userSchema);
}

// Reads (login lookup) go through the read-only connection.
function getReadUserModel() {
  const conn = getReadConnection();
  try {
    return conn.model('UserRead');
  } catch {
    return conn.model('UserRead', userSchema);
  }
}

async function hashPassword(plainPassword) {
  if (!plainPassword || plainPassword.length < 4) {
    const err = new Error('Password must be at least 4 characters');
    err.statusCode = 400;
    throw err;
  }
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

async function comparePassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

async function findByUsername(username) {
  const UserRead = getReadUserModel();
  return UserRead.findOne({ username }).lean();
}

async function createUser({ username, plainPassword, fullName }) {
  const UserWrite = getWriteUserModel();
  const passwordHash = await hashPassword(plainPassword);
  return UserWrite.create({ username, passwordHash, fullName, studentId: '23IT067' });
}

module.exports = { getWriteUserModel, getReadUserModel, hashPassword, comparePassword, findByUsername, createUser };
