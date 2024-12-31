const db = require('../database/db');

const getUserByEmail = async (email) => {
  return db('users').where({ email }).first();  // Find user by email
};

const createUser = async (user) => {
  return db('users').insert(user).returning('*');  // Insert new user into database
};

module.exports = { getUserByEmail, createUser };
