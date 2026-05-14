const todoService = require('../services/todo.service');

async function create(req, res, next) {
  try {
    const todo = await todoService.create(req.user.userId, req.body);
    res.status(201).json(todo);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const filters = {};
    if (req.query.categoryId !== undefined) filters.categoryId = req.query.categoryId;
    if (req.query.isCompleted !== undefined) filters.isCompleted = req.query.isCompleted === 'true';
    if (req.query.dueDateFrom !== undefined) filters.dueDateFrom = req.query.dueDateFrom;
    if (req.query.dueDateTo !== undefined) filters.dueDateTo = req.query.dueDateTo;

    const todos = await todoService.listForUser(req.user.userId, filters);
    res.status(200).json({ todos });
  } catch (err) {
    next(err);
  }
}

async function patch(req, res, next) {
  try {
    const updated = await todoService.update(req.user.userId, req.params.todoId, req.body);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await todoService.remove(req.user.userId, req.params.todoId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function complete(req, res, next) {
  try {
    const todo = await todoService.complete(req.user.userId, req.params.todoId);
    res.status(200).json(todo);
  } catch (err) {
    next(err);
  }
}

async function reopen(req, res, next) {
  try {
    const todo = await todoService.reopen(req.user.userId, req.params.todoId);
    res.status(200).json(todo);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, patch, remove, complete, reopen };
