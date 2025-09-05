export const requireRole = (...allowed) => (req, res, next) => {
  const role = String(req.user?.role || "").toLowerCase();
  const ok = allowed.map(r => r.toLowerCase()).includes(role);
  if (!ok) return res.status(403).json({ error: "Forbidden" });
  next();
};