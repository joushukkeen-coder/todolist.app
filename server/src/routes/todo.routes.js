const express = require('express');

const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const todoController = require('../controllers/todo.controller');

const router = express.Router();

router.get(
  '/',
  auth,
  validate({
    query: {
      categoryId: { rule: 'uuid', optional: true },
      isCompleted: { rule: 'boolean', optional: true },
      dueDateFrom: { rule: 'date', optional: true },
      dueDateTo: { rule: 'date', optional: true },
    },
  }),
  todoController.list
);

router.post(
  '/',
  auth,
  validate({
    body: {
      title: 'title',
      categoryId: 'uuid',
    },
  }),
  todoController.create
);

router.patch(
  '/:todoId',
  auth,
  validate({ params: { todoId: 'uuid' } }),
  todoController.patch
);

router.delete(
  '/:todoId',
  auth,
  validate({ params: { todoId: 'uuid' } }),
  todoController.remove
);

router.patch(
  '/:todoId/complete',
  auth,
  validate({ params: { todoId: 'uuid' } }),
  todoController.complete
);

router.patch(
  '/:todoId/reopen',
  auth,
  validate({ params: { todoId: 'uuid' } }),
  todoController.reopen
);

module.exports = router;
