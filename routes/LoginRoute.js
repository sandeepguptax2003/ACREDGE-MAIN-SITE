const express = require('express');
const router = express.Router();
const authController = require('../controllers/LoginController');

router.get('/check-login-status', authController.checkLoginStatus);
router.post('/login', authController.login);
router.post('/logout', authController.isAuthenticated, authController.logout);
router.get('/check-auth', authController.isAuthenticated, (req, res) => {
  res.status(200).json({ message: "Authenticated", user: req.user });
});

module.exports = router;