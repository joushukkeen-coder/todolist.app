const express = require('express');

const validate = require('../middlewares/validate');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.post(
  '/register',
  validate({
    body: {
      email: 'email',
      password: 'password',
      name: 'title',
    },
  }),
  authController.register
);

router.post(
  '/login',
  validate({
    body: {
      email: 'email',
      password: 'password',
    },
  }),
  authController.login
);

module.exports = router;
