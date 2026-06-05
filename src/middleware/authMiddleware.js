const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  // 1. Check if Authorization header exists
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'fail',
      message: 'You are not logged in. Please log in to get access.',
    });
  }

  // 2. Extract the token
  const token = authHeader.split(' ')[1];

  // 3. Verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user payload to request
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Your access token has expired. Please refresh your token.',
      });
    }
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid token. Please log in again.',
    });
  }
};

module.exports = { protect };