const express = require("express");
const { getAllProducts, createProduct, deleteProduct, updateProduct, getProductDetails, createProductReview, getProductReviews, deleteReview } = require("../controllers/productController");
const router = express.Router();
const {isAuthenticatedUser, authorizeRoles} = require("../middleware/auth");

router.route("/products").get(getAllProducts);

router.route("/product/:id").get(getProductDetails);

router.route("/admin/product/new").post(isAuthenticatedUser, authorizeRoles("admin"), createProduct);

router.route("/admin/product/:id")
.put(isAuthenticatedUser, authorizeRoles("admin"), updateProduct)
.delete(isAuthenticatedUser, authorizeRoles("admin"), deleteProduct)

router.route("/review").put(isAuthenticatedUser, createProductReview);

router.route("/reviews")
.get(getProductReviews)
.delete(isAuthenticatedUser, deleteReview);

module.exports = router