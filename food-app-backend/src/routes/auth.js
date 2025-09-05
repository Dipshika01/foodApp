import express from "express";
import bcrypt from "bcrypt";         // ok if you installed bcrypt; bcryptjs also works
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();


const router = express.Router();

// signup (for dev)
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role, country } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role, country });
    res.status(201).json({ id: user._id, email: user.email });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// login (hardened)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    // same error msg for both cases (don’t leak which field is wrong)
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    if (!process.env.JWT_SECRET) {
      // fail fast if secret is missing (this would otherwise throw)
      return res.status(500).json({ error: "Server config error: JWT secret missing" });
    }

    const token = jwt.sign(
  {
    id: user._id.toString(),  
    role: user.role,         
    country: user.country,
    email: user.email,
  },
  process.env.JWT_SECRET,
  { expiresIn: "8h" }
);

    // return token + minimal user info (what the UI needs)
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        country: user.country,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Something went wrong while logging in" });
  }
});

export default router;
