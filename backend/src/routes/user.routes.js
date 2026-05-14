const express = require('express');

const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const userController = require('../controllers/user.controller');

const router = express.Router();

router.get('/me', auth, userController.getMe);
router.patch('/me', auth, userController.patchMe);
router.delete('/me', auth, userController.deleteMe);
router.patch(
  '/me/password',
  auth,
  validate({ body: { currentPassword: 'password', newPassword: 'password' } }),
  userController.changePassword,
);

module.exports = router;
