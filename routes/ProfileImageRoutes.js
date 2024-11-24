const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../controllers/LoginController');
const { uploadProfileImage } = require('../middlewares/UploadMiddleware');
const profileImageController = require('../controllers/ProfileImageController');

router.post('/upload', isAuthenticated, uploadProfileImage, profileImageController.uploadProfileImage);
router.delete('/delete', isAuthenticated, profileImageController.deleteProfileImage);

module.exports = router;