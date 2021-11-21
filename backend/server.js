const app = require("./app");
const dotenv = require("dotenv");
const connectDatabase = require("./config/database");

//Handling Uncaught Exception
process.on("uncaughtException", (err)=>{
    console.log(`Error: ${err.message}`);
    console.log("Shutting down the server due to Uncaught Exception");
    process.exit(1);
});

//config
dotenv.config({path:"backend/config/config.env"});

//connectting
connectDatabase();


const server = app.listen(process.env.PORT, ()=>{

    console.log(`Server is working on http://localhost:${process.env.PORT}`)
});

//Unhandled Promise Rejectiton
process.on("unhandledRejection", err=>{
    console.log(`Error: ${err.message}`);
    console.log("Shutting down the server due to Unhandled Promise Rejectiton");
    server.close(()=>{
        process.exit(1);
    });
});