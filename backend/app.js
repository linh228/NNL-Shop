const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();

const errorMiddleware = require("./middleware/error");

app.use(express.json());
app.use(cookieParser());

//Route Improts
const product = require("./routes/productRoute");
const user = require("./routes/userRoute");
const order = require("./routes/orderRoute");

app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);

//Middle for errors
app.use(errorMiddleware);

module.exports = app