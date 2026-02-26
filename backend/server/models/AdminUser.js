// server/models/AdminUser.js
const mongoose = require('mongoose');

const AdminUserSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminUser', AdminUserSchema);
