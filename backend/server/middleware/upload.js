import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

/*
  Upload Middleware
  Handles project file uploads for the portfolio admin.
*/

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always resolves to backend/server/uploads/ regardless of where
// the server process was started from
const uploadDir = path.resolve(__dirname, "../uploads");

// ensure upload folder exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/\s+/g, "_");

    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      "-" +
      cleanName;

    cb(null, uniqueName);
  },
});

// multer instance
const upload = multer({
  storage,
  limits: {
    fileSize: 150 * 1024 * 1024, // 150MB
  },
});

export default upload;