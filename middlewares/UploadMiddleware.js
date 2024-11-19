const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const FILE_LIMITS = {
  profileImage: 5 * 1024 * 1024  // 5MB limit for profile images
};

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png/;
  const ext = path.extname(file.originalname).toLowerCase().substring(1);

  if (!allowedImageTypes.test(ext)) {
    return cb(new Error('Only JPG and PNG images are allowed'), false);
  }

  if (file.size > FILE_LIMITS.profileImage) {
    return cb(new Error('File size exceeds 5MB limit'), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_LIMITS.profileImage
  }
}).single('profileImage');

module.exports = { upload };