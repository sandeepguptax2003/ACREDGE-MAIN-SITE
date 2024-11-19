const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const { isAuthenticated } = require('../controllers/LoginController');

router.put('/profile', isAuthenticated, userController.updateProfile);
router.get('/profile', isAuthenticated, userController.getProfile);

module.exports = router;