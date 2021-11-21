const Product = require("../models/productModel");
const ErrorHandle = require("../utils/errorhandle");
const cathAsyncError = require("../middleware/cathAsyncError");
const ApiFeatures = require("../utils/apifeatures");

//Create product -- Admin
exports.createProduct = cathAsyncError(async (req, res, next)=>{
    req.body.user = req.user.id

    const product = await Product.create(req.body);
    res.status(201).json({
        success: true,
        product
    });
});

//Get all product
exports.getAllProducts = cathAsyncError(async(req, res) =>{

    const resultPerPage = 5;
    const productCount = await Product.countDocuments();

    const apiFeatures = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter()
    .pagination(resultPerPage);
    const products = await apiFeatures.query;
    res.status(200).json({
        success: true,
        products
    });
});

//Get product details
exports.getProductDetails = cathAsyncError(async(req, res, next)=>{
    const product = await Product.findById(req.params.id);
    if(!product){
        return next(new ErrorHandle("Product not found", 404));
    }
    res.status(200).json({
        success: true,
        product,
        productCount
    });
});

//Update product -- Admin
exports.updateProduct = cathAsyncError(async(req, res, next)=>{
    let product = await Product.findById(req.params.id);
    if(!product){
        return next(new ErrorHandle("Product not found", 404));
    }
    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });
    res.status(200).json({
        success: true,
        product
    });
});

//Delete Product -- Admin
exports.deleteProduct = cathAsyncError(async(req, res, next)=>{
    const product = await Product.findById(req.params.id);
    if(!product){
        return next(new ErrorHandle("Product not found", 404));
    }
    await product.remove();
    res.status(200).json({
        success: true,
        message: "Delete product successful"
    });
});

//Create new review or update review
exports.createProductReview = cathAsyncError(async(req, res, next)=>{
    const {rating, comment, productId} = req.body;
    const review ={
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment,
    };
    const product = await Product.findById(productId);
    const isReviewed = product.reviews.find(
        rev=>rev.user.toString()===req.user._id.toString()
    );
    if(isReviewed){
        product.reviews.forEach(rev=>{
            if(rev.user.toString()===req.user._id.toString())
                (rev.rating = rating), (rev.comment = comment);
        });
    }
    else{
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length;
    }
    let avg = 0;
    product.reviews.forEach(rev=>{
        avg += rev.rating;
    });
    product.ratings = avg/product.reviews.length;
    await product.save({validateBeforeSave: false});
    res.status(200).json({
        success:true
    });
});

//Get all reviews of a product
exports.getProductReviews = cathAsyncError(async(req, res, next)=>{
    const product = await Product.findById(req.query.productId);
    if(!product){
        return next(new ErrorHandle("Product not found", 404));
    }
    res.status(200).json({
        success:true,
        reviews: product.reviews,
    });
});

//Delete review
exports.deleteReview = cathAsyncError(async(req, res, next)=>{
    const product = await Product.findById(req.query.productId);
    if(!product){
        return next(new ErrorHandle("Product not found", 404));
    }
    const reviews = product.reviews.filter( 
        (rev) => rev._id.toString() !== req.query.id.toString()
    );
    let avg = 0;
    reviews.forEach(rev=>{
        avg += rev.rating;
    });
    const ratings = avg/reviews.length;
    const numOfReviews = reviews.length;

    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        ratings,
        numOfReviews
    },{
        new: true,
        runValidators: true,
        useFindAndModify: false
    });
    res.status(200).json({
        success:true,
    });
});