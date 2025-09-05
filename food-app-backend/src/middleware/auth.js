import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || req.headers.Authorization || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m) {
      return res.status(401).json({ error: "Missing token" });
    }

    const token = m[1];

    let payload;
    try {
      if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET not set");
        return res.status(500).json({ error: "Server misconfigured" });
      }
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      console.error("JWT verify failed:", e.message);
      return res.status(401).json({ error: "Invalid token" });
    }

    const userId = payload.id || payload._id || payload.userId;
    console.log("userId from token:", userId);
    if (!userId) {
      console.error("Token payload missing user id:", payload);
      return res.status(401).json({ error: "Invalid token" });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // normalize for the rest of the app
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,       // "ADMIN" | "MANAGER" | "MEMBER"
      country: user.country, // "India" | "America"
      name: user.name,
    };

    next();
  } catch (err) {
    console.error("requireAuth fatal:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
}
