// require('dotenv').config({path: './.env'})
import dotenv from 'dotenv';
import connectDB from "./db/index.js";
import { app } from './app.js';

dotenv.config({
    path:'./.env'
});

const PORT=process.env.PORT || 8000;

connectDB()
.then(()=>{
    // Start the server
    app.listen(PORT, ()=>{
        console.log(`Server is running at port : ${PORT}`);
    })
})
.catch((err)=>{
    console.log("MONGO db connection failed !!! ",err);
})

// method 1 for connecting to database.
/*
import mongoose from "mongoose";
import {DB_NAME} from "./constants";
import express from "express";
const app=express();

(async()=>{
    try{
        await mongoose.connect(`${process.env.MONGOOSE_URI}/${DB_NAME}`)
        
        // This registers an event listener for the "error" event on the app object.
        // It's saying: "If an error occurs on the app, run this function."

        app.on("error", (error)=>{
            console.log("ERROR: ", error);
            throw error;
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    }
    catch(error){
        console.error("ERROR: ", error);
        throw err;  // check this once..
    }
})()
*/