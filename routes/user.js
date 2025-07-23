const express = require("express");
const router  = express.Router();

const User    = require("../models/user");
const bcrypt  = require("bcrypt");
const jwt     = require("jsonwebtoken");

const { sendEmail } = require("../utils/emailService");

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─── SIGNUP ──────────────────────────────────────────────────
router.post("/signup", async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ success:false, message:"All fields required" });
  }

  try {
    if (await User.findOne({ email })) {
      return res.status(400).json({
        success: false,
        message: "User already exist with this email!"
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    const otp    = generateOTP();

    const user = new User({
      name,
      email,
      phone,
      password: hashed,
      otp,
      otpExpires: Date.now() + 600000,
      isVerified: false
    });
    await user.save();

    await sendEmail(
      email,
      "OTP Verification",
      "",
      `<p>Your verification code is <strong>${otp}</strong></p>`
    );

    res.status(200).json({
      success: true,
      message: "OTP sent",
      otp,           // remove this before production
      userId: user._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error during signup"
    });
  }
});

// ─── RESEND OTP ───────────────────────────────────────────────
router.post("/verifyAccount/resendOtp", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success:false, message:"Email required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success:false, message:"User not found" });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 600000;
    await user.save();

    await sendEmail(
      email,
      "Resend OTP",
      "",
      `<p>Your new OTP is <strong>${otp}</strong></p>`
    );

    res.status(200).json({
      success: true,
      message: "OTP sent again",
      otp,                // remove before production
      userId: user._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error while resending OTP"
    });
  }
});

// ─── VERIFY OTP AND LOGIN ──────────────────────────────────────
router.post("/verifyemail", async (req, res) => {
  const { userId, otp } = req.body;
  if (!userId || !otp) {
    return res.status(400).json({ success:false, message:"userId and otp required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success:false, message:"User not found" });
    }

    if (user.otp !== otp || Date.now() > user.otpExpires) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP or OTP expired"
      });
    }

    // Mark user as verified
    user.isVerified  = true;
    user.otp         = null;
    user.otpExpires  = null;
    await user.save();

    // Create JWT token
    const token = jwt.sign({ id: user._id }, process.env.JSON_WEB_TOKEN_SECRET_KEY, {
      expiresIn: "7d",
    });

    // Prepare user data to send (exclude sensitive info)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      images: user.images || [],
    };

    res.status(200).json({
      success: true,
      message: "Account verified and logged in",
      token,
      user: userData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error during verification"
    });
  }
});

module.exports = router;
