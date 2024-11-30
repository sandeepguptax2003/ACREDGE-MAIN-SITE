const express = require('express');
const router = express.Router();
const PropertyController = require('../controllers/PropertyController');
const { isAuthenticated } = require('../controllers/LoginController');
const { uploadPropertyMedia } = require('../middlewares/UploadMiddleware');

router.post('/', isAuthenticated, uploadPropertyMedia, PropertyController.createProperty);
router.put('/:id', isAuthenticated, uploadPropertyMedia, PropertyController.updateProperty);
router.get('/', isAuthenticated, PropertyController.getProperties);
router.get('/:id', isAuthenticated, PropertyController.getProperty);
router.delete('/:id', isAuthenticated, PropertyController.deleteProperty);

module.exports = router;

//route for crossauth system
// const { verifyAdminForUserRoutes } = require('../shared/crossSiteAuth');
// router.get('/private', verifyAdminForUserRoutes, PropertyController.getProperties);