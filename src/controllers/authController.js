const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper: Generate Access Token (short-lived)
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES }
  );
};

// Helper: Generate Refresh Token (long-lived)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES }
  );
};

// Helper: Send refresh token as httpOnly cookie
const sendRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,      // JS cannot access this cookie
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',  // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
};

// ============================
// POST /api/auth/register
// ============================
exports.register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: 'fail', message: 'Email already in use.' });
    }

    // Create user (password is hashed automatically via pre-save hook)
    const newUser = await User.create({ email, password, role });

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully.',
      data: { id: newUser._id, email: newUser.email, role: newUser.role },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ============================
// POST /api/auth/login
// ============================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check email and password provided
    if (!email || !password) {
      return res.status(400).json({ status: 'fail', message: 'Please provide email and password.' });
    }

    // 2. Find user (explicitly select password since it's excluded by default)
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ status: 'fail', message: 'Incorrect email or password.' });
    }

    // 3. Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 4. Save refresh token to database (whitelist)
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // 5. Send refresh token as secure httpOnly cookie
    sendRefreshTokenCookie(res, refreshToken);

    // 6. Send access token in response body
    res.status(200).json({
      status: 'success',
      message: 'Logged in successfully.',
      accessToken,
      data: { id: user._id, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ============================
// POST /api/auth/refresh
// ============================
exports.refresh = async (req, res) => {
  try {
    // 1. Read refresh token from httpOnly cookie
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ status: 'fail', message: 'No refresh token found. Please log in.' });
    }

    // 2. Verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ status: 'fail', message: 'Invalid or expired refresh token. Please log in again.' });
    }

    // 3. Check token against whitelist in database
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ status: 'fail', message: 'Refresh token is no longer valid. Please log in.' });
    }

    // 4. Issue new access token
    const newAccessToken = generateAccessToken(user);

    res.status(200).json({
      status: 'success',
      message: 'New access token issued.',
      accessToken: newAccessToken,
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ============================
// POST /api/auth/logout
// ============================
exports.logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      // Remove refresh token from database
      await User.findOneAndUpdate({ refreshToken: token }, { refreshToken: null });
    }
    // Clear the cookie
    res.clearCookie('refreshToken');
    res.status(200).json({ status: 'success', message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};