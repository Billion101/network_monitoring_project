const db = require('../config/db');

const UserModel = {
  findByUsername: async (username) => {
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0];
  }
};

module.exports = UserModel;
