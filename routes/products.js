const { Category } = require("../models/category.js");
const { Product } = require("../models/products.js");
const { MyList } = require("../models/myList");
const { Cart } = require("../models/cart");
const { RecentlyViewd } = require("../models/recentlyViewd.js");
const { ImageUpload } = require("../models/imageUpload.js");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const mongoose = require("mongoose");

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});

let imagesArr = []; // Moved to local scope where needed to avoid concurrency issues

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
  let imagesArr = []; // Local scope
  try {
    for (let i = 0; i < req.files?.length; i++) {
      const options = {
        use_filename: true,
        unique_filename: false,
        overwrite: false,
      };

      const img = await cloudinary.uploader.upload(
        req.files[i].path,
        options,
        function (error, result) {
          if (error) throw error;
          imagesArr.push(result.secure_url);
          fs.unlinkSync(`uploads/${req.files[i].filename}`);
        }
      );
    }

    let imagesUploaded = new ImageUpload({
      images: imagesArr,
    });

    imagesUploaded = await imagesUploaded.save();
    if (!imagesUploaded) {
      return res.status(500).json({ message: 'Failed to save images', success: false });
    }

    return res.status(200).json(imagesArr);
  } catch (error) {
    console.error('Error in /api/products/upload:', error.stack);
    return res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

router.get(`/`, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage);
    const totalPosts = await Product.countDocuments();
    const totalPages = Math.ceil(totalPosts / perPage);

    if (page > totalPages) {
      return res.status(404).json({ message: "Page not found", success: false });
    }

    let productList = [];

    if (req.query.page !== undefined && req.query.perPage !== undefined) {
      if (req.query.location !== undefined) {
        const productListArr = await Product.find()
          .populate("category")
          .skip((page - 1) * perPage)
          .limit(perPage)
          .exec();

        for (let i = 0; i < productListArr.length; i++) {
          for (let j = 0; j < productListArr[i].location.length; j++) {
            if (productListArr[i].location[j].value === req.query.location) {
              productList.push(productListArr[i]);
            }
          }
        }
      } else {
        productList = await Product.find()
          .populate("category")
          .skip((page - 1) * perPage)
          .limit(perPage)
          .exec();
      }
    } else {
      productList = await Product.find().populate("category");
    }

    return res.status(200).json({
      products: productList,
      totalPages: totalPages,
      page: page,
      success: true
    });
  } catch (error) {
    console.error('Error in /api/products:', error.stack);
    return res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

router.get(`/catName`, async (req, res) => {
  try {
    let productList = [];

    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage);
    const totalPosts = await Product.countDocuments();
    const totalPages = Math.ceil(totalPosts / perPage);

    if (page > totalPages) {
      return res.status(404).json({ message: "Page not found", success: false });
    }

    if (req.query.page !== undefined && req.query.perPage !== undefined) {
      const productListArr = await Product.find({ catName: req.query.catName })
        .populate("category")
        .skip((page - 1) * perPage)
        .limit(perPage)
        .exec();

      return res.status(200).json({
        products: productListArr,
        totalPages: totalPages,
        page: page,
        success: true
      });
    } else {
      const productListArr = await Product.find({ catName: req.query.catName })
        .populate("category")
        .skip((page - 1) * perPage)
        .limit(perPage)
        .exec();

      for (let i = 0; i < productListArr.length; i++) {
        for (let j = 0; j < productListArr[i].location.length; j++) {
          if (productListArr[i].location[j].value === req.query.location) {
            productList.push(productListArr[i]);
          }
        }
      }

      if (req.query.location !== "All") {
        return res.status(200).json({
          products: productList,
          totalPages: totalPages,
          page: page,
          success: true
        });
      } else {
        return res.status(200).json({
          products: productListArr,
          totalPages: totalPages,
          page: page,
          success: true
        });
      }
    }
  } catch (error) {
    console.error('Error in /api/products/catName:', error.stack);
    return res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

router.get(`/catId`, async (req, res) => {
  try {
    let productList = [];
    let productListArr = [];

    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage);
    const totalPosts = await Product.countDocuments();
    const totalPages = Math.ceil(totalPosts / perPage);

    if (page > totalPages) {
      return res.status(404).json({ message: "Page not found", success: false });
    }

    if (req.query.page !== undefined && req.query.perPage !== undefined) {
      productListArr = await Product.find({ catId: req.query.catId })
        .populate("category")
        .skip((page - 1) * perPage)
        .limit(perPage)
        .exec();

      return res.status(200).json({
        products: productListArr,
        totalPages: totalPages,
        page: page,
        success: true
      });
    } else {
      productListArr = await Product.find({ catId: req.query.catId }).populate("category");

      for (let i = 0; i < productListArr.length; i++) {
        for (let j = 0; j < productListArr[i].location.length; j++) {
          if (productListArr[i].location[j].value === req.query.location) {
            productList.push(productListArr[i]);
          }
        }
      }

      if (req.query.location !== "All" && req.query.location !== undefined) {
        return res.status(200).json({
          products: productList,
          totalPages: totalPages,
          page: page,
          success: true
        });
      } else {
        return res.status(200).json({
          products: productListArr,
          totalPages: totalPages,
          page: page,
          success: true
        });
      }
    }
  } catch (error) {
    console.error('Error in /api/products/catId:', error.stack);
    return res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

router.get(`/subCatId`, async (req, res) => {
  try {
    let productList = [];

    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage);
    const totalPosts = await Product.countDocuments();
    const totalPages = Math.ceil(totalPosts / perPage);

    if (page > totalPages) {
      return res.status(404).json({ message: "Page not found", success: false });
    }

    if (req.query.page !== undefined && req.query.perPage !== undefined) {
      const productListArr = await Product.find({ subCatId: req.query.subCatId })
        .populate("category")
        .skip((page - 1) * perPage)
        .limit(perPage)
        .exec();

      return res.status(200).json({
        products: productListArr,
        totalPages: totalPages,
        page: page,
        success: true
      });
    } else {
      const productListArr = await Product.find({ subCatId: req.query.subCatId }).populate("category");

      for (let i = 0; i < productListArr.length; i++) {
        for (let j = 0; j < productListArr[i].location.length; j++) {
          if (productListArr[i].location[j].value === req.query.location) {
            productList.push(productListArr[i]);
          }
        }
      }

      if (req.query.location !== "All") {
        return res.status(200).json({
          products: productList,
          totalPages: totalPages,
          page: page,
          success: true
        });
      } else {
        return res.status(200).json({
          products: productListArr,
          totalPages: totalPages,
          page: page,
          success: true
        });
      }
    }
  } catch (error) {
    console.error('Error in /api/products/subCatId:', error.stack);
    return res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

router.get(`/fiterByPrice`, async (req, res) => {
  try {
    let productList = [];

    if (req.query.catId !== "" && req.query.catId !== undefined) {
      const productListArr = await Product.find({
        catId: req.query.catId,
      }).populate("category");

      if (req.query.location !== "All") {
        for (let i = 0; i < productListArr.length; i++) {
          for (let j = 0; j < productListArr[i].location.length; j++) {
            if (productListArr[i].location[j].value === req.query.location) {
              productList.push(productListArr[i]);
            }
          }
        }
      } else {
        productList = productListArr;
      }
    } else if (req.query.subCatId !== "" && req.query.subCatId !== undefined) {
      const productListArr = await Product.find({
        subCatId: req.query.subCatId,
      }).populate("category");

      if (req.query.location !== "All") {
        for (let i = 0; i < productListArr.length; i++) {
          for (let j = 0; j < productListArr[i].location.length; j++) {
            if (productListArr[i].location[j].value === req.query.location) {
              productList.push(productListArr[i]);
            }
          }
        }
      } else {
        productList = productListArr;
      }
    }

    const filteredProducts = productList.filter((product) => {
      if (req.query.minPrice && product.price < parseInt(+req.query.minPrice)) {
        return false;
      }
      if (req.query.maxPrice && product.price > parseInt(+req.query.maxPrice)) {
        return false;
      }
      return true;
    });

    return res.status(200).json({
      products: filteredProducts,
      totalPages: 0,
      page: 0,
      success: true
    });
  } catch (error) {
    console.error('Error in /api/products/fiterByPrice:', error.stack);
    return res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

router.get(`/rating`, async (req, res) => {
  try {
    let productList = [];

    if (req.query.catId !== "" && req.query.catId !== undefined) {
      const productListArr = await Product.find({
        catId: req.query.catId,
        rating: req.query.rating,
      }).populate("category");

      if (req.query.location !== "All") {
        for (let i = 0; i < productListArr.length; i++) {
          for (let j = 0; j < productListArr[i].location.length; j++) {
            if (productListArr[i].location[j].value === req.query.location) {
              productList.push(productListArr[i]);
            }
          }
        }
      } else {
        productList = productListArr;
      }
    } else if (req.query.subCatId !== "" && req.query.subCatId !== undefined) {
      const productListArr = await Product.find({
        subCatId: req.query.subCatId,
        rating: req.query.rating,
      }).populate("category");

      if (req.query.location !== "All") {
        for (let i = 0; i < productListArr.length; i++) {
          for (let j = 0; j < productListArr[i].location.length; j++) {
            if (productListArr[i].location[j].value === req.query.location) {
              productList.push(productListArr[i]);
            }
          }
        }
      } else {
        productList = productListArr;
      }
    }

    return res.status(200).json({
      products: productList,
      totalPages: 0,
      page: 0,
      success: true
    });
  } catch (error) {
    console.error('Error in /api/products/rating:', error.stack);
    return res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

router.get(`/get/count`, async (req, res) => {
  try {
    const productsCount = await Product.countDocuments();
    return res.status(200).json({
      productsCount: productsCount,
      success: true
    });
  } catch (error) {
    console.error('Error in /api/products/get/count:', error.stack);
    return res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

router.get(`/featured`, async (req, res) => {
  try {
    let productList = [];
    if (req.query.location !== undefined && req.query.location !== null) {
      const productListArr = await Product.find({ isFeatured: true }).populate("category");

      for (let i = 0; i < productListArr.length; i++) {
        for (let j = 0; j < productListArr[i].location.length; j++) {
          if (productListArr[i].location[j].value === req.query.location) {
            productList.push(productListArr[i]);
          }
        }
      }
    } else {
      productList = await Product.find({ isFeatured: true }).populate("category");
    }

    return res.status(200).json({
      products: productList,
      success: true
    });
  } catch (error) {
    console.error('Error in /api/products/featured:', error.stack);
    return res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

router.get(`/recentlyViewd`, async (req, res) => {
  try {
    const productList = await RecentlyViewd.find(req.query).populate("category");
    return res.status(200).json({
      products: productList,
      success: true
    });
  } catch (error) {
    console.error('Error in /api/products/recentlyViewd:', error.stack);
    return res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

router.post(`/recentlyViewd`, async (req, res) => {
  try {
    let findProduct = await RecentlyViewd.find({ prodId: req.body.id });

    if (findProduct.length === 0) {
      const product = new RecentlyViewd({
        prodId: req.body.id,
        name: req.body.name,
        description: req.body.description,
        images: req.body.images,
        brand: req.body.brand,
        price: req.body.price,
        oldPrice: req.body.oldPrice,
        subCatId: req.body.subCatId,
        catName: req.body.catName,
        subCat: req.body.subCat,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        isFeatured: req.body.isFeatured,
        discount: req.body.discount,
        productRam: req.body.productRam,
        size: req.body.size,
        productWeight: req.body.productWeight,
      });

      const savedProduct = await product.save();
      if (!savedProduct) {
        return res.status(500).json({ message: 'Failed to save recently viewed product', success: false });
      }

      return res.status(201).json(savedProduct);
    }
    return res.status(200).json({ message: 'Product already in recently viewed', success: true });
  } catch (error) {
    console.error('Error in /api/products/recentlyViewd:', error.stack);
    return res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

router.post(`/create`, async (req, res) => {
  try {
    // Validate category ID
    if (!mongoose.isValidObjectId(req.body.category)) {
      return res.status(400).json({ message: 'Invalid Category ID', success: false });
    }
    const category = await Category.findById(req.body.category);
    if (!category) {
      return res.status(404).json({ message: 'Category not found', success: false });
    }

    // Fetch images from ImageUpload
    const images_Array = [];
    const uploadedImages = await ImageUpload.find();
    uploadedImages?.forEach((item) => {
      item.images?.forEach((image) => {
        images_Array.push(image);
      });
    });

    // Validate required fields
    const requiredFields = ['name', 'description', 'price', 'category', 'rating', 'isFeatured'];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        return res.status(400).json({ message: `Missing required field: ${field}`, success: false });
      }
    }

    // Create product
    const product = new Product({
      name: req.body.name,
      description: req.body.description,
      images: images_Array,
      brand: req.body.brand || '',
      price: parseFloat(req.body.price) || 0,
      oldPrice: req.body.oldPrice ? parseFloat(req.body.oldPrice) : null,
      catId: req.body.catId || '',
      catName: req.body.catName || '',
      subCat: req.body.subCat || '',
      subCatId: req.body.subCatId || '',
      subCatName: req.body.subCatName || '',
      category: req.body.category,
      countInStock: req.body.countInStock ? parseInt(req.body.countInStock) : null,
      rating: parseInt(req.body.rating) || 0,
      isFeatured: req.body.isFeatured === true || req.body.isFeatured === 'true',
      discount: req.body.discount ? parseFloat(req.body.discount) : null,
      productRam: Array.isArray(req.body.productRam) ? req.body.productRam : [],
      size: Array.isArray(req.body.size) ? req.body.size : [],
      productWeight: Array.isArray(req.body.productWeight) ? req.body.productWeight : [],
      location: Array.isArray(req.body.location) ? req.body.location : ['All'],
    });

    const savedProduct = await product.save();
    if (!savedProduct) {
      return res.status(500).json({ message: 'Failed to save product', success: false });
    }

    let imagesArr = []; // Local scope

    return res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error in /api/products/create:', error.stack);
    return res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Product ID', success: false });
    }
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) {
      return res.status(404).json({ message: 'The product with the given ID was not found', success: false });
    }
    return res.status(200).json(product);
  } catch (error) {
    console.error('Error in /api/products/:id:', error.stack);
    return res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

router.delete("/deleteImage", async (req, res) => {
  try {
    const imgUrl = req.query.img;
    if (!imgUrl) {
      return res.status(400).json({ message: 'Image URL is required', success: false });
    }

    const urlArr = imgUrl.split("/");
    const image = urlArr[urlArr.length - 1];
    const imageName = image.split(".")[0];

    const response = await cloudinary.uploader.destroy(imageName);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error in /api/products/deleteImage:', error.stack);
    return res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Product ID', success: false });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found', success: false });
    }

    const images = product.images;
    for (const img of images) {
      const urlArr = img.split("/");
      const image = urlArr[urlArr.length - 1];
      const imageName = image.split(".")[0];
      if (imageName) {
        await cloudinary.uploader.destroy(imageName);
      }
    }

    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    const myListItems = await MyList.find({ productId: req.params.id });
    for (const item of myListItems) {
      await MyList.findByIdAndDelete(item.id);
    }

    const cartItems = await Cart.find({ productId: req.params.id });
    for (const item of cartItems) {
      await Cart.findByIdAndDelete(item.id);
    }

    return res.status(200).json({
      message: 'Product Deleted',
      success: true
    });
  } catch (error) {
    console.error('Error in /api/products/:id (DELETE):', error.stack);
    return res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Product ID', success: false });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        subCat: req.body.subCat,
        description: req.body.description,
        images: req.body.images,
        brand: req.body.brand,
        price: req.body.price,
        oldPrice: req.body.oldPrice,
        catId: req.body.catId,
        subCatId: req.body.subCatId,
        subCatName: req.body.subCatName,
        catName: req.body.catName,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
        productRam: req.body.productRam,
        size: req.body.size,
        productWeight: req.body.productWeight,
        location: req.body.location,
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'The product cannot be updated', success: false });
    }

    let imagesArr = []; // Local scope

    return res.status(200).json({
      message: 'The product is updated',
      success: true,
      product
    });
  } catch (error) {
    console.error('Error in /api/products/:id (PUT):', error.stack);
    return res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

module.exports = router;