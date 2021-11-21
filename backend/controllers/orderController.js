const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const ErrorHandle = require("../utils/errorhandle");
const cathAsyncError = require("../middleware/cathAsyncError");

//Create new order
exports.newOrder = cathAsyncError(async(req, res, next)=>{
    const {
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
    } = req.body;

    const order = await Order.create({
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paidAt: Date.now(),
        user: req.user._id,
    });
    res.status(201).json({
        success: true,
        order,
    });
});

//Get single order
exports.getSingleOrder = cathAsyncError(async(req, res, next)=>{
    const order = await Order.findById(req.params.id).populate(
        "user", 
        "name email"
    );
    if(!order){
        return next(new ErrorHandle("Order not found with this Id", 404));
    }

    res.status(200).json({
        success: true,
        order
    });
});

//Get logged in user orders
exports.myOrders = cathAsyncError(async(req, res, next)=>{
    const orders = await Order.find({user: req.user._id});

    res.status(200).json({
        success: true,
        orders
    });
});

//Get all orders -- Admin
exports.getAllOrders = cathAsyncError(async(req, res, next)=>{
    const orders = await Order.find();
    let totalAmount = 0;
    orders.forEach(order=>{
        totalAmount += order.totalPrice;
    });

    res.status(200).json({
        success: true,
        totalAmount,
        orders
    });
});

//update order status -- Admin
exports.updateOrder = cathAsyncError(async(req, res, next)=>{
    const order = await Order.findById(req.params.id);
    if(!order){
        return next(new ErrorHandle("Order not found with this Id", 404));
    }

    if(order.orderStatus === "Delivered"){
        return next(new ErrorHandle("You have already delivered this order", 400));
    }

    order.orderItems.forEach(async(o)=>{
        await updateStock(o.product, o.quantity);
    });

    order.orderStatus = req.body.status;
    if(req.body.status === "Delivered"){
        order.deliveredAt = Date.now();
    }

    await order.save({validateBeforeSave: false});
    res.status(200).json({
        success: true,
    });
});

async function updateStock(id, quantity){
    const product = await Product.findById(id);
    product.stock -= quantity;
    await product.save({validateBeforeSave: false});
}

//Delete order -- Admin
exports.deleteOrder = cathAsyncError(async(req, res, next)=>{
    const order = await Order.findById(req.params.id);
    if(!order){
        return next(new ErrorHandle("Order not found with this Id", 404));
    }
    await order.remove()
    res.status(200).json({
        success: true,
    });
});