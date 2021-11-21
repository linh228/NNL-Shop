const ErrorHandle = require("../utils/errorhandle");

module.exports = (err, req, res, next) =>{
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal server error";

    //Wrong Mongodb Id error
    if(err.name === "CastError"){
        const message = `Resource not fount. Invalid: ${err.path}`;
        err = new ErrorHandle(message, 400);
    }

    //Mongoose duplicate key error
    if(err.code === 11000){
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
        err = new ErrorHandle(message, 400);
    }

    //Wrong JWT error
    if(err.name === "JsonWebTokenError"){
        const message = `Json Web Token is invalid, try again: ${err.path}`;
        err = new ErrorHandle(message, 400);
    }

    //JWT exprie error
    if(err.name === "TokenExpiredError"){
        const message = `Json Web Token is expired, try again: ${err.path}`;
        err = new ErrorHandle(message, 400);
    }

    res.status(err.statusCode).json({
        success: false,
        message: err.message,
    });
}