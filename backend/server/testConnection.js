require('dotenv').config();              // will pick up server/.env
const mongoose = require('mongoose');

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('✅ Minimal script: Connected to MongoDB!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Minimal script: Failed to connect:\n', err);
    process.exit(1);
  });
