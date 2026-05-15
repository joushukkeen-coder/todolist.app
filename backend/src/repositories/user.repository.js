const pool = require('../db/pool');

function toCamel(row) {
  if (!row) return null;
  return {
    userId: row.user_id,
    email: row.email,
    name: row.name,
    authProvider: row.auth_provider,
    darkMode: row.dark_mode,
    language: row.language,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_COLS =
  'user_id, email, password_hash, name, auth_provider, dark_mode, language, created_at, updated_at';
const RETURNING_COLS =
  'user_id, email, name, auth_provider, dark_mode, language, created_at, updated_at';

async function findByEmail(email) {
  const { rows } = await pool.query(
    `SELECT ${SELECT_COLS} FROM users WHERE email = $1`,
    [email],
  );
  if (rows.length === 0) return null;
  const user = toCamel(rows[0]);
  user.passwordHash = rows[0].password_hash;
  return user;
}

async function insertOne({ email, passwordHash, name }) {
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, name, auth_provider)
     VALUES ($1, $2, $3, 'local')
     RETURNING ${RETURNING_COLS}`,
    [email, passwordHash, name],
  );
  return toCamel(rows[0]);
}

async function findById(userId) {
  const { rows } = await pool.query(
    `SELECT ${SELECT_COLS} FROM users WHERE user_id = $1`,
    [userId],
  );
  if (rows.length === 0) return null;
  const user = toCamel(rows[0]);
  user.passwordHash = rows[0].password_hash;
  return user;
}

async function updateById(userId, fields) {
  const setClauses = [];
  const values = [];
  let idx = 1;
  const map = {
    name: 'name',
    passwordHash: 'password_hash',
    darkMode: 'dark_mode',
    language: 'language',
  };
  for (const [key, col] of Object.entries(map)) {
    if (fields[key] !== undefined) {
      setClauses.push(`${col} = $${idx++}`);
      values.push(fields[key]);
    }
  }
  if (setClauses.length === 0) {
    return findById(userId);
  }
  values.push(userId);
  const { rows } = await pool.query(
    `UPDATE users SET ${setClauses.join(', ')} WHERE user_id = $${idx}
     RETURNING ${RETURNING_COLS}`,
    values,
  );
  if (rows.length === 0) return null;
  return toCamel(rows[0]);
}

async function deleteByEmail(email) {
  await pool.query('DELETE FROM users WHERE email = $1', [email]);
}

async function deleteById(userId) {
  await pool.query('DELETE FROM users WHERE user_id = $1', [userId]);
}

module.exports = { findByEmail, findById, insertOne, updateById, deleteByEmail, deleteById };
