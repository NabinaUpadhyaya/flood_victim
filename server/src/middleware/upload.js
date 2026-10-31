/**
 * Multer File Upload Middleware for Flood Victim Photos
 * Validates file format (JPEG, JPG, PNG) and file size (max 5MB).
 * Stores uploaded photos in server/uploads/victims/
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, '../../uploads/victims');

// Ensure destination directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `victim-${uniqueSuffix}${ext}`);
  },
});

// File Format Filter (JPEG, JPG, PNG only)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png'];
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const ext = path.extname(file.originalname).toLowerCase();

  const isExtValid = allowedExtensions.includes(ext);
  const isMimeValid = allowedMimeTypes.includes(file.mimetype.toLowerCase());

  if (isExtValid && isMimeValid) {
    cb(null, true);
  } else {
    const error = new Error('अमान्य फाइल ढाँचा! कृपया JPEG, JPG वा PNG ढाँचाको फोटो मात्र अपलोड गर्नुहोस्। (Only JPEG, JPG, and PNG files are allowed)');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 Megabytes
  },
});

// Middleware for handling optional photo upload on endpoints
function uploadPhotoMiddleware(req, res, next) {
  const uploadSingle = upload.single('photo');

  uploadSingle(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'फोटोको आकार ५ MB भन्दा बढी हुन सक्दैन। (Photo file size cannot exceed 5MB)',
        });
      }
      return res.status(400).json({
        success: false,
        message: `फोटो अपलोड त्रुटि: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next();
  });
}

module.exports = {
  upload,
  uploadPhotoMiddleware,
  UPLOADS_DIR,
};
