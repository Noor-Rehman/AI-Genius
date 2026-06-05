// Factory function: restrictTo('Admin', 'Premium_User')
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: `Access denied. This route is restricted to: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

module.exports = { restrictTo };