module.exports = (req, res, next) => {
  if (!req.user || !req.user.tenantId) {
    return res.status(403).json({ message: "Tenant context missing" });
  }

  // Attach tenantId to request context
  req.tenantId = req.user.tenantId;
  next();
};
