const ErrorHandle = require("../utils/errorhandle");
const cathAsyncError = require("../middleware/cathAsyncError");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const cloudinary = require("cloudinary");


//Register a user
exports.registerUser = cathAsyncError(async(req, res, next)=>{

    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
    });

    const {name, email, password} = req.body;
    const user = await User.create({
        name, email, password,
        avatar:{
            public_id: "public id",
            url: "url"
        }
    });

    sendToken(user, 201, res);
});

//Login user
exports.loginUser = cathAsyncError(async(req, res, next)=>{
    const {email, password} = req.body;
    
    //cheking
    if(!email || !password){
        return next(new ErrorHandle("Please enter email and password", 400));
    }

    const user = await User.findOne({email}).select("+password");
    if(!user){
        return next(new ErrorHandle("Invalid email", 401));
    }

    const isPasswordMatched = await user.comparePassword(password);
    if(!isPasswordMatched){
        return next(new ErrorHandle("Invalid password", 401));
    }

    sendToken(user, 200, res);
});

//Logout
exports.logout = cathAsyncError(async(req, res, next)=>{
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true
    })

    res.status(200).json({
        success: true,
        message: "Logged out"
    });
});

//Forgot password
exports.forgotPassword = cathAsyncError(async(req, res, next)=>{
    const user = await User.findOne({email: req.body.email});
    if(!user){
        return next(new ErrorHandle("User not found", 404));
    }

    //Get resetPassword Token
    const resetToken = user.getResetPasswordToken();
    await user.save({validateBeforeSave: false});
    const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`;
    const message = `Truy cập vào đường dẫn để đặt lại mật khẩu: \n\n ${resetPasswordUrl}
    \nNếu bạn không yêu cầu đặt lại mật khẩu vui lòng bỏ qua tin nhắn này`;
    try {
        await sendEmail({
            email: user.email,
            subject: `Đặt lại mật khẩu NNL Shop`,
            message
        });

        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email} successfully`
        });
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({validateBeforeSave: false});
        return next(new ErrorHandle(error.message, 500));
    }
});

//Reset password
exports.resetPassword = cathAsyncError(async(req, res, next)=>{

    //creating token hash
    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");
    
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire:{$gt: Date.now()},
    });
    if(!user){
        return next(new ErrorHandle("Reset password token invalid or has been expried", 404));
    }
    if(req.body.password !== req.body.confirmPassword){
        return next(new ErrorHandle("Password does not password", 404));
    }
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    sendToken(user, 200, res);
});

//Get user detail
exports.getUserDetails = cathAsyncError(async(req, res, next)=>{
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        user
    });
});

//Update user password
exports.updatePassword = cathAsyncError(async(req, res, next)=>{
    const user = await User.findById(req.user.id).select("+password");
    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);
    if(!isPasswordMatched){
        return next(new ErrorHandle("Old password is incorret", 400));
    }

    if(req.body.newPassword !== req.body.confirmPassword){
        return next(new ErrorHandle("Password does not math", 400));
    }

    user.password = req.body.newPassword;
    await user.save();
    sendToken(user, 200, res);
});

//Update user profile
exports.updateProfile = cathAsyncError(async(req, res, next)=>{
    const newUserData={
        name: req.body.name,
        email: req.body.email
    }

    //We will add cloudinary later
    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });
    res.status(200).json({
        success: true
    });
});

//Get all users -- Admin
exports.getAllUsers = cathAsyncError(async(req, res, next)=>{
    const users = await User.find();

    res.status(200).json({
        success: true,
        users,
    })
});

//Get single user -- Admin
exports.getSingleUser = cathAsyncError(async(req, res, next)=>{
    const user = await User.findById(req.params.id);

    if(!user){
        return next(new ErrorHandle(`User is not exist with Id: ${req.params.id}`, 400));
    }

    res.status(200).json({
        success: true,
        user,
    })
});

//Update user role -- Admin
exports.updateUserRole = cathAsyncError(async(req, res, next)=>{
    const newUserData={
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }

    //We will add cloudinary later
    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });
    if(!user){
        return next(new ErrorHandle(`User is not exist with Id: ${req.params.id}`, 400));
    }
    res.status(200).json({
        success: true
    });
});

//Delete user -- Admin
exports.deleteUser = cathAsyncError(async(req, res, next)=>{
    const user = await User.findById(req.params.id);

    if(!user){
        return next(new ErrorHandle(`User is not exist with Id: ${req.params.id}`, 400));
    }

    await user.remove();
    
    res.status(200).json({
        success: true,
        message: "User deleted successfully"
    });
});