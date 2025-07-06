const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Access denied. No user role found.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied. Role ${req.user.role} is not authorized.` });
    }
    next();
  };
};

module.exports = authorizeRoles;