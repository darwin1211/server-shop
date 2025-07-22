const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmailFun = require("../utils/sendEmail"); // adjust path if needed

// Generate OTP helper
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ===================
// User Sign Up
// ===================
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exist with this email!",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      otp,
      otpExpires: Date.now() + 600000, // 10 mins
      isVerified: false,
    });

    await newUser.save();
    await sendEmailFun(email, "OTP Verification", "", "Your OTP is: " + otp);

    res.status(200).json({
      success: true,
      message: "OTP sent",
      otp,
      userId: newUser._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error during signup",
    });
  }
});

// ===================
// Resend OTP
// ===================
router.post("/verifyAccount/resendOtp", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const newOTP = generateOTP();
    user.otp = newOTP;
    user.otpExpires = Date.now() + 600000; // 10 mins
    await user.save();

    await sendEmailFun(email, "Resend OTP", "", "Your new OTP is: " + newOTP);

    res.status(200).json({
      success: true,
      message: "OTP sent again",
      otp: newOTP,
      existingUserId: user._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error while resending OTP",
    });
  }
});

// ===================
// Verify OTP
// ===================
router.post("/verifyemail", async (req, res) => {
  const { userId, otp } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.otp !== otp || Date.now() > user.otpExpires) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP or OTP expired",
      });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Account verified",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error during verification",
    });
  }
});

module.exports = router;
