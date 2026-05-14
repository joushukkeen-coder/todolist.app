const pool = require('../db/pool');

function toCamel(row) {
  if (!row) return null;
  return {
    todoId: row.todo_id,
    userId: row.user_id,
    categoryId: row.category_id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    isCompleted: row.is_completed,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_COLUMNS = `todo_id, user_id, category_id, title, description,
  due_date, is_completed, completed_at, created_at, updated_at`;

async function insertOne({ userId, categoryId, title, description, dueDate }) {
  const { rows } = await pool.query(
    `INSERT INTO todos (user_id, category_id, title, description, due_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${SELECT_COLUMNS}`,
    [userId, categoryId, title, description ?? null, dueDate ?? null]
  );
  return toCamel(rows[0]);
}

const FILTER_COLUMN_MAP = {
  categoryId: 'category_id',
  isCompleted: 'is_completed',
  dueDateFrom: 'due_date',
  dueDateTo: 'due_date',
};

async function findAllByUserId(userId, filters = {}) {
  const where = ['user_id = $1'];
  const values = [userId];
  let idx = 2;
  let dueDateFiltered = false;

  if (filters.categoryId !== undefined) {
    where.push(`${FILTER_COLUMN_MAP.categoryId} = $${idx++}`);
    values.push(filters.categoryId);
  }
  if (filters.isCompleted !== undefined) {
    where.push(`${FILTER_COLUMN_MAP.isCompleted} = $${idx++}`);
    values.push(filters.isCompleted);
  }
  if (filters.dueDateFrom !== undefined) {
    where.push(`${FILTER_COLUMN_MAP.dueDateFrom} >= $${idx++}`);
    values.push(filters.dueDateFrom);
    dueDateFiltered = true;
  }
  if (filters.dueDateTo !== undefined) {
    where.push(`${FILTER_COLUMN_MAP.dueDateTo} <= $${idx++}`);
    values.push(filters.dueDateTo);
    dueDateFiltered = true;
  }
  if (dueDateFiltered) {
    where.push('due_date IS NOT NULL');
  }

  const sql = `SELECT ${SELECT_COLUMNS} FROM todos WHERE ${where.join(' AND ')} ORDER BY created_at DESC`;
  const { rows } = await pool.query(sql, values);
  return rows.map(toCamel);
}

async function findById(todoId) {
  const { rows } = await pool.query(
    `SELECT ${SELECT_COLUMNS} FROM todos WHERE todo_id = $1`,
    [todoId]
  );
  return toCamel(rows[0]);
}

async function updateById(todoId, fields) {
  const setClauses = [];
  const values = [];
  let idx = 1;
  const map = {
    title: 'title',
    description: 'description',
    dueDate: 'due_date',
    categoryId: 'category_id',
    isCompleted: 'is_completed',
    completedAt: 'completed_at',
  };
  for (const [key, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      setClauses.push(`${col} = $${idx++}`);
      values.push(fields[key]);
    }
  }
  if (setClauses.length === 0) return findById(todoId);
  values.push(todoId);
  const { rows } = await pool.query(
    `UPDATE todos SET ${setClauses.join(', ')} WHERE todo_id = $${idx}
     RETURNING ${SELECT_COLUMNS}`,
    values
  );
  return toCamel(rows[0]);
}

async function deleteById(todoId) {
  await pool.query('DELETE FROM todos WHERE todo_id = $1', [todoId]);
}

module.exports = { insertOne, findAllByUserId, findById, updateById, deleteById };
