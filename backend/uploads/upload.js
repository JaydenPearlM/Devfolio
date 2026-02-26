const multer = require('multer');
const path = require('path');

// Set up destination & file naming
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Local folder
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  }
});

// Filter for image and video types
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|mp4|webm|mov|avi|zip/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
