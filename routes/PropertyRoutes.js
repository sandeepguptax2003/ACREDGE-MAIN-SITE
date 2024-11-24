const express = require('express');
const router = express.Router();
const PropertyController = require('../controllers/PropertyController');
const { isAuthenticated } = require('../controllers/LoginController');
const { uploadPropertyMedia } = require('../middlewares/UploadMiddleware');

// Routes with file upload support
router.post('/', isAuthenticated, uploadPropertyMedia, PropertyController.createProperty);
router.put('/:id', isAuthenticated, uploadPropertyMedia, PropertyController.updateProperty);
router.delete('/:id', isAuthenticated, PropertyController.deleteProperty);

// Regular routes
router.get('/', isAuthenticated, PropertyController.getProperties);
router.get('/:id', isAuthenticated, PropertyController.getProperty);

module.exports = router;