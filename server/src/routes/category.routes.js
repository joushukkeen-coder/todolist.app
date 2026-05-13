const express = require('express');

const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const categoryController = require('../controllers/category.controller');

const router = express.Router();

router.get('/', auth, categoryController.list);

router.post(
  '/',
  auth,
  validate({
    body: {
      name: 'title',
      colorCode: 'colorCode',
    },
  }),
  categoryController.create
);

router.patch(
  '/:categoryId',
  auth,
  validate({
    params: { categoryId: 'uuid' },
    body: {
      name: { rule: 'title', optional: true },
      colorCode: { rule: 'colorCode', optional: true },
    },
  }),
  categoryController.patch
);

router.delete(
  '/:categoryId',
  auth,
  validate({ params: { categoryId: 'uuid' } }),
  categoryController.remove
);

module.exports = router;
