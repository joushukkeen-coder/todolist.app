const express = require('express');

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const categoryRoutes = require('./category.routes');
const todoRoutes = require('./todo.routes');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ name: 'TodoListApp API', version: 'v1', docs: '/api-docs' });
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/todos', todoRoutes);

module.exports = router;
