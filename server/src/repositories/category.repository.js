const pool = require('../db/pool');

function toCamel(row) {
  if (!row) return null;
  return {
    categoryId: row.category_id,
    userId: row.user_id,
    name: row.name,
    colorCode: row.color_code,
    isDefault: row.is_default,
    createdAt: row.created_at,
  };
}

async function findAllByUserId(userId) {
  const { rows } = await pool.query(
    `SELECT category_id, user_id, name, color_code, is_default, created_at
       FROM categories
      WHERE is_default = TRUE OR user_id = $1
      ORDER BY is_default DESC, name ASC`,
    [userId]
  );
  return rows.map(toCamel);
}

async function findById(categoryId) {
  const { rows } = await pool.query(
    `SELECT category_id, user_id, name, color_code, is_default, created_at
       FROM categories WHERE category_id = $1`,
    [categoryId]
  );
  return toCamel(rows[0]);
}

async function findByUserAndName(userId, name) {
  const { rows } = await pool.query(
    `SELECT category_id, user_id, name, color_code, is_default, created_at
       FROM categories WHERE user_id = $1 AND name = $2`,
    [userId, name]
  );
  return toCamel(rows[0]);
}

async function insertOne({ userId, name, colorCode }) {
  const { rows } = await pool.query(
    `INSERT INTO categories (user_id, name, color_code, is_default)
     VALUES ($1, $2, $3, FALSE)
     RETURNING category_id, user_id, name, color_code, is_default, created_at`,
    [userId, name, colorCode]
  );
  return toCamel(rows[0]);
}

async function updateById(categoryId, fields) {
  const setClauses = [];
  const values = [];
  let idx = 1;
  const map = { name: 'name', colorCode: 'color_code' };
  for (const [key, col] of Object.entries(map)) {
    if (fields[key] !== undefined) {
      setClauses.push(`${col} = $${idx++}`);
      values.push(fields[key]);
    }
  }
  if (setClauses.length === 0) return findById(categoryId);
  values.push(categoryId);
  const { rows } = await pool.query(
    `UPDATE categories SET ${setClauses.join(', ')} WHERE category_id = $${idx}
     RETURNING category_id, user_id, name, color_code, is_default, created_at`,
    values
  );
  return toCamel(rows[0]);
}

async function deleteById(categoryId) {
  await pool.query('DELETE FROM categories WHERE category_id = $1', [categoryId]);
}

async function countTodos(categoryId) {
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS cnt FROM todos WHERE category_id = $1',
    [categoryId]
  );
  return rows[0].cnt;
}

module.exports = { findAllByUserId, findById, findByUserAndName, insertOne, updateById, deleteById, countTodos };
