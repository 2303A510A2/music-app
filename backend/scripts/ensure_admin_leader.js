const connectDB = require('../database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function ensureLeader() {
  try {
    await connectDB();

    const email = process.env.ADMIN_EMAIL || 'metebharath4@gmail.com';
    const plainPassword = process.env.ADMIN_PASSWORD || '141414';
    const fullName = process.env.ADMIN_FULLNAME || 'Meteb Bharath';

    const hashed = await bcrypt.hash(plainPassword, 10);

    const update = {
      fullName,
      password: hashed,
      isAdmin: true,
      adminStatus: 'leader'
    };

    const opts = { new: true };
    const user = await User.findOneAndUpdate({ email }, update, opts);

    if (user) {
      console.log('User updated to leader:');
      console.log(`  id: ${user._id}`);
      console.log(`  email: ${user.email}`);
      console.log(`  isAdmin: ${user.isAdmin}`);
      console.log(`  adminStatus: ${user.adminStatus}`);
      process.exit(0);
    } else {
      console.log('User not found, creating new leader user');
      const newUser = new User({ fullName, email, password: hashed, isAdmin: true, adminStatus: 'leader' });
      await newUser.save();
      console.log('Created user:', newUser._id);
      process.exit(0);
    }
  } catch (err) {
    console.error('Error ensuring leader:', err.message || err);
    process.exit(1);
  }
}

ensureLeader();
