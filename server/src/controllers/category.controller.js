const categoryService = require('../services/category.service');

async function list(req, res, next) {
  try {
    const categories = await categoryService.listForUser(req.user.userId);
    res.status(200).json({ categories });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, colorCode } = req.body;
    const category = await categoryService.create(req.user.userId, { name, colorCode });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
}

async function patch(req, res, next) {
  try {
    const { name, colorCode } = req.body;
    const updated = await categoryService.update(req.user.userId, req.params.categoryId, { name, colorCode });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await categoryService.remove(req.user.userId, req.params.categoryId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, patch, remove };