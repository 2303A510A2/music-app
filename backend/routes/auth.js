const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Playlist = require('../models/Playlist');
const ResetToken = require('../models/ResetToken');
const OtpToken = require('../models/OtpToken');

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword, petName, favoriteColor } = req.body;

    if (!fullName || !email || !password || !confirmPassword || !petName || !favoriteColor) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPetName = await bcrypt.hash(petName.toLowerCase().trim(), 10);
    const hashedFavoriteColor = await bcrypt.hash(favoriteColor.toLowerCase().trim(), 10);

    const user = new User({
      fullName,
      email,
      password: hashedPassword,
      petName: hashedPetName,
      favoriteColor: hashedFavoriteColor
    });

    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      userId: user._id
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      userId: user._id,
      fullName: user.fullName,
      email: user.email,
      isAdmin: user.isAdmin || (user.adminStatus && user.adminStatus !== 'none') || false,
      adminStatus: user.adminStatus || 'none'
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Database error' });
  }
});

// Get user profile
router.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('fullName email createdAt');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Get user error:', err.message);
    res.status(500).json({ message: 'Database error' });
  }
});

// Update username
router.put('/update-username', async (req, res) => {
  try {
    const { userId, fullName } = req.body;
    if (!userId || !fullName || !fullName.trim()) {
      return res.status(400).json({ message: 'User ID and name are required' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { fullName: fullName.trim() },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'Username updated successfully', fullName: user.fullName });
  } catch (err) {
    console.error('Update username error:', err.message);
    res.status(500).json({ message: 'Database error' });
  }
});

// Change password
router.put('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword, confirmPassword } = req.body;
    if (!userId || !currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ message: 'Database error' });
  }
});

// Change email
router.put('/change-email', async (req, res) => {
  try {
    const { userId, newEmail, password } = req.body;
    if (!userId || !newEmail || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    if (newEmail === user.email) {
      return res.status(400).json({ message: 'New email is same as current email' });
    }

    const existing = await User.findOne({ email: newEmail });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    user.email = newEmail;
    await user.save();

    res.json({ message: 'Email changed successfully', email: newEmail });
  } catch (err) {
    console.error('Change email error:', err.message);
    res.status(500).json({ message: 'Database error' });
  }
});

// Forgot password - send reset email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: 'If this email is registered, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000);

    await new ResetToken({ email, token, expiresAt }).save();

    const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`;
    const resetLink = `${baseUrl}/reset-password.html?token=${token}`;

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const mailOptions = {
        from: `"My Music" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Password Reset - My Music',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #1e1e1e; padding: 30px; border-radius: 12px;">
            <h1 style="color: #1db954; text-align: center;">My Music</h1>
            <p style="color: #fff; font-size: 16px; text-align: center;">You requested a password reset. Enter your new password below.</p>
              <form action="${baseUrl}/api/auth/reset-from-email" method="POST" style="margin: 20px 0;">
              <input type="hidden" name="token" value="${token}">
              <div style="margin-bottom: 15px;">
                <label for="newPassword" style="color: #fff; display: block; margin-bottom: 5px; font-size: 14px;">New Password</label>
                <input type="password" id="newPassword" name="newPassword" placeholder="Enter new password (min 6 chars)" required style="width: 100%; padding: 12px; border: none; border-radius: 6px; background: #333; color: #fff; font-size: 14px; box-sizing: border-box;">
              </div>
              <div style="margin-bottom: 20px;">
                <label for="confirmPassword" style="color: #fff; display: block; margin-bottom: 5px; font-size: 14px;">Confirm Password</label>
                <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm new password" required style="width: 100%; padding: 12px; border: none; border-radius: 6px; background: #333; color: #fff; font-size: 14px; box-sizing: border-box;">
              </div>
              <div style="text-align: center;">
                <button type="submit" style="background: #1db954; color: #000; border: none; padding: 14px 32px; border-radius: 24px; font-weight: 600; font-size: 16px; cursor: pointer;">Reset Password</button>
              </div>
            </form>
            <p style="color: #b3b3b3; font-size: 13px; text-align: center;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
          </div>
        `
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error('Failed to send reset email:', err.message);
          console.log('Reset link (console fallback):');
          console.log(`  ${resetLink}\n`);
        } else {
          console.log(`Password reset email sent to ${email}: ${info.messageId}`);
        }
      });
    } else {
      console.log('SMTP not configured. Reset link (console fallback):');
      console.log(`  ${resetLink}\n`);
    }

    res.json({ message: 'If this email is registered, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ message: 'Error generating reset token' });
  }
});

// Reset password using token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const resetToken = await ResetToken.findOne({ token, used: false, expiresAt: { $gt: new Date() } });
    if (!resetToken) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.updateOne({ email: resetToken.email }, { password: hashedPassword });
    resetToken.used = true;
    await resetToken.save();

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ message: 'Database error' });
  }
});

// Reset password from email form
router.post('/reset-from-email', async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.send(`
        <html><body style="background:#1e1e1e;color:#fff;font-family:Arial;text-align:center;padding:50px;">
          <h2 style="color:#ff4444;">Error</h2>
          <p>All fields are required.</p>
          <a href="http://localhost:5000/login.html" style="color:#1db954;">Back to Login</a>
        </body></html>
      `);
    }

    if (newPassword !== confirmPassword) {
      return res.send(`
        <html><body style="background:#1e1e1e;color:#fff;font-family:Arial;text-align:center;padding:50px;">
          <h2 style="color:#ff4444;">Error</h2>
          <p>Passwords do not match.</p>
          <a href="http://localhost:5000/login.html" style="color:#1db954;">Back to Login</a>
        </body></html>
      `);
    }

    if (newPassword.length < 6) {
      return res.send(`
        <html><body style="background:#1e1e1e;color:#fff;font-family:Arial;text-align:center;padding:50px;">
          <h2 style="color:#ff4444;">Error</h2>
          <p>Password must be at least 6 characters.</p>
          <a href="http://localhost:5000/login.html" style="color:#1db954;">Back to Login</a>
        </body></html>
      `);
    }

    const resetToken = await ResetToken.findOne({ token, used: false, expiresAt: { $gt: new Date() } });
    if (!resetToken) {
      return res.send(`
        <html><body style="background:#1e1e1e;color:#fff;font-family:Arial;text-align:center;padding:50px;">
          <h2 style="color:#ff4444;">Error</h2>
          <p>Invalid or expired reset token.</p>
          <a href="http://localhost:5000/forgot-password.html" style="color:#1db954;">Request a new reset</a>
        </body></html>
      `);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.updateOne({ email: resetToken.email }, { password: hashedPassword });
    resetToken.used = true;
    await resetToken.save();

    res.send(`
      <html><body style="background:#1e1e1e;color:#fff;font-family:Arial;text-align:center;padding:50px;">
        <div style="max-width:400px;margin:0 auto;background:#282828;padding:40px;border-radius:12px;">
          <h1 style="color:#1db954;">✓ Password Reset!</h1>
          <p style="color:#b3b3b3;margin:20px 0;">Your password has been changed successfully.</p>
          <p style="color:#fff;">You can now log in with your new password.</p>
          <a href="http://localhost:5000/login.html" style="display:inline-block;background:#1db954;color:#000;text-decoration:none;padding:14px 32px;border-radius:24px;font-weight:600;font-size:16px;margin-top:20px;">Go to Login</a>
        </div>
      </body></html>
    `);
  } catch (err) {
    console.error('Reset from email error:', err.message);
    res.send(`
      <html><body style="background:#1e1e1e;color:#fff;font-family:Arial;text-align:center;padding:50px;">
        <h2 style="color:#ff4444;">Error</h2>
        <p>Error processing request.</p>
        <a href="http://localhost:5000/login.html" style="color:#1db954;">Back to Login</a>
      </body></html>
    `);
  }
});

// Send OTP to email
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 600000);

    await OtpToken.updateMany({ email, used: false }, { used: true });
    await new OtpToken({ email, otp, expiresAt }).save();

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const mailOptions = {
        from: `"My Music" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Your OTP for Password Reset - My Music',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #1e1e1e; padding: 30px; border-radius: 12px;">
            <h1 style="color: #1db954; text-align: center;">My Music</h1>
            <p style="color: #fff; font-size: 16px; text-align: center;">Your OTP for password reset is:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="font-size: 42px; font-weight: 700; color: #1db954; letter-spacing: 8px; background: #282828; padding: 20px; border-radius: 8px; border: 2px solid #1db954;">${otp}</div>
            </div>
            <p style="color: #b3b3b3; font-size: 13px; text-align: center;">This OTP expires in 10 minutes. If you didn't request this, ignore this email.</p>
          </div>
        `
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error('Failed to send OTP email:', err.message);
          console.log('OTP (console fallback):', otp);
        } else {
          console.log(`OTP email sent to ${email}: ${info.messageId}`);
        }
      });
    } else {
      console.log('SMTP not configured. OTP (console fallback):', otp);
    }

    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error('Send OTP error:', err.message);
    res.status(500).json({ message: 'Error generating OTP' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const token = await OtpToken.findOne({ email, otp, used: false, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
    if (!token) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.json({ message: 'OTP verified successfully', verified: true });
  } catch (err) {
    console.error('Verify OTP error:', err.message);
    res.status(500).json({ message: 'Database error' });
  }
});

// Reset password with OTP
router.post('/reset-with-otp', async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const token = await OtpToken.findOne({ email, otp, used: false, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
    if (!token) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.updateOne({ email }, { password: hashedPassword });
    token.used = true;
    await token.save();

    res.json({ message: 'Password reset successful. Please log in again.' });
  } catch (err) {
    console.error('Reset with OTP error:', err.message);
    res.status(500).json({ message: 'Database error' });
  }
});

// Get security questions
router.post('/get-security-questions', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    res.json({
      message: 'Security questions found',
      questions: [
        'What is your pet\'s name?',
        'What is your favorite color?'
      ]
    });
  } catch (err) {
    console.error('Get security questions error:', err.message);
    res.status(500).json({ message: 'Database error' });
  }
});

// Verify security answers and generate a reset token
router.post('/verify-security', async (req, res) => {
  try {
    const { email, petName, favoriteColor } = req.body;

    if (!email || !petName || !favoriteColor) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    const petMatch = await bcrypt.compare(petName.toLowerCase().trim(), user.petName);
    const colorMatch = await bcrypt.compare(favoriteColor.toLowerCase().trim(), user.favoriteColor);

    if (!petMatch || !colorMatch) {
      return res.status(400).json({ message: 'Security answers do not match' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 600000);

    await new ResetToken({ email, token, expiresAt }).save();

    res.json({
      message: 'Security answers verified successfully',
      token
    });
  } catch (err) {
    console.error('Verify security error:', err.message);
    res.status(500).json({ message: 'Error generating token' });
  }
});

// Delete account
router.delete('/delete-account', async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ message: 'User ID and password are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    await ResetToken.deleteMany({ email: user.email });
    await OtpToken.deleteMany({ email: user.email });
    await Playlist.deleteMany({ userId: user._id });
    await User.findByIdAndDelete(userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err.message);
    res.status(500).json({ message: 'Database error' });
  }
});

// === ADMIN FLOW ===

// Admin login (only approved admins or leader)
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email, adminStatus: { $in: ['approved', 'leader'] } });
    if (!user) {
      const pendingUser = await User.findOne({ email, adminStatus: 'pending' });
      if (pendingUser) {
        return res.status(403).json({ message: 'Your admin account is waiting for approval from the Admin Leader.', status: 'pending' });
      }
      return res.status(401).json({ message: 'No admin account found with this email' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      message: 'Admin login successful',
      userId: user._id,
      fullName: user.fullName,
      email: user.email,
      isAdmin: true,
      adminStatus: user.adminStatus
    });
  } catch (err) {
    console.error('Admin login error:', err.message);
    res.status(500).json({ message: 'Database error' });
  }
});

// Request admin access (creates user with status pending)
router.post('/admin/request', async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword, petName, favoriteColor } = req.body;

    if (!fullName || !email || !password || !confirmPassword || !petName || !favoriteColor) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPetName = await bcrypt.hash(petName.toLowerCase().trim(), 10);
    const hashedFavoriteColor = await bcrypt.hash(favoriteColor.toLowerCase().trim(), 10);

    const user = new User({
      fullName,
      email,
      password: hashedPassword,
      petName: hashedPetName,
      favoriteColor: hashedFavoriteColor,
      isAdmin: true,
      adminStatus: 'pending'
    });

    await user.save();

    res.status(201).json({
      message: 'Admin access requested. Your account is waiting for approval from the Admin Leader.',
      status: 'pending'
    });
  } catch (err) {
    console.error('Admin request error:', err.message);
    res.status(500).json({ message: 'Error requesting admin access' });
  }
});

// Get pending admin requests (leader only)
router.get('/admin/requests', async (req, res) => {
  try {
    const { leaderEmail } = req.query;
    const leader = await User.findOne({ email: leaderEmail, adminStatus: 'leader' });
    if (!leader) {
      return res.status(403).json({ message: 'Only the Admin Leader can view requests' });
    }
    const requests = await User.find({ adminStatus: 'pending' }, 'fullName email createdAt');
    res.json(requests);
  } catch (err) {
    console.error('Get admin requests error:', err.message);
    res.status(500).json({ message: 'Database error' });
  }
});

// Approve admin request (leader only)
router.post('/admin/approve', async (req, res) => {
  try {
    const { leaderEmail, userId } = req.body;
    const leader = await User.findOne({ email: leaderEmail, adminStatus: 'leader' });
    if (!leader) {
      return res.status(403).json({ message: 'Only the Admin Leader can approve requests' });
    }
    const user = await User.findByIdAndUpdate(userId, { adminStatus: 'approved' }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'Admin request approved', fullName: user.fullName });
  } catch (err) {
    console.error('Approve error:', err.message);
    res.status(500).json({ message: 'Database error' });
  }
});

// Reject admin request (leader only)
router.post('/admin/reject', async (req, res) => {
  try {
    const { leaderEmail, userId } = req.body;
    const leader = await User.findOne({ email: leaderEmail, adminStatus: 'leader' });
    if (!leader) {
      return res.status(403).json({ message: 'Only the Admin Leader can reject requests' });
    }
    await User.findByIdAndDelete(userId);
    res.json({ message: 'Admin request rejected and user removed' });
  } catch (err) {
    console.error('Reject error:', err.message);
    res.status(500).json({ message: 'Database error' });
  }
});

// Get all admin users (leader only)
router.get('/admin/list', async (req, res) => {
  try {
    const { leaderEmail } = req.query;
    const leader = await User.findOne({ email: leaderEmail, adminStatus: 'leader' });
    if (!leader) {
      return res.status(403).json({ message: 'Only the Admin Leader can view admin list' });
    }
    const admins = await User.find(
      { adminStatus: { $in: ['approved', 'leader'] } },
      'fullName email adminStatus createdAt'
    );
    res.json(admins);
  } catch (err) {
    console.error('Get admin list error:', err.message);
    res.status(500).json({ message: 'Database error' });
  }
});

// Delete an admin user (leader only)
router.post('/admin/delete', async (req, res) => {
  try {
    const { leaderEmail, userId } = req.body;
    const leader = await User.findOne({ email: leaderEmail, adminStatus: 'leader' });
    if (!leader) {
      return res.status(403).json({ message: 'Only the Admin Leader can delete admins' });
    }
    if (leader._id.toString() === userId) {
      return res.status(400).json({ message: 'You cannot delete yourself' });
    }
    const target = await User.findById(userId);
    if (!target || (target.adminStatus !== 'approved' && target.adminStatus !== 'leader')) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    await User.findByIdAndDelete(userId);
    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    console.error('Delete admin error:', err.message);
    res.status(500).json({ message: 'Database error' });
  }
});

module.exports = router;
