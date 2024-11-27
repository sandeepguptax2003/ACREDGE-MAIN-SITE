const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const FILE_LIMITS = {
  profileImage: 5 * 1024 * 1024,     // 5MB for profile images
  propertyImages: 10 * 1024 * 1024,  // 10MB for property images
  propertyVideos: 50 * 1024 * 1024,  // 50MB for property videos
  propertyDocuments: 25 * 1024 * 1024 // 25MB for property documents
};

const MAX_COUNTS = {  
  propertyImages: 20,
  propertyVideos: 5,
  propertyDocuments: 10
};

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png/;
  const allowedVideoTypes = /mp4|mov/;
  const allowedDocTypes = /pdf|doc|docx|jpg|jpeg|png/;
  const ext = path.extname(file.originalname).toLowerCase().substring(1);

  try {
    switch (file.fieldname) {
      case 'profileImage':
        if (!allowedImageTypes.test(ext)) {
          throw new Error('Profile image must be JPG or PNG format');
        }
        if (file.size > FILE_LIMITS.profileImage) {
          throw new Error('Profile image size exceeds 5MB limit');
        }
        break;

      case 'images':
        if (!allowedImageTypes.test(ext)) {
          throw new Error('Property images must be JPG or PNG format');
        }
        if (file.size > FILE_LIMITS.propertyImages) {
          throw new Error('Property image size exceeds 10MB limit');
        }
        break;

      case 'videos':
        if (!allowedVideoTypes.test(ext)) {
          throw new Error('Property videos must be MP4 or MOV format');
        }
        if (file.size > FILE_LIMITS.propertyVideos) {
          throw new Error('Property video size exceeds 50MB limit');
        }
        break;

      case 'documents':
        if (!allowedDocTypes.test(ext)) {
          throw new Error('Documents must be PDF, DOC, DOCX, JPG or PNG format');
        }
        if (file.size > FILE_LIMITS.propertyDocuments) {
          throw new Error('Document size exceeds 25MB limit');
        }
        break;

      default:
        throw new Error('Invalid field name');
    }

    const existingFiles = req.files ? req.files[file.fieldname] : [];
    if (file.fieldname !== 'profileImage' && 
        existingFiles && 
        existingFiles.length >= MAX_COUNTS[file.fieldname]) {
      throw new Error(`Maximum number of ${file.fieldname} reached`);
    }

    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

// Single file upload for profile image
const uploadProfileImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_LIMITS.profileImage
  }
}).single('profileImage');

// Multiple files upload for property media
const uploadPropertyMedia = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Math.max(...Object.values(FILE_LIMITS))
  }
}).fields([
  { name: 'images', maxCount: MAX_COUNTS.propertyImages },
  { name: 'videos', maxCount: MAX_COUNTS.propertyVideos },
  { name: 'documents', maxCount: MAX_COUNTS.propertyDocuments }
]);

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: `Unexpected field: ${err.field}`
      });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
};

module.exports = {
  uploadProfileImage,
  uploadPropertyMedia,
  handleUploadError,
  FILE_LIMITS,
  MAX_COUNTS
};