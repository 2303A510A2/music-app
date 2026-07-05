const connectDB = require('../database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    await connectDB();

    const email = process.env.ADMIN_EMAIL || 'metebharath4@gmail.com';
    const plainPassword = process.env.ADMIN_PASSWORD || '141414';
    const fullName = process.env.ADMIN_FULLNAME || 'Meteb Bharath';

    const hashed = await bcrypt.hash(plainPassword, 10);

    const update = {
      fullName,
      email,
      password: hashed,
      isAdmin: true,
      adminStatus: 'owner'
    };

    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
    const user = await User.findOneAndUpdate({ email }, update, opts);

    console.log('Admin user created/updated:');
    console.log(`  id: ${user._id}`);
    console.log(`  email: ${user.email}`);
    console.log(`  isAdmin: ${user.isAdmin}`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin user:', err.message || err);
    process.exit(1);
  }
}

createAdmin();
