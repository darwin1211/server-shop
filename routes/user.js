const { User } = require("../models/user");
const { ImageUpload } = require("../models/imageUpload");
const { sendEmail } = require("../utils/emailService");

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const multer = require("multer");
const fs = require("fs");

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});

var imagesArr = [];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

router.post(`/upload`, upload.array("images"), async (req, res) => {
  imagesArr = [];

  try {
    for (let i = 0; i < req?.files?.length; i++) {
      const options = {
        use_filename: true,
        unique_filename: false,
        overwrite: false,
      };

      const img = await cloudinary.uploader.upload(
        req.files[i].path,
        options,
        function (error, result) {
          imagesArr.push(result.secure_url);
          fs.unlinkSync(`uploads/${req.files[i].filename}`);
        }
      );
    }

    let imagesUploaded = new ImageUpload({
      images: imagesArr,
    });

    imagesUploaded = await imagesUploaded.save();
    return res.status(200).json(imagesArr);
  } catch (error) {
    console.error("Error in image upload:", error);
    return res.status(500).json({ success: false, message: "Server error during image upload" });
  }
});

router.post(`/signup`, async (req, res) => {
  const { name, phone, email, password, isAdmin } = req.body;

  try {
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    let user;

    const existingUser = await User.findOne({ email: email });
    const existingUserByPh = await User.findOne({ phone: phone });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    if (existingUserByPh) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this phone number",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    user = new User({
      name,
      email,
      phone,
      password: hashPassword,
      isAdmin,
      otp: verifyCode,
      otpExpires: Date.now() + 600000, // 10 minutes
    });

    await user.save();

    const emailSent = await sendEmailFun(
      email,
      "Verify Email",
      "",
      "Your OTP is " + verifyCode
    );

    if (!emailSent) {
      return res.status(500).json({ success: false, message: "Failed to send verification email" });
    }

    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JSON_WEB_TOKEN_SECRET_KEY
    );

    return res.status(200).json({
      success: true,
      message: "User registered successfully! Please verify your email.",
      token: token,
    });
  } catch (error) {
    console.error("Error in signup:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post(`/verifyAccount/resendOtp`, async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    existingUser.otp = verifyCode;
    existingUser.otpExpires = Date.now() + 600000; // 10 minutes
    await existingUser.save();

    const emailSent = await sendEmailFun(
      email,
      "Verify Email",
      "",
      "Your OTP is " + verifyCode
    );

    if (!emailSent) {
      return res.status(500).json({ success: false, message: "Failed to send OTP email" });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      existingUserId: existingUser._id,
    });
  } catch (error) {
    console.error("Error in resendOtp:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.put(`/verifyAccount/emailVerify/:id`, async (req, res) => {
  const { email, otp } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: existingUser.name,
        email: email,
        phone: existingUser.phone,
        password: existingUser.password,
        images: existingUser.images,
        isAdmin: existingUser.isAdmin,
        isVerified: existingUser.isVerified,
        otp: otp,
        otpExpires: Date.now() + 600000,
      },
      { new: true }
    );

    const emailSent = await sendEmailFun(
      email,
      "Verify Email",
      "",
      "Your OTP is " + otp
    );

    if (!emailSent) {
      return res.status(500).json({ success: false, message: "Failed to send verification email" });
    }

    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      process.env.JSON_WEB_TOKEN_SECRET_KEY
    );

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      token: token,
    });
  } catch (error) {
    console.error("Error in emailVerify:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

const sendEmailFun = async (to, subject, text, html) => {
  const result = await sendEmail(to, subject, text, html);
  return result.success;
};

router.post("/verifyemail", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    const isCodeValid = user.otp === otp;
    const isNotExpired = user.otpExpires > Date.now();

    if (isCodeValid && isNotExpired) {
      user.isVerified = true;
      user.otp = null;
      user.otpExpires = null;
      await user.save();
      return res.status(200).json({ success: true, message: "OTP verified successfully" });
    } else if (!isCodeValid) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    } else {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }
  } catch (err) {
    console.error("Error in verifyEmail:", err);
    return res.status(500).json({ success: false, message: "Error in verifying email" });
  }
});

router.post(`/signin`, async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!existingUser.isVerified) {
      return res.status(403).json({
        success: false,
        isVerify: false,
        message: "Your account is not verified. Please verify your account first or sign up with a new user",
      });
    }

    const matchPassword = await bcrypt.compare(password, existingUser.password);
    if (!matchPassword) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      process.env.JSON_WEB_TOKEN_SECRET_KEY
    );

    return res.status(200).json({
      user: existingUser,
      token: token,
      message: "User authenticated successfully",
    });
  } catch (error) {
    console.error("Error in signin:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.put(`/changePassword/:id`, async (req, res) => {
  const { name, phone, email, password, newPass, images } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const matchPassword = await bcrypt.compare(password, existingUser.password);
    if (!matchPassword) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    const newPassword = newPass ? await bcrypt.hash(newPass, 10) : existingUser.password;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: name,
        phone: phone,
        email: email,
        password: newPassword,
        images: images,
      },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({ success: false, message: "User cannot be updated" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error in changePassword:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get(`/`, async (req, res) => {
  try {
    const userList = await User.find();
    return res.status(200).json(userList);
  } catch (error) {
    console.error("Error in get users:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("Error in get user by ID:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error in delete user:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get(`/get/count`, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    return res.status(200).json({ userCount });
  } catch (error) {
    console.error("Error in get user count:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post(`/authWithGoogle`, async (req, res) => {
  const { name, phone, email, password, images, isAdmin } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });
    if (!existingUser) {
      const result = await User.create({
        name,
        phone,
        email,
        password,
        images,
        isAdmin,
        isVerified: true,
      });

      const token = jwt.sign(
        { email: result.email, id: result._id },
        process.env.JSON_WEB_TOKEN_SECRET_KEY
      );

      return res.status(200).json({
        user: result,
        token: token,
        message: "User login successfully",
      });
    } else {
      const token = jwt.sign(
        { email: existingUser.email, id: existingUser._id },
        process.env.JSON_WEB_TOKEN_SECRET_KEY
      );

      return res.status(200).json({
        user: existingUser,
        token: token,
        message: "User login successfully",
      });
    }
  } catch (error) {
    console.error("Error in authWithGoogle:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.put("/:id", async (req, res) => {
  const { name, phone, email } = req.body;

  try {
    const userExist = await User.findById(req.params.id);
    if (!userExist) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const newPassword = req.body.password
      ? await bcrypt.hash(req.body.password, 10)
      : userExist.password;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name,
        phone,
        email,
        password: newPassword,
        images: imagesArr,
      },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({ success: false, message: "User cannot be updated" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error in update user:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/deleteImage", async (req, res) => {
  try {
    const imgUrl = req.query.img;
    const urlArr = imgUrl.split("/");
    const image = urlArr[urlArr.length - 1];
    const imageName = image.split(".")[0];

    const response = await cloudinary.uploader.destroy(imageName);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in deleteImage:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post(`/forgotPassword`, async (req, res) => {
  const { email } = req.body;

  try {
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    const existingUser = await User.findOne({ email: email });

    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    existingUser.otp = verifyCode;
    existingUser.otpExpires = Date.now() + 600000; // 10 minutes
    await existingUser.save();

    const emailSent = await sendEmailFun(
      email,
      "Verify Email",
      "",
      "Your OTP is " + verifyCode
    );

    if (!emailSent) {
      return res.status(500).json({ success: false, message: "Failed to send OTP email" });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post(`/forgotPassword/changePassword`, async (req, res) => {
  const { email, newPass } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const hashPassword = await bcrypt.hash(newPass, 10);
    existingUser.password = hashPassword;
    await existingUser.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error in forgotPassword/changePassword:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;