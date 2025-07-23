const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const nodemailer = require('nodemailer');
const router = express.Router();

// EMAIL SETUP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

// ───────────────────────────────
// 🔐 SIGNUP: /api/user/signup
// ───────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password, isAdmin } = req.body;
    if (!name || !email || !phone || !password) {
      return res.json({ success: false, message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.json({ success: false, message: "User already exists" });
      } else {
        return res.json({ success: false, message: "User exists but not verified. Please verify.", existingUserId: existingUser._id });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      otp,
      otpExpires,
      isAdmin: isAdmin || false,
    });

    await newUser.save();

    // Send OTP email
    await transporter.sendMail({
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: 'Verify your account',
      html: `<p>Your OTP is <b>${otp}</b>. It expires in 10 minutes.</p>`,
    });

    return res.json({ success: true, message: "OTP sent", existingUserId: newUser._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Signup failed" });
  }
});

// ───────────────────────────────
// ✅ VERIFY OTP: /api/user/verifyemail
// ───────────────────────────────
router.post('/verifyemail', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId);

    if (!user) return res.json({ success: false, message: "User not found" });
    if (user.isVerified) return res.json({ success: false, message: "Already verified" });
    if (user.otp !== otp) return res.json({ success: false, message: "Invalid OTP" });
    if (user.otpExpires < new Date()) return res.json({ success: false, message: "OTP expired" });

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    return res.json({ success: true, message: "Account verified" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
});

// ───────────────────────────────
// 🔁 RESEND OTP: /api/user/verifyAccount/resendOtp
// ───────────────────────────────
router.post('/verifyAccount/resendOtp', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.json({ success: false, message: "User not found" });
    if (user.isVerified) return res.json({ success: false, message: "User already verified" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await transporter.sendMail({
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: 'Resend OTP',
      html: `<p>Your new OTP is <b>${otp}</b>.</p>`,
    });

    return res.json({ success: true, message: "OTP resent", otp, existingUserId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Resend OTP failed" });
  }
});

module.exports = router;
