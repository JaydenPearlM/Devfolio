const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const Admin    = require('./models/Admin');
require('dotenv').config();

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  const hash = await bcrypt.hash('resU_nimda', 12);
  await new Admin({ username: 'admin_User', passwordHash: hash }).save();
  console.log('✅ Admin user created');
  mongoose.disconnect();
}

seed();

