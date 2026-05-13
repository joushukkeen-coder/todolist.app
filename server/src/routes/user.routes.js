const express = require('express');

const auth = require('../middlewares/auth');
const userController = require('../controllers/user.controller');

const router = express.Router();

router.get('/me', auth, userController.getMe);
router.patch('/me', auth, userController.patchMe);
router.delete('/me', auth, userController.deleteMe);

module.exports = router;
