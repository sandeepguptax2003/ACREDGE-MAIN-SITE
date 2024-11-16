const express = require('express');
const router = express.Router();
const authController = require('../controllers/LoginController');

router.post('/verify-firebase-token', authController.verifyFirebaseToken);
router.post('/logout', authController.isAuthenticated, authController.logout);
router.get('/check-auth', authController.isAuthenticated, (req, res) => {
  res.status(200).json({ message: "Authenticated", user: req.user });
});

module.exports = router;